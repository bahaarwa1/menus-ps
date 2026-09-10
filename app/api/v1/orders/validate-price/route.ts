import { NextRequest, NextResponse } from 'next/server';
import { validateAndCalculateOrder } from '@/lib/pricing/price-validator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    const validationResult = await validateAndCalculateOrder(items);

    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      subtotal: validationResult.subtotal,
      totalAmount: validationResult.totalAmount,
      currency: validationResult.currency,
      items: validationResult.items,
    });
  } catch (error) {
    console.error('Price validation API error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء احتساب أسعار الطلب' },
      { status: 500 }
    );
  }
}
