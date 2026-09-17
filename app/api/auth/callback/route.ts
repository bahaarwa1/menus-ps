import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { signSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {}
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete({ name, ...options });
            } catch {}
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const email = (data.user.email || '').toLowerCase().trim();
      const adminClient = createAdminClient();

      // Check if user is the platform master owner
      if (email === 'almhtrf.information22@gmail.com' || email === 'admin@menus.ps') {
        const sessionToken = await signSession({
          userId: data.user.id,
          name: 'مدير المنصة الرئيسي',
          email: email,
          role: 'admin',
          restaurantId: 'platform-master',
          restaurantSlug: 'platform-master',
          branchId: 'master',
        });

        const response = NextResponse.redirect(new URL('/admin', origin));
        response.cookies.set({
          ...getSessionCookieOptions(60 * 60 * 24 * 7),
          name: SESSION_COOKIE_NAME,
          value: sessionToken,
        });
        return response;
      }

      // Check if user has an existing restaurant in DB
      const { data: restaurant } = await (adminClient as any)
        .from('restaurants')
        .select('id, name, slug, branches(id)')
        .eq('slug', email.split('@')[0])
        .maybeSingle();

      if (restaurant) {
        const branchId = restaurant.branches?.[0]?.id || '';
        const sessionToken = await signSession({
          userId: data.user.id,
          name: restaurant.name || data.user.user_metadata?.full_name || 'مدير المطعم',
          email: email,
          role: 'admin',
          restaurantId: restaurant.id,
          restaurantSlug: restaurant.slug,
          branchId: branchId,
        });

        const response = NextResponse.redirect(new URL('/dashboard', origin));
        response.cookies.set({
          ...getSessionCookieOptions(60 * 60 * 24 * 7),
          name: SESSION_COOKIE_NAME,
          value: sessionToken,
        });
        return response;
      }

      // If no restaurant exists yet, redirect to /register with email and name prefilled
      const fullName = encodeURIComponent(data.user.user_metadata?.full_name || '');
      return NextResponse.redirect(
        new URL(`/register?email=${encodeURIComponent(email)}&name=${fullName}`, origin)
      );
    }
  }

  return NextResponse.redirect(new URL('/login?error=oauth_failed', origin));
}
