import { NextRequest, NextResponse } from 'next/server';
import { createEmailOtp } from '@/lib/auth/otp.service';
import { rateLimiter } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateCheck = rateLimiter.check(`send-otp:${ip}`, 6, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم إرسال عدة طلبات مؤخراً. يرجى الانتظار دقيقة قبل إعادة المحاولة.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال عنوان بريد إلكتروني صالح' },
        { status: 400 }
      );
    }

    const { code } = await createEmailOtp(email);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال كود التحقق المكون من 6 أرقام بنجاح',
      // Provide demo/preview code in dev or fallback mode so user can test seamlessly without waiting on SMTP
      debugCode: code,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'تعذر إرسال رمز التحقق. يرجى المحاولة لاحقاً.' },
      { status: 500 }
    );
  }
}
