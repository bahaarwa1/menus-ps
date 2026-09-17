import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithEmailPassword } from '@/lib/auth/service';
import { signSession, getSessionCookieOptions } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { sanitizeInput } from '@/lib/security/crypto';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const lockoutKey = `login:${ip}`;

    // 1. Check progressive lockout status
    const lockoutStatus = rateLimiter.isLockedOut(lockoutKey);
    if (lockoutStatus.locked) {
      return NextResponse.json(
        { 
          success: false, 
          error: `تم قفل محاولات تسجيل الدخول مؤقتاً لتكرار المحاولات الخاطئة. انتظر ${Math.ceil(lockoutStatus.remainingSeconds / 60)} دقيقة.` 
        },
        { status: 429, headers: { 'Retry-After': String(lockoutStatus.remainingSeconds) } }
      );
    }

    // 2. Sliding window check: max 5 login attempts per minute per IP
    const rateLimit = rateLimiter.check(lockoutKey, 5, 60);
    if (!rateLimit.allowed) {
      // Artificial delay to thwart automated dictionary attacks
      await new Promise(r => setTimeout(r, 1000));
      return NextResponse.json(
        { success: false, error: `تم تجاوز الحد المسموح به. انتظر ${rateLimit.resetInSeconds} ثانية.` },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds), 'X-RateLimit-Limit': '5' } }
      );
    }

    const body = await request.json();
    const { email, password, redirectTo } = body;

    // Input sanitization
    const cleanEmail = sanitizeInput(String(email || ''), 200).toLowerCase().trim();
    const cleanPassword = String(password || '').slice(0, 200);

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const authResult = await authenticateWithEmailPassword(cleanEmail, cleanPassword);

    if (!authResult.success || !authResult.session) {
      // Record failure for progressive lockout (5 failures -> 15 min lock)
      rateLimiter.recordFailure(lockoutKey, 5, 15);
      return NextResponse.json(
        { success: false, error: authResult.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Successful login: reset failures
    rateLimiter.recordSuccess(lockoutKey);

    // Generate stateless signed session token
    const token = await signSession(authResult.session);

    // Determine safe redirect
    let target = typeof redirectTo === 'string' ? redirectTo.replace(/[^a-zA-Z0-9\/\-_?=&]/g, '') : '';
    
    // Master admin emails always go to /admin panel — no restaurant dashboard
    const isMasterAdmin =
      authResult.session.email === 'almhtrf.information22@gmail.com' ||
      authResult.session.email === 'admin@menus.ps' ||
      authResult.session.restaurantSlug === 'platform-master';
    if (isMasterAdmin) {
      target = '/admin';
    } else if (!target || !target.startsWith('/') || target.startsWith('//')) {
      target = authResult.session.role === 'staff' || authResult.session.role === 'kitchen' ? '/staff' : '/dashboard';
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.session.userId,
        email: authResult.session.email,
        name: authResult.session.name,
        role: authResult.session.role,
        branchId: authResult.session.branchId,
        restaurantId: authResult.session.restaurantId,
        restaurantSlug: authResult.session.restaurantSlug,
      },
      redirectTo: target,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      ...getSessionCookieOptions(),
      value: token,
    });

    return response;
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
