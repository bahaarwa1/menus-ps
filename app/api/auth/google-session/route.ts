import { NextRequest, NextResponse } from 'next/server';
import { signSession, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Creates our custom JWT session cookie after Google OAuth.
 * Called by the client-side /auth/callback page.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ success: false, error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Master admin check
    const isMasterAdmin =
      normalizedEmail === 'almhtrf.information22@gmail.com' ||
      normalizedEmail === 'admin@menus.ps';

    if (isMasterAdmin) {
      const token = await signSession({
        userId,
        email: normalizedEmail,
        name: 'مدير المنصة الرئيسي',
        role: 'admin',
        restaurantId: 'platform-master',
        restaurantSlug: 'platform-master',
        branchId: 'master',
      });
      const response = NextResponse.json({ success: true, redirectTo: '/admin' });
      response.cookies.set({ ...getSessionCookieOptions(), name: SESSION_COOKIE_NAME, value: token });
      return response;
    }

    // Look up restaurant for this user
    let restaurantId = '';
    let restaurantSlug = '';
    let branchId = '';
    let restaurantName = name;

    // 1. Check Supabase Auth user metadata
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const matchedUser = usersData?.users?.find(
          u => u.id === userId || u.email?.toLowerCase() === normalizedEmail
        );
        const meta = matchedUser?.user_metadata || {};

        if (meta.restaurant_id) {
          restaurantId = meta.restaurant_id;
          restaurantSlug = meta.restaurant_slug || '';
          branchId = meta.branch_id || '';
          restaurantName = meta.full_name || name;
        }
      } catch (e) {
        console.warn('Supabase listUsers lookup error:', e);
      }
    }

    // 2. Check global memory store by owner email
    if (!restaurantId && global.__menusRestaurantsStore) {
      global.__menusRestaurantsStore.forEach((rest) => {
        if (!restaurantId && rest.ownerEmail && rest.ownerEmail.toLowerCase() === normalizedEmail) {
          restaurantId = rest.id;
          restaurantSlug = rest.slug;
          branchId = rest.branchId;
          restaurantName = rest.name || name;
        }
      });
    }

    // 3. Fallback: check restaurants table in Supabase by slug prefix
    if (!restaurantId && isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();
        const emailSlug = normalizedEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (emailSlug) {
          const { data: rest } = await (adminClient as any)
            .from('restaurants')
            .select('id, name, slug, branches(id)')
            .eq('slug', emailSlug)
            .maybeSingle();

          if (rest) {
            restaurantId = rest.id;
            restaurantSlug = rest.slug;
            restaurantName = rest.name || name;
            branchId = (Array.isArray(rest.branches) ? rest.branches[0]?.id : rest.branches?.id) || '';
          }
        }
      } catch (e) {
        console.warn('Supabase slug lookup error:', e);
      }
    }

    // If restaurant is found, log the user in
    if (restaurantId) {
      const token = await signSession({
        userId,
        email: normalizedEmail,
        name: restaurantName,
        role: 'admin',
        restaurantId,
        restaurantSlug,
        branchId,
      });
      const response = NextResponse.json({ success: true, redirectTo: '/dashboard' });
      response.cookies.set({ ...getSessionCookieOptions(), name: SESSION_COOKIE_NAME, value: token });
      return response;
    }

    // No restaurant found → send to register with email prefilled
    return NextResponse.json({
      success: true,
      redirectTo: `/register?email=${encodeURIComponent(normalizedEmail)}&name=${encodeURIComponent(name)}`,
    });

  } catch (error) {
    console.error('google-session error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في السيرفر' }, { status: 500 });
  }
}
