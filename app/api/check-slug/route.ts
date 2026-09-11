import { NextRequest, NextResponse } from 'next/server';
import { isSlugAvailable } from '@/lib/db/repositories/restaurant.repository';
import { rateLimiter } from '@/lib/security/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const rateLimit = rateLimiter.check(`check-slug:${ip}`, 40, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { available: false, slug: '', reason: 'تم تجاوز معدل الفحص المسموح به' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawSlug = (searchParams.get('slug') || '').slice(0, 50);

  if (!rawSlug) {
    return NextResponse.json(
      { available: false, slug: '', reason: 'يرجى كتابة الرابط المطلوب' },
      { status: 400 }
    );
  }

  const result = await isSlugAvailable(rawSlug);
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
