import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { cookies } from 'next/headers';

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
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

    if (!employeeName || String(employeeName).trim().length < 2) {
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

    // 2. Generate unique code (retry up to 5 times if collision)
    let code = '';
    let attempts = 0;
    while (attempts < 5) {
      const candidate = generateSixDigitCode();
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

    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

    // 3. Insert code
    const { data: insertedCode, error: insertError } = await (supabase as any)
      .from('staff_access_codes')
      .insert({
        branch_id: targetBranchId,
        code,
        employee_name: String(employeeName).trim().slice(0, 60),
        role,
        created_by: session.staffUserId || null,
        expires_at: expiresAt,
      })
      .select('id, code, employee_name, role, expires_at')
      .single();

    if (insertError || !insertedCode) {
      console.error('staff_access_codes insert error:', insertError?.message);
      return NextResponse.json(
        { success: false, error: 'فشل حفظ رمز الوصول في قاعدة البيانات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: (insertedCode as any).code,
      employeeName: (insertedCode as any).employee_name,
      role: (insertedCode as any).role,
      expiresAt: (insertedCode as any).expires_at,
      message: `تم إنشاء رمز الوصول للموظف "${(insertedCode as any).employee_name}" بنجاح`,
    });
  } catch (error) {
    console.error('Generate staff code error:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ داخلي في الخادم' },
      { status: 500 }
    );
  }
}
