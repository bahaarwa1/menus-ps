import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/db/repositories/order.repository';
import { OrderStatus } from '@/types/database.types';

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
    const orderId = params.id;
    if (!orderId) {
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
