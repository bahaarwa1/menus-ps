import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithStaffPin } from '@/lib/auth/service';
import { signSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin, branchId } = body;

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'رمز الـ PIN مطلوب' },
        { status: 400 }
      );
    }

    const authResult = await authenticateWithStaffPin(pin, branchId);

    if (!authResult.success || !authResult.session) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'رمز الـ PIN غير صالح' },
        { status: 401 }
      );
    }

    // Generate stateless signed session token
    const token = await signSession(authResult.session);

    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.session.userId,
        name: authResult.session.name,
        role: authResult.session.role,
        branchId: authResult.session.branchId,
      },
      redirectTo: '/staff',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Staff PIN route error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء فحص الـ PIN' },
      { status: 500 }
    );
  }
}
