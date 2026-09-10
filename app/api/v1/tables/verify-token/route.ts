import { NextRequest, NextResponse } from 'next/server';
import { verifyTableToken } from '@/lib/tables/table-tokens';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || request.nextUrl.searchParams.get('t');

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'رمز الـ QR مطلوب في الرابط' },
      { status: 400 }
    );
  }

  const result = await verifyTableToken(token);

  if (!result.valid || !result.table) {
    return NextResponse.json(
      { success: false, error: result.error || 'رمز الـ QR غير صالح أو ملغي' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    table: result.table,
  });
}
