import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Multi-Tenant Subdomain Extraction
  let currentSubdomain: string | null = null;

  // Clean host (remove port if exists)
  const hostWithoutPort = hostname.split(':')[0].toLowerCase();

  if (hostWithoutPort.endsWith('.vercel.app')) {
    // e.g. "burgerhouse.menus-ps.vercel.app"
    const parts = hostWithoutPort.replace('.vercel.app', '').split('.');
    if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'menus-ps') {
      currentSubdomain = parts[0];
    }
  } else if (hostWithoutPort.endsWith('.menus.ps')) {
    // e.g. "burgerhouse.menus.ps"
    const parts = hostWithoutPort.replace('.menus.ps', '').split('.');
    if (parts.length > 0 && parts[0] !== 'www' && parts[0] !== 'menus') {
      currentSubdomain = parts[0];
    }
  } else if (hostWithoutPort.endsWith('.localhost')) {
    // e.g. "burgerhouse.localhost"
    const parts = hostWithoutPort.replace('.localhost', '').split('.');
    if (parts.length > 0 && parts[0] !== 'www') {
      currentSubdomain = parts[0];
    }
  }

  // 2. Production Dashboard Protection & Role Enforcement
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role === 'staff' || session.role === 'kitchen') {
      return NextResponse.redirect(new URL('/staff', request.url));
    }
  }

  // 3. Demo Role Check
  if (pathname.startsWith('/demo')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (session && (session.role === 'staff' || session.role === 'kitchen')) {
      return NextResponse.redirect(new URL('/staff', request.url));
    }
  }

  // 4. Subdomain Routing:
  let response: NextResponse;

  if (currentSubdomain === 'demo') {
    // Dedicated Demo Subdomain (e.g. demo.menus.ps or demo.menus-ps.vercel.app)
    if (pathname === '/') {
      response = NextResponse.rewrite(new URL('/demo', request.url));
    } else {
      response = NextResponse.next();
    }
    response.headers.set('X-Site-Mode', 'demo');
  } else if (currentSubdomain && pathname === '/') {
    // Restaurant Subdomain (e.g. burgerhouse.menus.ps) -> serve customer menu
    const rewriteUrl = new URL(`/m?restaurant=${currentSubdomain}`, request.url);
    response = NextResponse.rewrite(rewriteUrl);
  } else {
    response = NextResponse.next();
  }

  // 4. Inject Tenant Metadata Headers
  if (currentSubdomain) {
    response.headers.set('X-Tenant-Subdomain', currentSubdomain);
  }

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://images.unsplash.com https://api.qrserver.com https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://rnqebofdzsvmlrwedmys.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, fonts
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)',
  ],
};
