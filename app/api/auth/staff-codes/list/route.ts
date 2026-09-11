import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { listStaffAccessCodes, deleteStaffAccessCode } from '@/lib/db/repositories/staff-code.repository';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    // Force branch isolation: users can only see codes for their own branch
    let branchId = session.role === 'admin' 
      ? (request.nextUrl.searchParams.get('branchId') || session.branchId)
      : session.branchId;

    if (!branchId && (session.restaurantId || session.restaurantSlug)) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminSb = createAdminClient();
        if (session.restaurantId) {
          const { data: bData } = await (adminSb as any)
            .from('branches')
            .select('id')
            .eq('restaurant_id', session.restaurantId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          if (bData?.id) branchId = bData.id;
        } else if (session.restaurantSlug) {
          const { data: rData } = await (adminSb as any)
            .from('restaurants')
            .select('branches(id, is_active)')
            .eq('slug', session.restaurantSlug)
            .maybeSingle();
          if (rData) {
            const branches = Array.isArray(rData.branches) ? rData.branches : (rData.branches ? [rData.branches] : []);
            const activeB = branches.find((b: any) => b.is_active) || branches[0];
            if (activeB?.id) branchId = activeB.id;
          }
        }
      } catch {}
    }

    const codes = await listStaffAccessCodes(branchId);
    return NextResponse.json({ success: true, codes });
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

    const targetBranch = session.role === 'admin' ? undefined : session.branchId;
    await deleteStaffAccessCode(codeId, targetBranch);

    return NextResponse.json({ success: true, message: 'تم إبطال رمز الوصول بنجاح' });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}
