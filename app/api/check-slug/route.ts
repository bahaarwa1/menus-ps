import { NextRequest, NextResponse } from 'next/server';
import { isSlugAvailable } from '@/lib/db/repositories/restaurant.repository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get('slug') || '';

  if (!rawSlug) {
    return NextResponse.json(
      { available: false, slug: '', reason: 'يرجى كتابة الرابط المطلوب' },
      { status: 400 }
    );
  }

  const result = await isSlugAvailable(rawSlug);
  return NextResponse.json(result);
}
