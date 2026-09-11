import { NextRequest, NextResponse } from 'next/server';
import { updateMenuItem } from '@/lib/db/repositories/menu.repository';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { sanitizeInput } from '@/lib/security/crypto';
import { rateLimiter } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = rateLimiter.check(`menu-update:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز معدل التعديل المسموح به' },
        { status: 429 }
      );
    }

    // Verify admin/manager/owner session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    const isDev = process.env.NODE_ENV !== 'production';
    const isAuthorized = session && ['owner', 'admin', 'branch_manager'].includes(session.role);

    if (!isAuthorized && !isDev) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح لك بتعديل بيانات المنيو — يتطلب حساب إداري' },
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

    // Input sanitization
    const sanitizedName = name ? sanitizeInput(String(name), 100) : undefined;
    const sanitizedDesc = description ? sanitizeInput(String(description), 500) : undefined;
    const numericPrice = price !== undefined ? Math.max(0, Number(price)) : undefined;

    await updateMenuItem(String(itemId).slice(0, 64), {
      name: sanitizedName,
      description: sanitizedDesc,
      price: numericPrice,
      is_available: typeof isAvailable === 'boolean' ? isAvailable : undefined,
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
