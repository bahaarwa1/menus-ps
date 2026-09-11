import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { listActiveOrders } from '@/lib/db/repositories/order.repository';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { appCache } from '@/lib/cache/lru-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    
    // Rate limit: max 60 requests per minute
    const rateLimit = rateLimiter.check(`orders-list:${ip}`, 60, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز معدل الطلبات المسموح به' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
      );
    }

    const orderId = request.nextUrl.searchParams.get('orderId');
    // NOTE: branchId from query param is only a hint for dev. Session always overrides.
    let branchId: string | null = request.nextUrl.searchParams.get('branchId');

    // Authenticate user session
    let session = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        session = await verifySession(token);
      }
    } catch {}

    // ── AUTHENTICATION CHECK ──
    // Customer tracking a specific order by ID is always allowed (no auth needed).
    // Listing all orders requires a valid staff/admin session.
    const isDev = process.env.NODE_ENV !== 'production';
    const isStaffOrAdmin = session && ['owner', 'admin', 'branch_manager', 'staff', 'kitchen'].includes(session.role);

    if (!orderId && !isStaffOrAdmin && !isDev) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: يجب تسجيل الدخول للوصول إلى قائمة الطلبات' },
        { status: 401 }
      );
    }

    // ── STRICT BRANCH ISOLATION ──
    // This is the core security check — prevents data leakage across restaurants.
    if (session?.branchId) {
      // Priority 1: Session has branchId → always enforce it, ignore query param
      branchId = session.branchId;
    } else if (session && ['staff', 'kitchen'].includes(session.role)) {
      // Priority 2: Staff/kitchen with NO branchId → DENY. This should never happen
      // in production since the PIN login always sets branchId. But if it does,
      // returning all orders would be a severe data leak.
      return NextResponse.json(
        { success: false, error: 'غير مصرح: لا يوجد معرف فرع مرتبط بحسابك. يرجى التواصل مع مدير المطعم.' },
        { status: 403 }
      );
    } else if (session && ['admin', 'owner', 'branch_manager'].includes(session.role) && !session.branchId && session.restaurantId && isSupabaseConfigured()) {
      // Priority 3: Admin/owner without explicit branchId → resolve from restaurantId
      try {
        const adminSb = createAdminClient();
        const { data: branchData } = await (adminSb as any)
          .from('branches')
          .select('id')
          .eq('restaurant_id', session.restaurantId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        if (branchData?.id) {
          branchId = branchData.id;
        }
      } catch { /* Silently continue; will deny below if still no branchId */ }
    }

    // After branch resolution: if listing orders with no branch scope → deny
    if (!orderId && !branchId && session && !isDev) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: لا يمكن تحديد نطاق الطلبات. يرجى التحقق من إعدادات حسابك.' },
        { status: 403 }
      );
    }

    // Cost-optimization: In-memory caching for active orders list (heavily polled by kitchen & waiter screens)
    const cacheKey = !orderId ? `orders:list:${branchId || 'all'}` : null;
    if (cacheKey) {
      const cached = appCache.get<any[]>(cacheKey);
      if (cached) {
        return NextResponse.json(
          { success: true, orders: cached, source: 'cache' },
          {
            headers: {
              'X-Cache': 'HIT',
              'Cache-Control': 'private, max-age=5',
            },
          }
        );
      }
    }

    if (!isSupabaseConfigured()) {
      // Fallback: in-memory store (dev only) — always branch-scoped
      const all = await listActiveOrders(branchId ?? undefined);
      const filtered = orderId ? all.filter(o => o.id === orderId) : all;
      return NextResponse.json({ success: true, orders: filtered });
    }

    const supabase = createAdminClient();

    // Build query: fetch orders with their items and joined table number
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
      .in('status', ['جديد', 'قيد التحضير', 'جاهز', 'تم التسليم', 'new', 'cooking', 'ready', 'completed'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (orderId) {
      // Single order lookup (e.g. customer tracking their own order)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (isUuid) {
        query = query.eq('id', orderId.slice(0, 64));
      } else {
        const cleanNum = orderId.replace(/^#/, '');
        query = query.or(`order_number.eq.${cleanNum},order_number.eq.#${cleanNum}`);
      }
    } else if (branchId) {
      // Strict branch isolation — ALWAYS filter by branch_id
      query = query.eq('branch_id', branchId.slice(0, 64));
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('orders/list error:', error.message);
      const all = await listActiveOrders(branchId ?? undefined);
      return NextResponse.json({ success: true, orders: all, source: 'memory' });
    }

    // Map to normalized shape
    const enriched = (orders || []).map((o: any) => {
      const tableNum = typeof o.tables?.table_number === 'number'
        ? o.tables.table_number
        : typeof o.table_number === 'number'
          ? o.table_number
          : typeof o.table_id === 'string' && /^\d+$/.test(o.table_id)
            ? parseInt(o.table_id, 10)
            : 0;
      return {
        ...o,
        table_number: tableNum,
        tableNumber: tableNum,
        orderNumber: o.order_number,
        totalAmount: Number(o.total_amount) || 0,
        customerNote: o.customer_note,
      };
    });

    if (cacheKey) {
      appCache.set(cacheKey, enriched, 8, ['orders', `orders:${branchId || 'all'}`]);
    }

    return NextResponse.json(
      { success: true, orders: enriched, source: 'db' },
      {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'private, max-age=5',
        },
      }
    );
  } catch (error) {
    console.error('orders/list route error:', error);
    return NextResponse.json({ success: true, orders: [], source: 'error-fallback' });
  }
}
