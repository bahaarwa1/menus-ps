import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { parseSubscriptionFromAddress } from '@/lib/subscription/subscription.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    // Super Admin security check: Platform master owner or admin role
    const isMasterOwner = session?.email === 'almhtrf.information22@gmail.com' || session?.email === 'admin@menus.ps';
    const isSuperAdmin = session?.role === 'admin' && (isMasterOwner || session?.restaurantSlug === 'platform-master' || session?.restaurantSlug === 'burger-house-nablus');

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'غير مصرح للوصول إلى لوحة التحكم الرئيسية' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, error: 'قاعدة البيانات غير مهيأة' }, { status: 500 });
    }

    const supabase = createAdminClient();

    // 1. Fetch all restaurants with branches and tables count
    const { data: restaurants, error: restErr } = await (supabase as any)
      .from('restaurants')
      .select(`
        id,
        name,
        slug,
        phone,
        city,
        currency,
        created_at,
        branches (
          id,
          name,
          address,
          tables_count,
          is_active,
          tables (
            id,
            table_number,
            status
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (restErr) {
      console.error('Admin overview error:', restErr);
      return NextResponse.json({ success: false, error: restErr.message }, { status: 500 });
    }

    // 2. Fetch all auth users to map owner emails
    let authUsers: any[] = [];
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      authUsers = usersData?.users || [];
    } catch (authErr) {
      console.warn('Failed to list auth users in overview:', authErr);
    }

    // 3. Fetch all orders for aggregate metrics
    const { data: orders, error: ordersErr } = await (supabase as any)
      .from('orders')
      .select('id, branch_id, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    const allOrders = orders || [];

    // Calculate system-wide aggregates
    const totalOrdersCount = allOrders.length;
    const totalGrossRevenue = allOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);
    
    let totalTablesCount = 0;
    const restaurantsWithStats = (restaurants || []).map((r: any) => {
      const primaryBranch = r.branches?.[0];
      const branchId = primaryBranch?.id;
      const tablesCount = primaryBranch?.tables?.length || primaryBranch?.tables_count || 0;
      totalTablesCount += tablesCount;

      const restOrders = allOrders.filter((o: any) => o.branch_id === branchId);
      const restRevenue = restOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0);

      const { cleanAddress, subscription } = parseSubscriptionFromAddress(
        primaryBranch?.address,
        r.created_at
      );

      // Match owner email from auth users or in-memory fallback
      const matchedUser = authUsers.find((u: any) => {
        const meta = u.user_metadata || {};
        return (
          meta.restaurant_id === r.id ||
          meta.restaurant_slug === r.slug ||
          (u.email && r.slug && u.email.toLowerCase().startsWith(r.slug.toLowerCase()))
        );
      });
      const memoryRecord = global.__menusRestaurantsStore?.get(r.slug);
      const ownerEmail = matchedUser?.email || memoryRecord?.ownerEmail || '';

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        phone: r.phone || '',
        city: r.city || '',
        ownerEmail,
        address: cleanAddress,
        currency: r.currency || '₪',
        createdAt: r.created_at,
        subdomainUrl: `https://${r.slug}.menus.cool`,
        branchId: branchId || '',
        tablesCount: tablesCount,
        isActive: primaryBranch?.is_active !== false,
        subscription,
        totalOrders: restOrders.length,
        totalRevenue: restRevenue,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRestaurants: restaurantsWithStats.length,
        totalTables: totalTablesCount,
        totalOrders: totalOrdersCount,
        totalRevenue: totalGrossRevenue,
        currency: '₪',
      },
      restaurants: restaurantsWithStats,
      recentOrders: allOrders.slice(0, 20).map((o: any) => ({
        id: o.id,
        orderNumber: `#${o.id.slice(0, 6)}`,
        totalAmount: Number(o.total_amount),
        status: o.status,
        createdAt: o.created_at,
      })),
    });
  } catch (error) {
    console.error('Admin overview route error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
