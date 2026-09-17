import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { appCache } from '@/lib/cache/lru-cache';
import { serializeSubscriptionAddress, SubscriptionPlan } from '@/lib/subscription/subscription.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

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
    const { name, phone, city, tablesCount, isActive, plan, expiresAt } = body;

    const supabase = createAdminClient();

    // 1. Fetch current restaurant and primary branch
    const { data: restData } = await (supabase as any)
      .from('restaurants')
      .select('id, slug, name, phone, city')
      .eq('id', restaurantId)
      .maybeSingle();

    if (!restData) {
      return NextResponse.json({ success: false, error: 'المطعم غير موجود' }, { status: 404 });
    }

    const { data: branchData } = await (supabase as any)
      .from('branches')
      .select('id, address, tables_count, is_active')
      .eq('restaurant_id', restaurantId)
      .limit(1)
      .maybeSingle();

    // 2. Update restaurant general info
    const restUpdates: any = {};
    if (name) restUpdates.name = name.trim();
    if (phone) restUpdates.phone = phone.trim();
    if (city) restUpdates.city = city.trim();

    if (Object.keys(restUpdates).length > 0) {
      await (supabase as any)
        .from('restaurants')
        .update(restUpdates)
        .eq('id', restaurantId);
    }

    // 3. Update primary branch (tables count, active status, subscription metadata in address)
    if (branchData) {
      const branchUpdates: any = {};
      if (typeof isActive === 'boolean') branchUpdates.is_active = isActive;
      if (typeof tablesCount === 'number' && tablesCount > 0) branchUpdates.tables_count = tablesCount;

      const currentAddress = (branchData as any).address || '';
      const targetPlan: SubscriptionPlan = plan || 'trial';
      const targetExpiry = expiresAt || new Date(Date.now() + 14 * 86400000).toISOString();

      branchUpdates.address = serializeSubscriptionAddress(currentAddress, targetPlan, targetExpiry);

      await (supabase as any)
        .from('branches')
        .update(branchUpdates)
        .eq('id', branchData.id);
    }

    // 4. Purge caches
    const slug = restData.slug;
    if (slug) {
      appCache.delete(`restaurant:slug:${slug}`);
      appCache.delete(`dashboard:stats:${slug}:default`);
      appCache.invalidateTag(`restaurant:${slug}`);

      const memRecord = global.__menusRestaurantsStore?.get(slug);
      if (memRecord) {
        if (name) memRecord.name = name.trim();
        if (phone) memRecord.phone = phone.trim();
        if (city) memRecord.city = city.trim();
        if (typeof isActive === 'boolean') memRecord.isActive = isActive;
        if (typeof tablesCount === 'number') memRecord.tablesCount = tablesCount;
        global.__menusRestaurantsStore?.set(slug, memRecord);
      }
    }

    appCache.invalidateTag('restaurants');
    appCache.invalidateTag('menu');
    appCache.invalidateTag('stats');

    return NextResponse.json({
      success: true,
      message: 'تم حفظ كافة بيانات المطعم وإعدادات الاشتراك بنجاح',
    });
  } catch (error) {
    console.error('Update restaurant details and subscription error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حفظ التعديلات' }, { status: 500 });
  }
}
