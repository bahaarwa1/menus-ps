import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { appCache } from '@/lib/cache/lru-cache';

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

    // Protect master system account from accidental deletion
    if (restaurantId === 'platform-master') {
      return NextResponse.json({ success: false, error: 'لا يمكن حذف الحساب الرئيسي للمنصة' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch restaurant
    const { data: rest } = await (supabase as any)
      .from('restaurants')
      .select('id, name, slug, branches(id)')
      .eq('id', restaurantId)
      .maybeSingle();

    const memRecord = global.__menusRestaurantsStore?.get(restaurantId);
    const targetSlug = rest?.slug || memRecord?.slug || '';

    if (targetSlug === 'platform-master') {
      return NextResponse.json({ success: false, error: 'لا يمكن حذف الحساب الرئيسي للمنصة' }, { status: 400 });
    }

    // 2. Cascade delete from database tables
    if (rest) {
      const branches = Array.isArray(rest.branches) ? rest.branches : (rest.branches ? [rest.branches] : []);
      const branchIds = branches.map((b: any) => b.id).filter(Boolean);

      if (branchIds.length > 0) {
        // Fetch order IDs
        const { data: ordersData } = await (supabase as any)
          .from('orders')
          .select('id')
          .in('branch_id', branchIds);

        const orderIds = (ordersData || []).map((o: any) => o.id);

        // Delete order items
        if (orderIds.length > 0) {
          await (supabase as any).from('order_items').delete().in('order_id', orderIds);
        }

        // Delete orders
        await (supabase as any).from('orders').delete().in('branch_id', branchIds);

        // Delete staff access codes
        try {
          await (supabase as any).from('staff_access_codes').delete().eq('restaurant_id', restaurantId);
        } catch {
          // table might not exist
        }

        // Delete staff users
        await (supabase as any).from('staff_users').delete().in('branch_id', branchIds);

        // Delete tables
        await (supabase as any).from('tables').delete().in('branch_id', branchIds);
      }

      // Delete menu items extras, items, categories
      const { data: categories } = await (supabase as any)
        .from('menu_categories')
        .select('id')
        .eq('restaurant_id', restaurantId);

      const catIds = (categories || []).map((c: any) => c.id);
      if (catIds.length > 0) {
        const { data: items } = await (supabase as any)
          .from('menu_items')
          .select('id')
          .in('category_id', catIds);

        const itemIds = (items || []).map((i: any) => i.id);
        if (itemIds.length > 0) {
          await (supabase as any).from('item_extras').delete().in('item_id', itemIds);
          await (supabase as any).from('menu_items').delete().in('id', itemIds);
        }
        await (supabase as any).from('menu_categories').delete().in('id', catIds);
      }

      // Delete branches
      await (supabase as any).from('branches').delete().eq('restaurant_id', restaurantId);

      // Delete restaurant
      await (supabase as any).from('restaurants').delete().eq('id', restaurantId);
    }

    // 3. Delete auth users associated with this restaurant
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const matchingUsers = (usersData?.users || []).filter(u => {
        const meta = u.user_metadata || {};
        return (
          meta.restaurant_id === restaurantId ||
          (targetSlug && meta.restaurant_slug === targetSlug)
        );
      });

      for (const u of matchingUsers) {
        await supabase.auth.admin.deleteUser(u.id);
      }
    } catch (authErr) {
      console.warn('Auth user cleanup warning:', authErr);
    }

    // 4. Remove from global memory store
    if (targetSlug) {
      global.__menusRestaurantsStore?.delete(targetSlug);
    }
    if (restaurantId) {
      global.__menusRestaurantsStore?.delete(restaurantId);
    }

    // 5. Purge LRU caches
    if (targetSlug) {
      appCache.delete(`restaurant:slug:${targetSlug}`);
      appCache.delete(`dashboard:stats:${targetSlug}:default`);
      appCache.invalidateTag(`restaurant:${targetSlug}`);
    }
    appCache.invalidateTag('restaurants');
    appCache.invalidateTag('menu');
    appCache.invalidateTag('stats');

    return NextResponse.json({
      success: true,
      message: 'تم حذف المطعم وجميع بياناته بنجاح',
    });
  } catch (error: any) {
    console.error('Delete restaurant error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حذف المطعم' }, { status: 500 });
  }
}
