import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithEmailPassword } from '@/lib/auth/service';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, redirectTo } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const authResult = await authenticateWithEmailPassword(email, password);

    if (!authResult.success || !authResult.session) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'فشل تسجيل الدخول' },
        { status: 401 }
      );
    }

    // Generate stateless signed session token
    const token = await signSession(authResult.session);

    // Determine redirect
    let target = redirectTo;
    if (!target) {
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

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
