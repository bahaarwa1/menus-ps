import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { categories as fallbackCategories, menuItems as fallbackMenuItems } from '@/data/demo-data';
import { appCache } from '@/lib/cache/lru-cache';

export interface PublicMenuCategory {
  id: string;
  name: string;
  icon: string;
  items: PublicMenuItem[];
}

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  popular?: boolean;
  spicy?: boolean;
  extras?: { id: string; name: string; price: number }[];
}

/**
 * Fetches active menu categories and items for a restaurant.
 * Executes a joined query to avoid N+1 query overhead.
 * Automatically falls back to demo-data if Supabase is unconfigured or unreachable.
 */
export async function getRestaurantMenu(restaurantSlug = 'burger-house-nablus'): Promise<PublicMenuCategory[]> {
  if (!isSupabaseConfigured()) {
    // Return structured demo data
    return buildFallbackMenu();
  }

  try {
    const supabase = createClient();

    // 1. Get restaurant ID
    const { data: rawRestaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', restaurantSlug)
      .single();

    const restaurant = rawRestaurant as { id: string } | null;

    if (restError || !restaurant) {
      console.warn('Supabase restaurant fetch failed, using fallback:', restError?.message);
      return buildFallbackMenu();
    }

    // 2. Fetch categories with items and extras in a single efficient query
    const { data: categoriesData, error: catError } = await supabase
      .from('menu_categories')
      .select(`
        id,
        name_ar,
        icon,
        sort_order,
        menu_items (
          id,
          name_ar,
          description_ar,
          price,
          image_url,
          is_available,
          is_popular,
          is_spicy,
          sort_order,
          item_extras (
            id,
            name_ar,
            price
          )
        )
      `)
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (catError || !categoriesData) {
      console.warn('Supabase categories fetch failed, using fallback:', catError?.message);
      return buildFallbackMenu();
    }

    return ((categoriesData || []) as any[]).map((cat) => ({
      id: cat.id,
      name: cat.name_ar,
      icon: cat.icon,
      items: ((cat.menu_items as unknown as Array<{
        id: string;
        name_ar: string;
        description_ar: string | null;
        price: number;
        image_url: string | null;
        is_available: boolean;
        is_popular: boolean;
        is_spicy: boolean;
        sort_order: number;
        item_extras?: Array<{ id: string; name_ar: string; price: number }>;
      }>) || [])
        .filter((item) => item.is_available)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          id: item.id,
          name: item.name_ar,
          description: item.description_ar || '',
          price: Number(item.price),
          image: item.image_url || undefined,
          popular: item.is_popular,
          spicy: item.is_spicy,
          extras: (item.item_extras || []).map((e) => ({
            id: e.id,
            name: e.name_ar,
            price: Number(e.price),
          })),
        })),
    }));
  } catch (error) {
    console.error('Error fetching menu from Supabase:', error);
    return buildFallbackMenu();
  }
}

function buildFallbackMenu(): PublicMenuCategory[] {
  return fallbackCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    items: fallbackMenuItems
      .filter((item) => item.category === cat.id && (item as any).isAvailable !== false)
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        popular: item.popular,
        extras: item.extras?.map((e) => ({
          id: e.id,
          name: e.name,
          price: e.price,
        })),
      })),
  }));
}

/**
 * Updates a menu item and invalidates the menu LRU cache.
 */
export async function updateMenuItem(
  itemId: string,
  updates: { name?: string; description?: string; price?: number; is_available?: boolean }
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name_ar = updates.name;
      if (updates.description !== undefined) dbUpdates.description_ar = updates.description;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.is_available !== undefined) dbUpdates.is_available = updates.is_available;

      await (supabase.from('menu_items') as any).update(dbUpdates).eq('id', itemId);
    } catch (err) {
      console.warn('Database menu item update error:', err);
    }
  }

  // Update in-memory fallback
  const found = fallbackMenuItems.find((i) => i.id === itemId);
  if (found) {
    if (updates.name !== undefined) found.name = updates.name;
    if (updates.description !== undefined) found.description = updates.description;
    if (updates.price !== undefined) found.price = updates.price;
    if (updates.is_available !== undefined) (found as any).isAvailable = updates.is_available;
  }

  // Invalidate menu cache
  appCache.invalidateTag('menu');
  return true;
}
