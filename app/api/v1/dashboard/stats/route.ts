import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    const slugParam = request.nextUrl.searchParams.get('slug');
    const branchIdParam = request.nextUrl.searchParams.get('branchId');

    const targetSlug = slugParam || session?.restaurantSlug || '';
    let targetBranchId = branchIdParam || session?.branchId || '';

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        stats: {
          todaySales: 0,
          todayOrdersCount: 0,
          activeTablesCount: 0,
          totalTablesCount: 0,
          avgTicket: 0,
        },
        recentOrders: [],
      });
    }

    const supabase = createAdminClient();

    // Resolve restaurant and branch if needed
    if (!targetBranchId && targetSlug) {
      const { data: rest } = await (supabase as any)
        .from('restaurants')
        .select('id, branches(id)')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (rest) {
        const branches = (rest as any).branches;
        if (Array.isArray(branches) && branches.length > 0) {
          targetBranchId = branches[0].id;
        } else if (branches?.id) {
          targetBranchId = branches.id;
        }
      }
    }

    // Start of today (UTC or local)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // 1. Fetch today's orders
    let todayOrdersQuery = (supabase as any)
      .from('orders')
      .select('id, total_amount, status, created_at, table_number, customer_note, order_items(item_name, quantity)')
      .gte('created_at', startOfToday);

    if (targetBranchId) {
      todayOrdersQuery = todayOrdersQuery.eq('branch_id', targetBranchId);
    }

    const { data: todayOrders, error: ordersError } = await todayOrdersQuery;

    // 2. Fetch all recent orders (up to 5)
    let recentQuery = (supabase as any)
      .from('orders')
      .select('id, order_number, total_amount, status, created_at, table_number, customer_note, order_items(item_name, quantity)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (targetBranchId) {
      recentQuery = recentQuery.eq('branch_id', targetBranchId);
    }

    const { data: recentOrdersData } = await recentQuery;

    // 3. Fetch tables count
    let tablesQuery = (supabase as any)
      .from('tables')
      .select('id, status');

    if (targetBranchId) {
      tablesQuery = tablesQuery.eq('branch_id', targetBranchId);
    }

    const { data: tablesData } = await tablesQuery;

    // Calculate real figures
    const ordersList = (todayOrders || []) as any[];
    const todaySales = ordersList.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const todayOrdersCount = ordersList.length;
    const avgTicket = todayOrdersCount > 0 ? Number((todaySales / todayOrdersCount).toFixed(1)) : 0;

    const allTables = (tablesData || []) as any[];
    const totalTablesCount = allTables.length;
    const activeTablesCount = allTables.filter((t) => t.status === 'مشغولة' || t.status === 'busy').length;

    const recentOrders = ((recentOrdersData || []) as any[]).map((o) => {
      const itemsList = Array.isArray(o.order_items)
        ? o.order_items.map((it: any) => `${it.quantity}x ${it.item_name}`).join('، ')
        : 'طلب من المنيو';

      return {
        id: o.order_number || `#${o.id.slice(0, 6)}`,
        rawId: o.id,
        table: o.table_number || 0,
        items: itemsList,
        total: Number(o.total_amount) || 0,
        status: o.status || 'جديد',
        time: o.created_at
          ? new Date(o.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
          : 'الآن',
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        todaySales,
        todayOrdersCount,
        activeTablesCount,
        totalTablesCount,
        avgTicket,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('dashboard/stats error:', error);
    return NextResponse.json({
      success: true,
      stats: {
        todaySales: 0,
        todayOrdersCount: 0,
        activeTablesCount: 0,
        totalTablesCount: 0,
        avgTicket: 0,
      },
      recentOrders: [],
    });
  }
}
