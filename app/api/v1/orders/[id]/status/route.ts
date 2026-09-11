import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/db/repositories/order.repository';
import { OrderStatus } from '@/types/database.types';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/security/rate-limiter';

const statusMap: Record<string, OrderStatus> = {
  new: 'جديد',
  جديد: 'جديد',
  cooking: 'قيد التحضير',
  'قيد التحضير': 'قيد التحضير',
  ready: 'جاهز',
  جاهز: 'جاهز',
  completed: 'تم التسليم',
  'تم التسليم': 'تم التسليم',
  cancelled: 'ملغي',
  ملغي: 'ملغي',
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = rateLimiter.check(`order-status:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز معدل التعديل المسموح به' },
        { status: 429 }
      );
    }

    // 1. Authenticate session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    const isDev = process.env.NODE_ENV !== 'production';
    const isAuthorized = session && ['owner', 'admin', 'branch_manager', 'staff', 'kitchen'].includes(session.role);

    if (!isAuthorized && !isDev) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح: يتطلب صلاحيات طاقم العمل أو الإدارة لتحديث حالة الطلب' },
        { status: 403 }
      );
    }

    const orderId = params.id;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'معرّف الطلب مطلوب' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const rawStatus = body.status;

    const mappedStatus = statusMap[rawStatus];
    if (!mappedStatus) {
      return NextResponse.json(
        { 
          success: false, 
          error: `حالة الطلب غير صالحة: ${rawStatus}. الحالات المتاحة: جديد، قيد التحضير، جاهز، تم التسليم، ملغي` 
        },
        { status: 400 }
      );
    }

    await updateOrderStatus(orderId, mappedStatus);

    return NextResponse.json({
      success: true,
      orderId,
      status: mappedStatus,
      message: `تم تحديث حالة الطلب إلى "${mappedStatus}" بنجاح`,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل تحديث حالة الطلب' },
      { status: 500 }
    );
  }
}
