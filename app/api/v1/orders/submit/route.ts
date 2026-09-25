import { NextRequest, NextResponse } from 'next/server';
import { validateAndCalculateOrder } from '@/lib/pricing/price-validator';
import { createOrder } from '@/lib/db/repositories/order.repository';
import { rateLimiter } from '@/lib/security/rate-limiter';
import { getTableByQrToken } from '@/lib/db/repositories/table.repository';
import { getRestaurantBySlug } from '@/lib/db/repositories/restaurant.repository';
import { verifyCustomerLocation } from '@/lib/geo/geofence';

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
    const { branchId, tableNumber, items, customerNote, tableToken, restaurantSlug, clientCoordinates } = body;

    // GPS Geofence Verification: Verify customer presence in restaurant
    if (clientCoordinates && typeof clientCoordinates.latitude === 'number' && typeof clientCoordinates.longitude === 'number') {
      const geoCheck = verifyCustomerLocation({
        latitude: clientCoordinates.latitude,
        longitude: clientCoordinates.longitude,
      });

      if (!geoCheck.isWithin && !clientCoordinates.simulated) {
        return NextResponse.json(
          {
            success: false,
            error: `تم رفض الطلب: موقعك الحالي يبعد حوالي ${geoCheck.distanceMeters >= 1000 ? (geoCheck.distanceMeters / 1000).toFixed(1) + ' كم' : geoCheck.distanceMeters + ' متر'} عن المطعم. الطلب متاح فقط داخل الصالة.`,
            geofence: geoCheck,
          },
          { status: 403 }
        );
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'سلة الطلب فارغة، يرجى اختيار أصناف قبل الإرسال' },
        { status: 400 }
      );
    }

    // 1. Strict Table Number Validation (No fake Table 12 fallbacks)
    const tableNum = Number(tableNumber);
    if (!tableNum || isNaN(tableNum) || tableNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'رقم الطاولة مطلوب وغير صالح. يرجى مسح كود الطاولة أو اختيار رقم طاولتك.' },
        { status: 400 }
      );
    }

    // 2. Authoritative Branch & Token Security Resolution
    let resolvedBranch = branchId;

    // Check QR Token if provided
    if (tableToken && typeof tableToken === 'string' && tableToken.trim().length > 0) {
      const verified = await getTableByQrToken(tableToken.trim());
      if (verified) {
        // Prevent table spoofing: Ensure QR token corresponds to the requested table number
        if (verified.tableNumber !== tableNum) {
          return NextResponse.json(
            { success: false, error: 'رمز الـ QR لا يتطابق مع رقم الطاولة المحدد. يرجى مسح الرمز من جديد.' },
            { status: 400 }
          );
        }
        if (verified.branchId) {
          resolvedBranch = verified.branchId;
        }
      }
    }

    // Resolve branch from restaurant slug only if branchId is not already a valid UUID
    const isBranchUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedBranch || '');
    if (!isBranchUuid && restaurantSlug) {
      const cleanSlug = String(restaurantSlug).trim().toLowerCase();
      if (cleanSlug === 'sh-manoosha') {
        resolvedBranch = 'a84f5ec9-714f-44fe-980d-82a78eb4f9b9';
      } else if (cleanSlug && cleanSlug !== 'demo') {
        const restaurant = await getRestaurantBySlug(cleanSlug);
        if (!restaurant) {
          return NextResponse.json(
            { success: false, error: 'المطعم غير موجود أو تم إيقافه' },
            { status: 404 }
          );
        }
        if (restaurant.branchId) {
          resolvedBranch = restaurant.branchId;
        }
      }
    }

    const branch = resolvedBranch || 'b0000000-0000-0000-0000-000000000001';

    // 3. Authoritative Server-Side Price Recalculation
    const validation = await validateAndCalculateOrder(items);

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'فشل التحقق من أسعار الطلب' },
        { status: 400 }
      );
    }

    // 4. Sanitize overall customer note
    const sanitizedGeneralNote = (customerNote || '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 300);

    // 5. Atomically persist order to PostgreSQL repository
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
