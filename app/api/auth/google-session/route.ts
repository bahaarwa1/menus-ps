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

    // Look up restaurant by owner email
    if (isSupabaseConfigured()) {
      try {
        const adminClient = createAdminClient();

        // Try to find restaurant linked to this user
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const matchedUser = usersData?.users?.find(u => u.id === userId || u.email?.toLowerCase() === normalizedEmail);
        const meta = matchedUser?.user_metadata || {};

        let restaurantId = meta.restaurant_id || '';
        let restaurantSlug = meta.restaurant_slug || '';
        let branchId = meta.branch_id || '';
        let restaurantName = name;

        // If not in metadata, look up by email prefix or existing restaurant
        if (!restaurantId) {
          const emailSlug = normalizedEmail.split('@')[0];
          const { data: rest } = await (adminClient as any)
            .from('restaurants')
            .select('id, name, slug, branches(id)')
            .or(`owner_email.eq.${normalizedEmail},slug.eq.${emailSlug}`)
            .maybeSingle();

          if (rest) {
            restaurantId = rest.id;
            restaurantSlug = rest.slug;
            restaurantName = rest.name || name;
            branchId = (Array.isArray(rest.branches) ? rest.branches[0]?.id : rest.branches?.id) || '';
          }
        }

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
      } catch { /* fall through to register */ }
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
