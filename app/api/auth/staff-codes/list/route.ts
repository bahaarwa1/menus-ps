import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { listStaffAccessCodes, deleteStaffAccessCode } from '@/lib/db/repositories/staff-code.repository';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const slugParam = request.nextUrl.searchParams.get('slug') || request.nextUrl.searchParams.get('restaurantSlug');
    const branchParam = request.nextUrl.searchParams.get('branchId');

    let branchId = branchParam || (session.branchId !== 'master' ? session.branchId : '');
    const targetSlug = slugParam || session.restaurantSlug;

    if (targetSlug === 'sh-manoosha' || (!branchId && targetSlug === 'sh-manoosha')) {
      branchId = 'a84f5ec9-714f-44fe-980d-82a78eb4f9b9';
    }

    if (!branchId && targetSlug && isSupabaseConfigured()) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminSb = createAdminClient();
        const { data: rData } = await (adminSb as any)
          .from('restaurants')
          .select('branches(id, is_active)')
          .eq('slug', targetSlug)
          .maybeSingle();
        if (rData) {
          const branches = Array.isArray(rData.branches) ? rData.branches : (rData.branches ? [rData.branches] : []);
          const activeB = branches.find((b: any) => b.is_active) || branches[0];
          if (activeB?.id) branchId = activeB.id;
        }
      } catch {}
    }

    if (!branchId && session.restaurantId && isSupabaseConfigured()) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const adminSb = createAdminClient();
        const { data: bData } = await (adminSb as any)
          .from('branches')
          .select('id')
          .eq('restaurant_id', session.restaurantId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        if (bData?.id) branchId = bData.id;
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
