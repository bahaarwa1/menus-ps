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

// In-flight promise map for request coalescing (prevents dog-piling on DB during cache miss)
const inFlightMenuRequests = new Map<string, Promise<PublicMenuCategory[] | null>>();

/**
 * Fetches active menu categories and items for a restaurant with multi-tier caching.
 * Returns null if the restaurant does not exist.
 */
export async function getRestaurantMenu(restaurantSlug = 'burger-house-nablus'): Promise<PublicMenuCategory[] | null> {
  const cacheKey = `menu:${restaurantSlug}`;

  // 1. O(1) Memory Cache Check
  const cached = appCache.get<PublicMenuCategory[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Request Coalescing: if another request is already fetching this slug, share the promise
  if (inFlightMenuRequests.has(cacheKey)) {
    return inFlightMenuRequests.get(cacheKey)!;
  }

  const isDemoRestaurant = restaurantSlug === 'burger-house-nablus' || restaurantSlug === 'demo';

  const fetchPromise = (async (): Promise<PublicMenuCategory[] | null> => {
    try {
      if (!isSupabaseConfigured()) {
        if (isDemoRestaurant) {
          const fallback = buildFallbackMenu();
          appCache.set(cacheKey, fallback, 300, ['menu', `menu:${restaurantSlug}`]);
          return fallback;
        }
        if (global.__menusRestaurantsStore?.has(restaurantSlug)) {
          return [];
        }
        return null;
      }

      const supabase = createClient();

      // Single joined query: fetch restaurant, categories, items, and extras in ONE roundtrip
      const { data: rawRestaurant, error: restError } = await (supabase as any)
        .from('restaurants')
        .select(`
          id,
          menu_categories (
            id,
            name_ar,
            icon,
            sort_order,
            is_active,
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
          )
        `)
        .eq('slug', restaurantSlug)
        .maybeSingle();

      if (restError || !rawRestaurant) {
        if (isDemoRestaurant) {
          console.warn('Supabase restaurant fetch failed, using fallback for demo:', restError?.message);
          const fallback = buildFallbackMenu();
          appCache.set(cacheKey, fallback, 120, ['menu', `menu:${restaurantSlug}`]);
          return fallback;
        }
        if (global.__menusRestaurantsStore?.has(restaurantSlug)) {
          return [];
        }
        return null;
      }

      const rawCats = (rawRestaurant.menu_categories || []) as any[];
      const categoriesData = rawCats
        .filter((c: any) => c.is_active !== false)
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

      if (categoriesData.length === 0) {
        if (isDemoRestaurant) {
          const fallback = buildFallbackMenu();
          appCache.set(cacheKey, fallback, 120, ['menu', `menu:${restaurantSlug}`]);
          return fallback;
        }
        // Real registered restaurants start with 0 items cleanly
        return [];
      }

      const result: PublicMenuCategory[] = ((categoriesData || []) as any[]).map((cat) => ({
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

      // Cache result for 300 seconds (5 minutes)
      appCache.set(cacheKey, result, 300, ['menu', `menu:${restaurantSlug}`]);
      return result;
    } catch (error) {
      console.error('Error fetching menu from Supabase:', error);
      if (isDemoRestaurant) {
        const fallback = buildFallbackMenu();
        appCache.set(cacheKey, fallback, 60, ['menu', `menu:${restaurantSlug}`]);
        return fallback;
      }
      return null;
    } finally {
      inFlightMenuRequests.delete(cacheKey);
    }
  })();

  inFlightMenuRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
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
 * Updates a menu item and immediately invalidates the menu LRU cache.
 */
export async function updateMenuItem(
  itemId: string,
  updates: { name?: string; description?: string; price?: number; is_available?: boolean; image_url?: string }
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name_ar = updates.name;
      if (updates.description !== undefined) dbUpdates.description_ar = updates.description;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.is_available !== undefined) dbUpdates.is_available = updates.is_available;
      if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url;

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

  // Invalidate all menu caches across all slugs
  appCache.invalidateTag('menu');
  return true;
}
