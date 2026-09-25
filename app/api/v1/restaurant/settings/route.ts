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
    const targetSlug = urlSlug || session?.restaurantSlug || 'sh-manoosha';

    const restaurant = await getRestaurantBySlug(targetSlug);
    if (!restaurant) {
      return NextResponse.json({ success: false, error: 'المطعم غير موجود' }, { status: 404 });
    }

    const ownerEmail = session?.email || restaurant.ownerEmail || (restaurant.slug === 'sh-manoosha' ? 'shisha.manoosha@menus.ps' : 'owner@menus.cool');
    const ownerName = session?.name || restaurant.name || 'مدير الحساب';
    const userRole = session?.role || 'owner';

    // Compute or enrich subscription details
    const rawSub = restaurant.subscription;
    const now = new Date();
    const expiresAt = rawSub?.expiresAt || new Date(now.getFullYear() + 1, 0, 1).toISOString();
    const expDate = new Date(expiresAt);
    const diffDays = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const subscription = {
      plan: rawSub?.plan || 'pro',
      planNameAr: rawSub?.planNameAr || 'الباقة الاحترافية السنوية (VIP PRO)',
      status: rawSub?.status || (diffDays > 0 ? 'active' : 'expired'),
      expiresAt,
      daysRemaining: rawSub?.daysRemaining !== undefined ? rawSub.daysRemaining : diffDays,
      isExpired: rawSub?.isExpired !== undefined ? rawSub.isExpired : diffDays <= 0,
      maxTables: 50,
      currentTables: restaurant.tablesCount || restaurant.tables?.length || 15,
      branchesAllowed: 3,
      features: [
        'منيو إلكتروني QR عالي السرعة بنقرة واحدة',
        'شاشة مطبخ واستلام طلبات حية مع تنبيهات صوتية',
        'لوحة تحكم كاملة بالمبيعات وتعديل الأصناف',
        'طباعة الفواتير الحرارية الفورية (80mm)',
        'تخصيص كامل لألوان وهوية وشعار المطعم',
        'نطاق فرعي مخصص (Subdomain) مشفر وآمن',
        'دعم فني واستشارات تشغيلية على مدار الساعة'
      ]
    };

    const account = {
      email: ownerEmail,
      name: ownerName,
      role: userRole,
      roleTitleAr: (userRole as string) === 'admin' ? 'المدير العام للنظام' : 'مالك المطعم - المدير المسؤول',
      memberSince: restaurant.createdAt || '2025-01-01',
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.name,
      phone: restaurant.phone,
      city: restaurant.city,
    };

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
        isActive: restaurant.isActive !== false,
        whatsappNumber: restaurant.whatsappNumber || '',
        instagramUrl: restaurant.instagramUrl || '',
        facebookUrl: restaurant.facebookUrl || '',
        tiktokUrl: restaurant.tiktokUrl || '',
        offersBannerUrl: restaurant.offersBannerUrl || '',
        offersBannerTitle: restaurant.offersBannerTitle || '',
        offersBannerSubtitle: restaurant.offersBannerSubtitle || '',
        offersBannerActive: restaurant.offersBannerActive !== false,
        subscription,
        account,
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
    const { 
      name, logoUrl, phone, city, address, currency, staffPin, slug,
      whatsappNumber, instagramUrl, facebookUrl, tiktokUrl,
      offersBannerUrl, offersBannerTitle, offersBannerSubtitle, offersBannerActive
    } = body;

    const targetSlug = slug || session?.restaurantSlug || 'sh-manoosha';

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
      whatsappNumber,
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      offersBannerUrl,
      offersBannerTitle,
      offersBannerSubtitle,
      offersBannerActive,
    });

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'فشل حفظ الإعدادات في قاعدة البيانات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ إعدادات وهوية المطعم وتحديث كافة الأنظمة المرتبطة بنجاح!',
    });
  } catch (error) {
    console.error('Update restaurant settings error:', error);
    return NextResponse.json(
      { success: false, error: 'فشل حفظ إعدادات المطعم' },
      { status: 500 }
    );
  }
}
