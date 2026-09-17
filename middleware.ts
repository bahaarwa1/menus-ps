import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

// Paths that require authentication
const PROTECTED_PATHS = ['/dashboard'];
const STAFF_PATHS = ['/staff'];

// API paths that mutate state (require CSRF-safe methods check)
const MUTATION_API_PREFIXES = ['/api/v1/', '/api/auth/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const method = request.method;

  // ──────────────────────────────────────────────────────────────────
  // 1. BLOCK SENSITIVE HTTP METHODS ON NON-API ROUTES
  // ──────────────────────────────────────────────────────────────────
  const isMutationMethod = ['PUT', 'DELETE', 'PATCH'].includes(method);
  const isApiRoute = pathname.startsWith('/api/');
  if (isMutationMethod && !isApiRoute) {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. BLOCK SUSPICIOUS PATTERNS (PATH TRAVERSAL, ETC.)
  // ──────────────────────────────────────────────────────────────────
  if (
    pathname.includes('..') ||
    pathname.includes('//') ||
    /[<>'"`;]/.test(pathname)
  ) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // ──────────────────────────────────────────────────────────────────
  // 3. MULTI-TENANT SUBDOMAIN EXTRACTION
  // ──────────────────────────────────────────────────────────────────
  let currentSubdomain: string | null = null;
  const hostWithoutPort = hostname.split(':')[0].toLowerCase();

  if (hostWithoutPort.endsWith('.vercel.app')) {
    const parts = hostWithoutPort.replace('.vercel.app', '').split('.');
    if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'menus-ps') {
      currentSubdomain = parts[0];
    }
  } else if (hostWithoutPort.endsWith('.menus.cool')) {
    const parts = hostWithoutPort.replace('.menus.cool', '').split('.');
    if (parts.length > 0 && parts[0] !== 'www' && parts[0] !== 'menus') {
      currentSubdomain = parts[0];
    }
  } else if (hostWithoutPort.endsWith('.menus.ps')) {
    const parts = hostWithoutPort.replace('.menus.ps', '').split('.');
    if (parts.length > 0 && parts[0] !== 'www' && parts[0] !== 'menus') {
      currentSubdomain = parts[0];
    }
  } else if (hostWithoutPort.endsWith('.localhost')) {
    const parts = hostWithoutPort.replace('.localhost', '').split('.');
    if (parts.length > 0 && parts[0] !== 'www') {
      currentSubdomain = parts[0];
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 4. DASHBOARD PROTECTION & ROLE ENFORCEMENT
  // ──────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const redirect = NextResponse.redirect(loginUrl);
      // Clear any invalid cookie
      redirect.cookies.delete(SESSION_COOKIE_NAME);
      return redirect;
    }

    // Staff/kitchen cannot access dashboard
    if (session.role === 'staff' || session.role === 'kitchen') {
      return NextResponse.redirect(new URL('/staff', request.url));
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 5. STAFF ROUTE PROTECTION
  // ──────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/staff')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) {
      return NextResponse.redirect(new URL('/login?role=staff', request.url));
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 6. DEMO ROLE ROUTING
  // ──────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/demo')) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (session && (session.role === 'staff' || session.role === 'kitchen')) {
      return NextResponse.redirect(new URL('/staff', request.url));
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // 7. NONCE GENERATION & STRICT CSP CONSTRUCTION
  // ──────────────────────────────────────────────────────────────────
  // Generate cryptographically strong nonce for Next.js hydration scripts
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  // script-src: strict nonce + strict-dynamic, NO unsafe-inline, NO wildcard https:
  const scriptDirectives = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(' ');

  // Content-Security-Policy: minimal, strictly required sources only
  const cspDirectives = [
    "default-src 'self'",
    `script-src ${scriptDirectives}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self'",
    "block-all-mixed-content",
    ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
  ];

  const cspString = cspDirectives.join('; ');

  // Propagate nonce and CSP to Next.js request headers so the server renders scripts with nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', cspString);

  // ──────────────────────────────────────────────────────────────────
  // 8. RESTRICTED CORS & PREFLIGHT HANDLING (NO WILDCARD *)
  // ──────────────────────────────────────────────────────────────────
  const origin = request.headers.get('origin');
  const isAllowedOrigin = Boolean(
    origin && (
      /^https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:menus\.ps|vercel\.app)(?::\d+)?$/.test(origin) ||
      /^http:\/\/localhost(?::\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin)
    )
  );

  // Handle preflight OPTIONS requests for API routes
  if (isApiRoute && method === 'OPTIONS') {
    const preflightHeaders = new Headers();
    if (isAllowedOrigin && origin) {
      preflightHeaders.set('Access-Control-Allow-Origin', origin);
      preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
      preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Subdomain');
      preflightHeaders.set('Access-Control-Max-Age', '86400');
    }
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // ──────────────────────────────────────────────────────────────────
  // 9. SUBDOMAIN ROUTING & RESPONSE INSTANTIATION
  // ──────────────────────────────────────────────────────────────────
  let response: NextResponse;

  if (currentSubdomain === 'demo') {
    if (pathname === '/') {
      response = NextResponse.rewrite(new URL('/demo', request.url), {
        request: { headers: requestHeaders },
      });
    } else {
      response = NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
    response.headers.set('X-Site-Mode', 'demo');
  } else if (currentSubdomain && pathname === '/') {
    const rewriteUrl = new URL(`/m?restaurant=${encodeURIComponent(currentSubdomain)}`, request.url);
    response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  } else {
    response = NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // 10. INJECT TENANT METADATA HEADERS
  // ──────────────────────────────────────────────────────────────────
  if (currentSubdomain) {
    response.headers.set('X-Tenant-Subdomain', currentSubdomain);
  }

  // ──────────────────────────────────────────────────────────────────
  // 11. CORS RESPONSE HEADERS FOR ALLOWED ORIGINS ONLY
  // ──────────────────────────────────────────────────────────────────
  if (isApiRoute && isAllowedOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Tenant-Subdomain');
  }

  // ──────────────────────────────────────────────────────────────────
  // 12. HARDENED SECURITY HEADERS
  // ──────────────────────────────────────────────────────────────────

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Block clickjacking (frames from other origins)
  response.headers.set('X-Frame-Options', 'DENY');

  // Legacy XSS protection header
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy — don't leak full URL to third parties
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser features (no camera, mic, location, payment)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=()'
  );

  // HSTS — force HTTPS for 2 years (including subdomains)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Remove server fingerprinting headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  // Set the Strict Content-Security-Policy (Nonce-based, zero unsafe-inline in script-src)
  response.headers.set('Content-Security-Policy', cspString);

  // Cross-Origin policies
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ico)$).*)',
  ],
};
