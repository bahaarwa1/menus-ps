import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { listActiveOrders } from '@/lib/db/repositories/order.repository';

import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let branchId = request.nextUrl.searchParams.get('branchId');
    const orderId = request.nextUrl.searchParams.get('orderId');

    if (!branchId) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        const session = token ? await verifySession(token) : null;
        if (session?.branchId) branchId = session.branchId;
      } catch {}
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
      query = query.eq('id', orderId);
    } else if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('orders/list error:', error.message);
      // Fallback to in-memory
      const all = await listActiveOrders();
      return NextResponse.json({ success: true, orders: all, source: 'memory' });
    }

    // Map to normalized shape
    const enriched = (orders || []).map((o: any) => {
      // Use direct table_number field if available, fallback to parsing table_id
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
