import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { hashPassword, hashPin } from '@/lib/security/crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    // Security check: Only Super Admin
    const isMasterOwner = session?.email === 'almhtrf.information22@gmail.com' || session?.email === 'admin@menus.ps';
    const isSuperAdmin = session?.role === 'admin' && (isMasterOwner || session?.restaurantSlug === 'platform-master' || session?.restaurantSlug === 'burger-house-nablus');

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'غير مصرح للوصول لهذه العملية' }, { status: 403 });
    }

    const restaurantId = params.id;
    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'معرف المطعم مطلوب' }, { status: 400 });
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json({ success: false, error: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 خانات' }, { status: 400 });
    }

    const cleanPassword = newPassword.trim();
    const supabase = createAdminClient();

    // 1. Fetch restaurant
    const { data: rest } = await (supabase as any)
      .from('restaurants')
      .select('id, name, slug, branches(id)')
      .eq('id', restaurantId)
      .maybeSingle();

    const memRecord = global.__menusRestaurantsStore?.get(rest?.slug || restaurantId);
    const slug = rest?.slug || memRecord?.slug;
    const branchId = (Array.isArray(rest?.branches) ? rest?.branches[0]?.id : rest?.branches?.id) || memRecord?.branchId;

    // 2. Find associated user in Supabase Auth
    let updatedAuth = false;
    let authUserEmail = '';
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const matchedUser = usersData?.users?.find(u => {
        const meta = u.user_metadata || {};
        return (
          meta.restaurant_id === restaurantId ||
          (slug && meta.restaurant_slug === slug) ||
          (slug && u.email?.toLowerCase().startsWith(slug.toLowerCase()))
        );
      });

      if (matchedUser) {
        await supabase.auth.admin.updateUserById(matchedUser.id, {
          password: cleanPassword,
        });
        updatedAuth = true;
        authUserEmail = matchedUser.email || '';
      }
    } catch (authErr) {
      console.warn('Supabase auth password update error:', authErr);
    }

    // 3. Update staff_users PIN hash if primary branch exists
    if (branchId) {
      try {
        const pin = cleanPassword.slice(0, 6);
        const pinHash = await hashPin(pin);
        await (supabase as any)
          .from('staff_users')
          .update({ pin_hash: pinHash })
          .eq('branch_id', branchId)
          .eq('role', 'owner');
      } catch (staffErr) {
        console.warn('Staff user PIN update warning:', staffErr);
      }
    }

    // 4. Update memory store password hash
    if (slug && memRecord) {
      memRecord.ownerPassword = await hashPassword(cleanPassword);
      global.__menusRestaurantsStore?.set(slug, memRecord);
    }

    return NextResponse.json({
      success: true,
      message: `تم تحديث كلمة المرور بنجاح ${authUserEmail ? `لحساب (${authUserEmail})` : ''}`,
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' }, { status: 500 });
  }
}
