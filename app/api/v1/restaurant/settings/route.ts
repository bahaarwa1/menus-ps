import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getRestaurantBySlug, updateRestaurantSettings } from '@/lib/db/repositories/restaurant.repository';
import { rateLimiter } from '@/lib/security/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    const urlSlug = request.nextUrl.searchParams.get('slug');
    const targetSlug = urlSlug || session?.restaurantSlug || 'burger-house-nablus';

    const restaurant = await getRestaurantBySlug(targetSlug);
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'المطعم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logoUrl: restaurant.logoUrl || '',
        phone: restaurant.phone,
        city: restaurant.city,
        address: restaurant.address || '',
        currency: restaurant.currency,
        subdomainUrl: restaurant.subdomainUrl,
        branchId: restaurant.branchId,
        branchName: restaurant.branchName,
        tablesCount: restaurant.tablesCount,
      },
    });
  } catch (error) {
    console.error('Get restaurant settings error:', error);
    return NextResponse.json({ success: false, error: 'فشل استرجاع إعدادات المطعم' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = rateLimiter.check(`settings:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز معدل التعديل المسموح به، يرجى الانتظار دقيقة' },
        { status: 429 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    const body = await request.json();
    const { name, logoUrl, phone, city, address, currency, staffPin, slug } = body;

    const targetSlug = slug || session?.restaurantSlug || 'burger-house-nablus';

    if (!targetSlug) {
      return NextResponse.json(
        { success: false, error: 'معرف المطعم غير محدد' },
        { status: 400 }
      );
    }

    const success = await updateRestaurantSettings({
      slug: targetSlug,
      name,
      logoUrl,
      phone,
      city,
      address,
      currency,
      staffPin,
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'فشل حفظ الإعدادات في قاعدة البيانات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ إعدادات المطعم والشعار بنجاح وتحديث كافة الأنظمة المرتبطة!',
    });
  } catch (error) {
    console.error('Update restaurant settings error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل حفظ إعدادات المطعم' },
      { status: 500 }
    );
  }
}
