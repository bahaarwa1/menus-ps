import { NextRequest, NextResponse } from 'next/server';
import { getRestaurantMenu } from '@/lib/db/repositories/menu.repository';
import { appCache } from '@/lib/cache/lru-cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get('slug') || 'burger-house-nablus';
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
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT',
            'X-Edge-Cache-Policy': 'in-memory-lru',
          },
        }
      );
    }

    // 2. Fetch from repository
    const menu = await getRestaurantMenu(slug);

    // 3. Populate memory cache with 60s TTL and 'menu' tag
    appCache.set(cacheKey, menu, 60, ['menu', `menu:${slug}`]);

    return NextResponse.json(
      {
        restaurantSlug: slug,
        categories: menu,
        cached: false,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
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
