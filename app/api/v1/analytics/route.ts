import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    
    // Rate limit: 60 requests per minute
    const rateLimit = rateLimiter.check(`analytics:${ip}`, 60, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز معدل الطلبات المسموح به' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    let branchId = searchParams.get('branchId');
    const slug = searchParams.get('slug') || 'sh-manoosha';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Authenticate session if available
    let session = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        session = await verifySession(token);
      }
    } catch {}

    // Resolve branch ID
    if (session?.branchId) {
      branchId = session.branchId;
    } else if (!branchId || branchId === 'master' || branchId === 'default') {
      if (slug === 'sh-manoosha' || session?.restaurantSlug === 'sh-manoosha') {
        branchId = 'a84f5ec9-714f-44fe-980d-82a78eb4f9b9';
      }
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        orders: [],
        branchId,
        source: 'unconfigured',
      });
    }

    const supabase = createAdminClient();

    // If branchId is still missing, attempt lookup by slug or restaurantId
    if (!branchId && (slug || session?.restaurantId)) {
      try {
        if (slug) {
          const { data: restData } = await (supabase as any)
            .from('restaurants')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();
          if (restData?.id) {
            const { data: bData } = await (supabase as any)
              .from('branches')
              .select('id')
              .eq('restaurant_id', restData.id)
              .eq('is_active', true)
              .limit(1)
              .maybeSingle();
            if (bData?.id) branchId = bData.id;
          }
        }
      } catch (e) {
        console.warn('Analytics branch resolution warning:', e);
      }
    }

    // Build the query
    let query = (supabase as any)
      .from('orders')
      .select(`
        id,
        order_number,
        branch_id,
        table_id,
        status,
        total_amount,
        customer_note,
        created_at,
        tables (
          table_number
        ),
        order_items (
          id,
          item_id,
          item_name,
          quantity,
          unit_price,
          selected_extras,
          notes
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (branchId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branchId)) {
      query = query.eq('branch_id', branchId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: rawOrders, error } = await query;

    if (error) {
      console.error('Analytics fetch error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Normalize orders
    const orders = (rawOrders || []).map((o: any) => {
      const tableNum = typeof o.tables?.table_number === 'number'
        ? o.tables.table_number
        : typeof o.table_number === 'number'
          ? o.table_number
          : typeof o.table_id === 'string' && /^\d+$/.test(o.table_id)
            ? parseInt(o.table_id, 10)
            : 0;

      const items = (o.order_items || []).map((it: any) => ({
        id: it.id,
        name: it.item_name || 'صنف',
        quantity: Number(it.quantity) || 1,
        price: Number(it.unit_price) || 0,
        total: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
        extras: it.selected_extras || [],
        notes: it.notes || '',
      }));

      return {
        id: o.id,
        orderNumber: o.order_number || `#${o.id.slice(0, 6)}`,
        tableNumber: tableNum,
        status: o.status || 'جديد',
        totalAmount: Number(o.total_amount) || 0,
        customerNote: o.customer_note || '',
        createdAt: o.created_at,
        items,
      };
    });

    return NextResponse.json(
      {
        success: true,
        orders,
        branchId,
        count: orders.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: any) {
    console.error('Analytics API unexpected error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
