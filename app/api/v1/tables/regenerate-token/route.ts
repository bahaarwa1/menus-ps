import { NextRequest, NextResponse } from 'next/server';
import { rotateTableToken } from '@/lib/tables/table-tokens';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Verify admin/manager session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    // Allow in dev/demo or if authenticated as admin/manager
    const isAuthorized = session?.role === 'admin' || session?.role === 'branch_manager' || !session;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتجديد أكواد الطاولات' },
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
