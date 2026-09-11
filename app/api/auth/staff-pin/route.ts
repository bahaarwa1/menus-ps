import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithStaffPin } from '@/lib/auth/service';
import { signSession, getSessionCookieOptions } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { sanitizeInput } from '@/lib/security/crypto';
import { findStaffAccessCode, markStaffAccessCodeUsed } from '@/lib/db/repositories/staff-code.repository';
import { isSupabaseConfigured } from '@/lib/supabase/config';

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
    const { pin, branchId: providedBranchId, restaurantSlug: providedSlug } = body;

    const pinStr = sanitizeInput(String(pin || '')).trim();

    if (!pinStr || pinStr.length < 4 || pinStr.length > 8) {
      return NextResponse.json(
        { success: false, error: 'رمز الدخول مطلوب (بين 4 و 8 أرقام)' },
        { status: 400 }
      );
    }

    let branchId = providedBranchId;
    let resolvedSlug = providedSlug ? String(providedSlug).trim().toLowerCase() : '';
    let resolvedName = '';
    let resolvedRestId = '';

    // If restaurantSlug is provided, resolve its branchId
    if (resolvedSlug && !branchId && isSupabaseConfigured()) {
      try {
        const adminSb = createAdminClient();
        const { data: rData } = await (adminSb as any)
          .from('restaurants')
          .select('id, name, slug, branches(id, is_active)')
          .eq('slug', resolvedSlug)
          .maybeSingle();
        if (rData) {
          resolvedRestId = rData.id;
          resolvedName = rData.name;
          const branches = Array.isArray(rData.branches) ? rData.branches : (rData.branches ? [rData.branches] : []);
          const activeBranch = branches.find((b: any) => b.is_active) || branches[0];
          if (activeBranch?.id) branchId = activeBranch.id;
        }
      } catch {}
    }

    // Helper to enrich restaurant info from branchId if still missing
    const enrichRestaurant = async (bId: string) => {
      if ((!resolvedSlug || !resolvedName) && isSupabaseConfigured() && bId) {
        try {
          const adminSb = createAdminClient();
          const { data: bData } = await (adminSb as any)
            .from('branches')
            .select('restaurant_id, restaurants(id, name, slug)')
            .eq('id', bId)
            .maybeSingle();
          if (bData) {
            resolvedRestId = bData.restaurant_id || resolvedRestId;
            resolvedSlug = bData.restaurants?.slug || resolvedSlug;
            resolvedName = bData.restaurants?.name || resolvedName;
          }
        } catch {}
      }
    };

    // === 1. 6-DIGIT ONE-TIME / STAFF ACCESS CODE PATH ===
    if (pinStr.length === 6 && /^\d{6}$/.test(pinStr)) {
      try {
        const record = await findStaffAccessCode(pinStr, branchId);

        if (record) {
          await markStaffAccessCodeUsed(record.id);
          rateLimiter.recordSuccess(lockoutKey);
          await enrichRestaurant(record.branch_id);

          const sessionPayload = {
            userId: record.id,
            staffUserId: record.id,
            name: record.employee_name,
            role: record.role as 'staff' | 'kitchen' | 'branch_manager',
            branchId: record.branch_id,
            restaurantId: resolvedRestId,
            restaurantSlug: resolvedSlug,
            restaurantName: resolvedName,
          };

          const token = await signSession(sessionPayload, 60 * 60 * 24); // 24 hours
          const targetUrl = resolvedSlug ? `/staff/${resolvedSlug}` : '/staff';

          const response = NextResponse.json({
            success: true,
            user: {
              id: record.id,
              name: record.employee_name,
              role: record.role,
              branchId: record.branch_id,
              restaurantSlug: resolvedSlug,
              restaurantName: resolvedName,
            },
            redirectTo: targetUrl,
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

    // === 2. NORMAL PIN PATH (staff_users.pin_hash) ===
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
    const targetBranch = authResult.session.branchId || branchId;
    if (targetBranch) await enrichRestaurant(targetBranch);

    const sessionPayload = {
      ...authResult.session,
      restaurantId: resolvedRestId || authResult.session.restaurantId || '',
      restaurantSlug: resolvedSlug || authResult.session.restaurantSlug || '',
      restaurantName: resolvedName || (authResult.session as any).restaurantName || '',
    };

    const token = await signSession(sessionPayload, 60 * 60 * 24);
    const finalSlug = sessionPayload.restaurantSlug;
    const targetUrl = finalSlug ? `/staff/${finalSlug}` : '/staff';

    const response = NextResponse.json({
      success: true,
      user: {
        id: sessionPayload.userId,
        name: sessionPayload.name,
        role: sessionPayload.role,
        branchId: sessionPayload.branchId,
        restaurantSlug: sessionPayload.restaurantSlug,
        restaurantName: sessionPayload.restaurantName,
      },
      redirectTo: targetUrl,
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
