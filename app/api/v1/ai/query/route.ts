import { NextRequest, NextResponse } from 'next/server';
import { executeGuardedAIQuery } from '@/lib/ai/ai-guard';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'نص السؤال مطلوب' },
        { status: 400 }
      );
    }

    const result = await executeGuardedAIQuery(question, ip);

    return NextResponse.json({
      success: true,
      answer: result.answer,
      cached: result.cached,
      source: result.source,
      tokensUsed: result.tokensUsed,
    });
  } catch (error: any) {
    const message = error?.message || 'حدث خطأ أثناء معالجة استعلام الذكاء الاصطناعي';
    const status = message.includes('تجاوز الحد') ? 429 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
