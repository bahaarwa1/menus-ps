import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { listActiveOrders } from '@/lib/db/repositories/order.repository';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/security/rate-limiter';

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
    let branchId = request.nextUrl.searchParams.get('branchId');

    // Authenticate user session
    let session = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (token) {
        session = await verifySession(token);
      }
    } catch {}

    // SECURITY CHECK:
    // If NOT querying a single order by ID, caller MUST have an authenticated session (staff/manager/kitchen/owner).
    // In dev mode, allow fallback for local testing.
    const isDev = process.env.NODE_ENV !== 'production';
    const isStaffOrAdmin = session && ['owner', 'admin', 'branch_manager', 'staff', 'kitchen'].includes(session.role);

    if (!orderId && !isStaffOrAdmin && !isDev) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: يجب تسجيل الدخول للوصول إلى قائمة الطلبات' },
        { status: 401 }
      );
    }

    // Branch isolation: force session's branchId if authenticated staff/manager
    if (session?.branchId) {
      branchId = session.branchId;
    }

    if (!isSupabaseConfigured()) {
      // Fallback: in-memory store
      const all = await listActiveOrders();
      const filtered = orderId ? all.filter(o => o.id === orderId) : all;
      return NextResponse.json({ success: true, orders: filtered });
    }

    const supabase = createAdminClient();

    // Build query: fetch orders with their items
    let query = (supabase as any)
      .from('orders')
      .select(`
        id,
        order_number,
        branch_id,
        table_id,
        table_number,
        status,
        total_amount,
        customer_note,
        created_at,
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
      .in('status', ['جديد', 'قيد التحضير', 'جاهز'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (orderId) {
      // Single order lookup (e.g. customer tracking their own order)
      query = query.eq('id', orderId.slice(0, 64));
    } else if (branchId) {
      // Strict branch isolation
      query = query.eq('branch_id', branchId.slice(0, 64));
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('orders/list error:', error.message);
      const all = await listActiveOrders();
      return NextResponse.json({ success: true, orders: all, source: 'memory' });
    }

    // Map to normalized shape
    const enriched = (orders || []).map((o: any) => {
      const tableNum = typeof o.table_number === 'number'
        ? o.table_number
        : typeof o.table_id === 'string' && /^\d+$/.test(o.table_id)
          ? parseInt(o.table_id, 10)
          : 0;
      return {
        ...o,
        table_number: tableNum,
        orderNumber: o.order_number,
        totalAmount: o.total_amount,
        customerNote: o.customer_note,
      };
    });

    return NextResponse.json({ success: true, orders: enriched, source: 'db' });
  } catch (error) {
    console.error('orders/list route error:', error);
    const all = await listActiveOrders();
    return NextResponse.json({ success: true, orders: all, source: 'memory-fallback' });
  }
}
