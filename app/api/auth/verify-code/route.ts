import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailOtp } from '@/lib/auth/otp.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني ورمز التحقق مطلوبان' },
        { status: 400 }
      );
    }

    const verification = await verifyEmailOtp(email, code);

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error || 'رمز التحقق غير صحيح' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر التحقق من الرمز' },
      { status: 500 }
    );
  }
}
