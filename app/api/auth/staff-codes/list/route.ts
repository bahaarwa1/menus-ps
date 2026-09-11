import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const branchId = request.nextUrl.searchParams.get('branchId') || session.branchId;

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from('staff_access_codes')
      .select('id, code, employee_name, role, expires_at, is_used, used_at, created_at')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, codes: data || [] });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const { codeId } = await request.json();
    if (!codeId) {
      return NextResponse.json({ success: false, error: 'معرف الرمز مطلوب' }, { status: 400 });
    }

    const supabase = createAdminClient();
    await (supabase as any).from('staff_access_codes').delete().eq('id', codeId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}
