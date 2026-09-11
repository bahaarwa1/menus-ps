import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureTableToken } from '@/lib/tables/table-tokens';
import { tables as fallbackTables } from '@/data/demo-data';

import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { appCache } from '@/lib/cache/lru-cache';

export async function GET(request: NextRequest) {
  const branchIdParam = request.nextUrl.searchParams.get('branchId');
  let slug = request.nextUrl.searchParams.get('slug') || request.nextUrl.searchParams.get('restaurant') || '';

  if (!slug) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      const session = token ? await verifySession(token) : null;
      if (session?.restaurantSlug) slug = session.restaurantSlug;
    } catch {}
  }
  if (!slug) slug = 'burger-house-nablus';

  // Cost-optimization: Check memory LRU cache before hitting database
  const cacheKey = `tables:list:${slug}:${branchIdParam || 'default'}`;
  const cachedResponse = appCache.get<any>(cacheKey);
  if (cachedResponse) {
    return NextResponse.json(cachedResponse, {
      headers: {
        'X-Cache': 'HIT',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://menus-ps.vercel.app';

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let targetBranchId = branchIdParam;
      let targetRestaurantSlug = slug;
      let restData: any = null;
      let resolvedRestaurantName = '';

      if (!targetBranchId) {
        // Resolve branch from restaurant slug
        const res = await supabase
          .from('restaurants')
          .select('id, name, slug, branches(id)')
          .eq('slug', slug)
          .maybeSingle();

        restData = res.data;

        if (restData) {
          targetRestaurantSlug = restData.slug;
          resolvedRestaurantName = restData.name || '';
          const branches = restData.branches;
          if (Array.isArray(branches) && branches.length > 0) {
            targetBranchId = branches[0].id;
          } else if (branches?.id) {
            targetBranchId = branches.id;
          }
        }
      }

      // If still no branch ID, find the first available branch
      if (!targetBranchId) {
        const { data: firstBranch } = await supabase
          .from('branches')
          .select('id, restaurant_id, restaurants(name, slug)')
          .limit(1)
          .maybeSingle();

        if (firstBranch) {
          targetBranchId = (firstBranch as any).id;
          targetRestaurantSlug = (firstBranch as any).restaurants?.slug || slug;
          resolvedRestaurantName = (firstBranch as any).restaurants?.name || '';
        }
      }

      if (targetBranchId) {
        const { data, error } = await (supabase as any)
          .from('tables')
          .select('id, branch_id, table_number, seats, qr_token, status')
          .eq('branch_id', targetBranchId)
          .order('table_number', { ascending: true });

        if (!error && data) {
          const restaurantName = resolvedRestaurantName || (restData as any)?.name || (global.__menusRestaurantsStore?.get(targetRestaurantSlug)?.name) || '';
          const payload = {
            success: true,
            branchId: targetBranchId,
            restaurantSlug: targetRestaurantSlug,
            restaurantName,
            tables: (data as any[]).map((t) => ({
              id: t.table_number,
              dbId: t.id,
              seats: t.seats,
              status: t.status,
              qrToken: t.qr_token,
              qrUrl: `${appUrl}/r/${targetRestaurantSlug}?table=${t.table_number}&token=${t.qr_token}`,
            })),
          };

          appCache.set(cacheKey, payload, 300, ['tables', `tables:${targetRestaurantSlug}`]);

          return NextResponse.json(payload, {
            headers: {
              'X-Cache': 'MISS',
              'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
          });
        }
      }
    } catch (err) {
      console.warn('Database tables list warning:', err);
    }
  }

  // Fallback: return empty array for real restaurants or demo tables only for burger-house-nablus demo
  const fallbackRestaurantName = global.__menusRestaurantsStore?.get(slug)?.name || (slug === 'burger-house-nablus' ? 'Burger House نابلس' : '');

  if (slug === 'burger-house-nablus') {
    return NextResponse.json({
      success: true,
      restaurantSlug: slug,
      restaurantName: fallbackRestaurantName,
      tables: fallbackTables.map((t) => {
        const token = `table_token_b1_${t.id}_${slug}`;
        return {
          id: t.id,
          seats: t.seats,
          status: t.status,
          qrToken: token,
          qrUrl: `${appUrl}/r/${slug}?table=${t.id}&token=${token}`,
        };
      }),
    });
  }

  return NextResponse.json({
    success: true,
    restaurantSlug: slug,
    restaurantName: fallbackRestaurantName,
    tables: [],
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { slug, branchId, seats = 4 } = body;
    const supabase = createAdminClient();

    let targetBranchId = branchId;

    if (!targetBranchId && slug) {
      const { data: restData } = await supabase
        .from('restaurants')
        .select('id, branches(id)')
        .eq('slug', slug)
        .maybeSingle();

      if (restData) {
        const branches = (restData as any).branches;
        targetBranchId = Array.isArray(branches) && branches.length > 0 ? branches[0].id : branches?.id;
      }
    }

    if (!targetBranchId) {
      targetBranchId = 'b0000000-0000-0000-0000-000000000001';
    }

    // Determine highest table number
    const { data: existingTables } = await supabase
      .from('tables')
      .select('table_number')
      .eq('branch_id', targetBranchId)
      .order('table_number', { ascending: false })
      .limit(1);

    const nextNumber = (existingTables && existingTables.length > 0 ? (existingTables[0] as any).table_number : 0) + 1;
    const qrToken = generateSecureTableToken(targetBranchId, nextNumber);

    const { data: newTable, error } = await supabase
      .from('tables')
      .insert({
        branch_id: targetBranchId,
        table_number: nextNumber,
        seats,
        qr_token: qrToken,
        status: 'فارغة',
      } as never)
      .select('id, table_number, seats, qr_token, status')
      .single();

    if (error || !newTable) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create table' }, { status: 500 });
    }

    // Invalidate cached table lists
    appCache.invalidateTag('tables');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://menus-ps.vercel.app';
    const created = newTable as any;

    return NextResponse.json({
      success: true,
      table: {
        id: created.table_number,
        dbId: created.id,
        seats: created.seats,
        status: created.status,
        qrToken: created.qr_token,
        qrUrl: `${appUrl}/m?t=${created.qr_token}&restaurant=${slug || 'burger-house-nablus'}`,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
