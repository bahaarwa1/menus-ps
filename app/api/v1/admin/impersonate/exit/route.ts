import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, signSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    // Verify caller is platform master or impersonating
    const isMaster =
      session?.email === 'almhtrf.information22@gmail.com' ||
      session?.email === 'admin@menus.ps' ||
      (session?.userId && session.userId.startsWith('superadmin-impersonate-'));

    if (!isMaster) {
      return NextResponse.json({ success: false, error: 'غير مصرح للوصول لهذه العملية' }, { status: 403 });
    }

    // Restore platform master session
    const masterToken = await signSession({
      userId: 'master-platform-owner',
      email: 'admin@menus.ps',
      name: 'مدير المنصة الرئيسي',
      role: 'admin',
      branchId: 'master',
      restaurantId: 'platform-master',
      restaurantSlug: 'platform-master',
    });

    const response = NextResponse.json({
      success: true,
      message: 'تمت العودة إلى لوحة الإدارة العامة بنجاح',
      redirectTo: '/admin',
    });

    response.cookies.set({
      ...getSessionCookieOptions(),
      name: SESSION_COOKIE_NAME,
      value: masterToken,
    });

    return response;
  } catch (error) {
    console.error('Exit impersonation error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء العودة للوحة الإدارة العامة' }, { status: 500 });
  }
}
