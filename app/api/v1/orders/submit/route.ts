import { NextRequest, NextResponse } from 'next/server';
import { validateAndCalculateOrder } from '@/lib/pricing/price-validator';
import { createOrder } from '@/lib/db/repositories/order.repository';
import { rateLimiter } from '@/lib/security/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    // 0. Rate limiting protection: 10 orders/min per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = rateLimiter.check(`order:${ip}`, 10, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار ${rateLimit.resetInSeconds} ثانية قبل إرسال طلب جديد.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetInSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const body = await request.json();
    const { branchId, tableNumber, items, customerNote } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'سلة الطلب فارغة، يرجى اختيار أصناف قبل الإرسال' },
        { status: 400 }
      );
    }

    const tableNum = Number(tableNumber) || 12;
    const branch = branchId || 'b0000000-0000-0000-0000-000000000001';

    // 1. Authoritative Server-Side Price Recalculation
    const validation = await validateAndCalculateOrder(items);

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'فشل التحقق من أسعار الطلب' },
        { status: 400 }
      );
    }

    // 2. Sanitize overall customer note
    const sanitizedGeneralNote = (customerNote || '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 300);

    // 3. Atomically persist order to PostgreSQL repository
    const orderResult = await createOrder({
      branchId: branch,
      tableId: `table-num-${tableNum}`,
      tableNumber: tableNum,
      customerNote: sanitizedGeneralNote || undefined,
      items: validation.items.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedExtras: item.selectedExtras,
        notes: item.note || undefined,
      })),
    });

    return NextResponse.json(
      {
        success: true,
        orderId: orderResult.id,
        orderNumber: orderResult.orderNumber,
        order: {
          id: orderResult.id,
          orderNumber: orderResult.orderNumber,
          status: orderResult.status,
          totalAmount: orderResult.totalAmount,
          currency: validation.currency,
          itemsCount: validation.items.length,
          createdAt: orderResult.createdAt,
          items: validation.items,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order submit route error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى' },
      { status: 500 }
    );
  }
}
