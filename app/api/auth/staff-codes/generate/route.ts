import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { generateSecurePin, sanitizeInput } from '@/lib/security/crypto';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { saveStaffAccessCode } from '@/lib/db/repositories/staff-code.repository';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = rateLimiter.check(`gen-staff-code:${ip}`, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز الحد المسموح لتوليد الرموز' },
        { status: 429 }
      );
    }

    // 1. Verify session — must be manager or owner
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بإنشاء رموز الوصول' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employeeName, role = 'staff', branchId, expiresInHours = 24 } = body;

    const cleanName = sanitizeInput(String(employeeName || ''), 60);

    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم الموظف (حرفان على الأقل)' },
        { status: 400 }
      );
    }

    const validRoles = ['staff', 'kitchen', 'branch_manager'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'الدور غير صالح' },
        { status: 400 }
      );
    }

    const targetBranchId = branchId || session.branchId;
    if (!targetBranchId) {
      return NextResponse.json(
        { success: false, error: 'لم يتم تحديد الفرع' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 2. Generate cryptographically secure unique code (retry up to 5 times if collision)
    let code = '';
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateSecurePin(6);
      // Check uniqueness for this branch
      const { data: existing } = await (supabase as any)
        .from('staff_access_codes')
        .select('id')
        .eq('branch_id', targetBranchId)
        .eq('code', candidate)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!existing) {
        code = candidate;
        break;
      }
      attempts++;
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'فشل توليد رمز فريد، يرجى المحاولة مجدداً' },
        { status: 500 }
      );
    }

    const hours = Math.min(Math.max(1, Number(expiresInHours) || 24), 168); // Max 7 days
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();

    // 3. Save code using resilient repository
    const insertedCode = await saveStaffAccessCode({
      branch_id: targetBranchId,
      code,
      employee_name: cleanName,
      role: role as 'staff' | 'kitchen' | 'branch_manager',
      created_by: session.staffUserId || session.userId || null,
      expires_at: expiresAt,
    });

    return NextResponse.json({
      success: true,
      code: insertedCode.code,
      employeeName: insertedCode.employee_name,
      role: insertedCode.role,
      expiresAt: insertedCode.expires_at,
      message: `تم إنشاء رمز الوصول للموظف "${insertedCode.employee_name}" بنجاح`,
    });
  } catch (error) {
    console.error('Generate staff code error:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
