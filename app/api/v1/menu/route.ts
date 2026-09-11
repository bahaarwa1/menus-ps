import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantMenu } from '@/lib/db/repositories/menu.repository';
import { appCache } from '@/lib/cache/lru-cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  let slug = searchParams.get('slug') || '';
  if (!slug) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      const session = token ? await verifySession(token) : null;
      slug = session?.restaurantSlug || '';
    } catch {}
  }
  if (!slug) {
    return NextResponse.json({ restaurantSlug: '', categories: [] });
  }

  const cacheKey = `menu:${slug}`;

  try {
    // 1. O(1) Memory Cache Check
    const cachedMenu = appCache.get(cacheKey);
    if (cachedMenu) {
      return NextResponse.json(
        { restaurantSlug: slug, categories: cachedMenu, cached: true },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=30, s-maxage=180, stale-while-revalidate=600',
            'X-Cache': 'HIT',
            'X-Edge-Cache-Policy': 'in-memory-lru',
          },
        }
      );
    }

    // 2. Fetch from repository
    const menu = await getRestaurantMenu(slug);

    // 3. Populate memory cache with 180s TTL and 'menu' tag
    appCache.set(cacheKey, menu, 180, ['menu', `menu:${slug}`]);

    return NextResponse.json(
      {
        restaurantSlug: slug,
        categories: menu,
        cached: false,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=30, s-maxage=180, stale-while-revalidate=600',
          'X-Cache': 'MISS',
          'X-Edge-Cache-Policy': 'stale-while-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('API menu fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve menu catalog' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { name, price, description, categoryName, isPopular, isSpicy, slug, imageUrl } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: 'اسم الصنف والسعر مطلوبان' }, { status: 400 });
    }

    const targetSlug = slug || session.restaurantSlug;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ 
        success: true, 
        item: { 
          id: `item-${Date.now()}`, 
          name, 
          price, 
          description, 
          image: imageUrl || null 
        } 
      });
    }

    const supabase = createAdminClient();

    // 1. Get restaurant ID
    const { data: rest } = await (supabase as any)
      .from('restaurants')
      .select('id')
      .eq('slug', targetSlug)
      .maybeSingle();

    if (!rest) {
      return NextResponse.json({ success: false, error: 'المطعم غير موجود' }, { status: 404 });
    }

    // 2. Find or create category
    const catTitle = categoryName || 'الأصناف الرئيسية';
    let { data: cat } = await (supabase as any)
      .from('menu_categories')
      .select('id')
      .eq('restaurant_id', rest.id)
      .eq('name_ar', catTitle)
      .maybeSingle();

    if (!cat) {
      const { data: newCat } = await (supabase as any)
        .from('menu_categories')
        .insert({
          restaurant_id: rest.id,
          name_ar: catTitle,
          icon: '🍽️',
        })
        .select('id')
        .single();
      cat = newCat;
    }

    if (!cat) {
      return NextResponse.json({ success: false, error: 'فشل تحديد قسم الصنف' }, { status: 500 });
    }

    // 3. Insert menu item with optional image_url
    const { data: newItem, error: itemErr } = await (supabase as any)
      .from('menu_items')
      .insert({
        category_id: cat.id,
        name_ar: String(name).trim(),
        description_ar: description ? String(description).trim() : null,
        price: Number(price),
        image_url: imageUrl ? String(imageUrl).trim() : null,
        is_popular: Boolean(isPopular),
        is_spicy: Boolean(isSpicy),
        is_available: true,
      })
      .select('id, name_ar, description_ar, price, image_url, is_popular, is_spicy, is_available')
      .single();

    if (itemErr) {
      return NextResponse.json({ success: false, error: itemErr.message }, { status: 500 });
    }

    appCache.invalidateTag('menu');

    return NextResponse.json({
      success: true,
      item: {
        id: newItem.id,
        name: newItem.name_ar,
        description: newItem.description_ar || '',
        price: Number(newItem.price),
        image: newItem.image_url || undefined,
        popular: newItem.is_popular,
        spicy: newItem.is_spicy,
        available: newItem.is_available,
        category: catTitle,
      },
    });
  } catch (err) {
    console.error('Create menu item error:', err);
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

    const { itemId } = await request.json();
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'معرف الصنف مطلوب' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await (supabase as any).from('menu_items').delete().eq('id', itemId);
    }

    appCache.invalidateTag('menu');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete menu item error:', err);
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, name, price, description, isPopular, isSpicy, isAvailable, imageUrl } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'معرف الصنف مطلوب' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const updates: any = {};
      if (name !== undefined) updates.name_ar = String(name).trim();
      if (price !== undefined) updates.price = Number(price);
      if (description !== undefined) updates.description_ar = description ? String(description).trim() : null;
      if (imageUrl !== undefined) updates.image_url = imageUrl ? String(imageUrl).trim() : null;
      if (isPopular !== undefined) updates.is_popular = Boolean(isPopular);
      if (isSpicy !== undefined) updates.is_spicy = Boolean(isSpicy);
      if (isAvailable !== undefined) updates.is_available = Boolean(isAvailable);

      const { error: updateErr } = await (supabase as any)
        .from('menu_items')
        .update(updates)
        .eq('id', itemId);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }
    }

    // Invalidate caches
    appCache.invalidateTag('menu');
    appCache.delete(`item_price:${itemId}`);

    return NextResponse.json({ success: true, message: 'تم تحديث الصنف بنجاح' });
  } catch (err) {
    console.error('Update menu item error:', err);
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}

