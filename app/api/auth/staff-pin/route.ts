import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithStaffPin } from '@/lib/auth/service';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimiter } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate limit: max 10 attempts per minute per IP
    const rateLimit = rateLimiter.check(`staff-pin:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `تم تجاوز عدد المحاولات المسموح بها. انتظر ${rateLimit.resetInSeconds} ثانية.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { pin, branchId } = body;

    if (!pin || String(pin).trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'رمز الدخول مطلوب (4 أرقام على الأقل)' },
        { status: 400 }
      );
    }

    const pinStr = String(pin).trim();

    // === 6-DIGIT ACCESS CODE PATH ===
    if (pinStr.length === 6 && /^\d{6}$/.test(pinStr)) {
      try {
        const supabase = createAdminClient();
        const now = new Date().toISOString();

        // Find a valid, unused 6-digit code
        const { data: codeRecord, error: codeError } = await (supabase as any)
          .from('staff_access_codes')
          .select('id, branch_id, employee_name, role, expires_at')
          .eq('code', pinStr)
          .eq('is_used', false)
          .gt('expires_at', now)
          .limit(1)
          .maybeSingle();

        if (!codeError && codeRecord) {
          const record = codeRecord as {
            id: string;
            branch_id: string;
            employee_name: string;
            role: string;
            expires_at: string;
          };

          // Mark code as used
          await (supabase as any)
            .from('staff_access_codes')
            .update({ is_used: true, used_at: now })
            .eq('id', record.id);

          const sessionPayload = {
            userId: record.id,
            staffUserId: record.id,
            name: record.employee_name,
            role: record.role as 'staff' | 'kitchen' | 'branch_manager',
            branchId: record.branch_id,
            restaurantId: '',
            restaurantSlug: '',
          };

          const token = await signSession(sessionPayload);

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
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours for temp staff codes
          });

          return response;
        }

        // Code not found or expired — fallback to normal PIN logic
      } catch (err) {
        console.warn('6-digit code lookup failed, fallback to normal PIN:', err);
      }
    }

    // === NORMAL PIN PATH (staff_users.pin_hash) ===
    const authResult = await authenticateWithStaffPin(pinStr, branchId);

    if (!authResult.success || !authResult.session) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'رمز الـ PIN غير صحيح، يرجى التأكد من الرمز المدخل' },
        { status: 401 }
      );
    }

    const token = await signSession(authResult.session);

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
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
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
