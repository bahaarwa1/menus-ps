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

    const isMasterOwner = session?.email === 'almhtrf.information22@gmail.com' || session?.email === 'admin@menus.ps';
    const isSuperAdmin = session?.role === 'admin' && (isMasterOwner || session?.restaurantSlug === 'platform-master' || session?.restaurantSlug === 'burger-house-nablus');

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'غير مصرح للوصول لهذه العملية' }, { status: 403 });
    }

    const { isActive } = await request.json();
    const restaurantId = params.id;

    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'معرف المطعم مطلوب' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch restaurant slug to purge cache accurately
    const { data: restData } = await (supabase as any)
      .from('restaurants')
      .select('slug')
      .eq('id', restaurantId)
      .maybeSingle();

    const slug = restData?.slug;

    // 2. Toggle branches active state for this restaurant
    const { error: branchErr } = await (supabase as any)
      .from('branches')
      .update({ is_active: Boolean(isActive) })
      .eq('restaurant_id', restaurantId);

    if (branchErr) {
      return NextResponse.json({ success: false, error: branchErr.message }, { status: 500 });
    }

    // 3. Invalidate caches immediately
    if (slug) {
      appCache.delete(`restaurant:slug:${slug}`);
      appCache.delete(`dashboard:stats:${slug}:default`);
      appCache.invalidateTag(`restaurant:${slug}`);
      appCache.delete(`slug:avail:${slug}`);

      // Update in-memory fallback store
      const memRecord = global.__menusRestaurantsStore?.get(slug);
      if (memRecord) {
        memRecord.isActive = Boolean(isActive);
        global.__menusRestaurantsStore?.set(slug, memRecord);
      }
    }

    appCache.invalidateTag('restaurants');
    appCache.invalidateTag('menu');
    appCache.invalidateTag('stats');

    return NextResponse.json({
      success: true,
      message: isActive ? 'تم تفعيل المطعم واستئناف استقبال الطلبات بنجاح' : 'تم إيقاف المطعم وحجب منيو الزبائن مؤقتاً',
    });
  } catch (error) {
    console.error('Update restaurant status error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع أثناء تحديث الحالة' }, { status: 500 });
  }
}
