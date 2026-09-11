import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithStaffPin } from '@/lib/auth/service';
import { signSession, getSessionCookieOptions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { sanitizeInput } from '@/lib/security/crypto';
import { findStaffAccessCode, markStaffAccessCodeUsed } from '@/lib/db/repositories/staff-code.repository';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const lockoutKey = `staff-pin:${ip}`;

    // 1. Check progressive lockout status
    const lockoutStatus = rateLimiter.isLockedOut(lockoutKey);
    if (lockoutStatus.locked) {
      return NextResponse.json(
        { 
          success: false, 
          error: `تم قفل محاولات الدخول مؤقتاً لأسباب أمنية. يرجى الانتظار ${Math.ceil(lockoutStatus.remainingSeconds / 60)} دقيقة.` 
        },
        { status: 429, headers: { 'Retry-After': String(lockoutStatus.remainingSeconds) } }
      );
    }

    // 2. Sliding window check: max 5 PIN attempts per minute per IP
    const rateLimit = rateLimiter.check(lockoutKey, 5, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار ${rateLimit.resetInSeconds} ثانية.` 
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
      );
    }

    const body = await request.json();
    const { pin, branchId } = body;

    const pinStr = sanitizeInput(String(pin || '')).trim();

    if (!pinStr || pinStr.length < 4 || pinStr.length > 8) {
      return NextResponse.json(
        { success: false, error: 'رمز الدخول مطلوب (بين 4 و 8 أرقام)' },
        { status: 400 }
      );
    }

    // === 6-DIGIT ONE-TIME ACCESS CODE PATH ===
    if (pinStr.length === 6 && /^\d{6}$/.test(pinStr)) {
      try {
        const record = await findStaffAccessCode(pinStr, branchId);

        if (record) {
          // Mark code as used immediately (single-use)
          await markStaffAccessCodeUsed(record.id);

          rateLimiter.recordSuccess(lockoutKey);

          const sessionPayload = {
            userId: record.id,
            staffUserId: record.id,
            name: record.employee_name,
            role: record.role as 'staff' | 'kitchen' | 'branch_manager',
            branchId: record.branch_id,
            restaurantId: '',
            restaurantSlug: '',
          };

          const token = await signSession(sessionPayload, 60 * 60 * 24); // 24 hours

          const response = NextResponse.json({
            success: true,
            user: {
              id: record.id,
              name: record.employee_name,
              role: record.role,
              branchId: record.branch_id,
            },
            redirectTo: '/staff',
          });

          response.cookies.set({
            ...getSessionCookieOptions(60 * 60 * 24),
            value: token,
          });

          return response;
        }
      } catch (err) {
        console.warn('6-digit code lookup failed, checking normal PIN:', err);
      }
    }

    // === NORMAL PIN PATH (staff_users.pin_hash) ===
    const authResult = await authenticateWithStaffPin(pinStr, branchId);

    if (!authResult.success || !authResult.session) {
      // Record failed attempt for progressive lockout (5 failures -> 15 min lock)
      rateLimiter.recordFailure(lockoutKey, 5, 15);
      return NextResponse.json(
        { success: false, error: authResult.error || 'رمز الـ PIN غير صحيح، يرجى التأكد من الرمز المدخل' },
        { status: 401 }
      );
    }

    // Reset failure count on success
    rateLimiter.recordSuccess(lockoutKey);

    const token = await signSession(authResult.session, 60 * 60 * 24);

    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.session.userId,
        name: authResult.session.name,
        role: authResult.session.role,
        branchId: authResult.session.branchId,
      },
      redirectTo: '/staff',
    });

    response.cookies.set({
      ...getSessionCookieOptions(60 * 60 * 24),
      value: token,
    });

    return response;
  } catch (error) {
    console.error('Staff PIN route error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء فحص الرمز' },
      { status: 500 }
    );
  }
}
