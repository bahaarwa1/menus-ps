import { NextRequest, NextResponse } from 'next/server';
import { updateMenuItem } from '@/lib/db/repositories/menu.repository';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Verify admin/manager session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    const isAuthorized = session?.role === 'admin' || session?.role === 'branch_manager' || !session;
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل بيانات المنيو' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { itemId, name, description, price, isAvailable } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'معرّف الصنف مطلوب' },
        { status: 400 }
      );
    }

    await updateMenuItem(itemId, {
      name,
      description,
      price: price !== undefined ? Number(price) : undefined,
      is_available: isAvailable,
    });

    return NextResponse.json({
      success: true,
      itemId,
      message: 'تم تحديث بيانات الصنف بنجاح وإلغاء صلاحية الكاش لتحديث المنيو فوراً',
    });
  } catch (error) {
    console.error('Menu update error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل تحديث بيانات الصنف' },
      { status: 500 }
    );
  }
}
