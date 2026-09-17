import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { verifySession, signSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    // Security: Only Super Admin can impersonate restaurant owners
    const isMasterOwner = session?.email === 'almhtrf.information22@gmail.com' || session?.email === 'admin@menus.ps';
    const isSuperAdmin = session?.role === 'admin' && (isMasterOwner || session?.restaurantSlug === 'platform-master' || session?.restaurantSlug === 'burger-house-nablus');

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'غير مصرح للوصول لهذه العملية' }, { status: 403 });
    }

    const restaurantId = params.id;
    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'معرف المطعم مطلوب' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch restaurant with primary branch
    const { data: rest, error: restErr } = await (supabase as any)
      .from('restaurants')
      .select('id, name, slug, branches(id, name, is_active)')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restErr || !rest) {
      // Check in-memory fallback
      let memRest: any = null;
      if (global.__menusRestaurantsStore) {
        global.__menusRestaurantsStore.forEach((r) => {
          if (r.id === restaurantId || r.slug === restaurantId) {
            memRest = r;
          }
        });
      }

      if (!memRest) {
        return NextResponse.json({ success: false, error: 'المطعم غير موجود' }, { status: 404 });
      }

      // Impersonate from memory store
      const impersonationToken = await signSession({
        userId: `superadmin-impersonate-${session.userId || 'admin'}`,
        name: memRest.name,
        email: session.email || 'admin@menus.ps',
        role: 'admin',
        restaurantId: memRest.id,
        restaurantSlug: memRest.slug,
        branchId: memRest.branchId,
      });

      const response = NextResponse.json({
        success: true,
        message: `تم الدخول بنجاح كمدير لمطعم ${memRest.name}`,
        redirectTo: '/dashboard',
      });

      response.cookies.set({
        ...getSessionCookieOptions(60 * 60 * 4), // 4 hours
        name: SESSION_COOKIE_NAME,
        value: impersonationToken,
      });

      return response;
    }

    const branches = Array.isArray(rest.branches) ? rest.branches : (rest.branches ? [rest.branches] : []);
    const primaryBranch = branches.find((b: any) => b.is_active) || branches[0];
    const branchId = primaryBranch?.id || '';

    // 2. Sign impersonation JWT
    const impersonationToken = await signSession({
      userId: `superadmin-impersonate-${session.userId || 'admin'}`,
      name: rest.name,
      email: session.email || 'admin@menus.ps', // Retains master email for security & exit capability
      role: 'admin',
      restaurantId: rest.id,
      restaurantSlug: rest.slug,
      branchId,
    });

    // 3. Set cookie and redirect
    const response = NextResponse.json({
      success: true,
      message: `تم الدخول بنجاح كمدير لمطعم ${rest.name}`,
      redirectTo: '/dashboard',
    });

    response.cookies.set({
      ...getSessionCookieOptions(60 * 60 * 4), // 4 hours session
      name: SESSION_COOKIE_NAME,
      value: impersonationToken,
    });

    return response;
  } catch (error) {
    console.error('Restaurant impersonate error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء محاولة تسجيل الدخول كمدير مطعم' }, { status: 500 });
  }
}
