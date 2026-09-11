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

    // Force branch isolation: users can only see codes for their own branch
    const branchId = session.role === 'admin' 
      ? (request.nextUrl.searchParams.get('branchId') || session.branchId)
      : session.branchId;

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
    if (!codeId || typeof codeId !== 'string') {
      return NextResponse.json({ success: false, error: 'معرف الرمز مطلوب' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Strict multi-tenant isolation: only delete if belonging to this branch (unless super-admin)
    let deleteQuery = (supabase as any).from('staff_access_codes').delete().eq('id', codeId);
    if (session.role !== 'admin' && session.branchId) {
      deleteQuery = deleteQuery.eq('branch_id', session.branchId);
    }
    await deleteQuery;

    return NextResponse.json({ success: true, message: 'تم إبطال رمز الوصول بنجاح' });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}
