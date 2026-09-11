import { NextRequest, NextResponse } from 'next/server';
import { rotateTableToken } from '@/lib/tables/table-tokens';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = rateLimiter.check(`table-token:${ip}`, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز معدل الطلبات المسموح به' },
        { status: 429 }
      );
    }

    // Verify admin/manager session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    const isDev = process.env.NODE_ENV !== 'production';
    const isAuthorized = session && ['owner', 'admin', 'branch_manager'].includes(session.role);

    if (!isAuthorized && !isDev) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتجديد رموز الطاولات — يتطلب حساب إداري' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const tableNumber = body.tableNumber ?? body.tableId;

    if (!tableNumber) {
      return NextResponse.json(
        { success: false, error: 'رقم الطاولة مطلوب' },
        { status: 400 }
      );
    }

    const rotationResult = await rotateTableToken(tableNumber);

    if (!rotationResult.success || !rotationResult.newToken) {
      return NextResponse.json(
        { success: false, error: rotationResult.error || 'فشل تجديد رمز الطاولة' },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const dynamicQrUrl = `${appUrl}/m?t=${rotationResult.newToken}`;

    return NextResponse.json({
      success: true,
      tableNumber,
      token: rotationResult.newToken,
      newToken: rotationResult.newToken,
      dynamicQrUrl,
      message: `تم تجديد رمز QR بنجاح لطاولة رقم ${tableNumber}`,
    });
  } catch (error) {
    console.error('Rotate token API error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء تجديد رمز الطاولة' },
      { status: 500 }
    );
  }
}
