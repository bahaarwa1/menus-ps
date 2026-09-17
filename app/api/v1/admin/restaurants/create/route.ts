import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { registerNewRestaurant } from '@/lib/db/repositories/restaurant.repository';
import { serializeSubscriptionAddress, SubscriptionPlan } from '@/lib/subscription/subscription.service';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    // Security check: Only Super Admin can provision new restaurants from /admin
    const isMasterOwner = session?.email === 'almhtrf.information22@gmail.com' || session?.email === 'admin@menus.ps';
    const isSuperAdmin = session?.role === 'admin' && (isMasterOwner || session?.restaurantSlug === 'platform-master' || session?.restaurantSlug === 'burger-house-nablus');

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'غير مصرح للوصول لهذه العملية' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, phone, city, ownerEmail, password, tablesCount, plan, expiresAt } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال اسم المطعم (حرفين على الأقل)' }, { status: 400 });
    }

    if (!slug || slug.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'يرجى تحديد رابط فرعي بالإنجليزية (3 أحرف على الأقل)' }, { status: 400 });
    }

    if (!ownerEmail || !ownerEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'يرجى إدخال بريد إلكتروني صالح للمالك' }, { status: 400 });
    }

    // 1. Provision the restaurant via repository
    const registered = await registerNewRestaurant({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
      phone: phone ? phone.trim() : '+970 59 000 0000',
      city: city ? city.trim() : 'نابلس',
      ownerEmail: ownerEmail.trim().toLowerCase(),
      password: password && password.length >= 4 ? password : 'password123',
      tablesCount: tablesCount ? Math.max(1, Math.min(Number(tablesCount), 100)) : 10,
    });

    // 2. If custom subscription plan/expiry was chosen, update primary branch address metadata
    if (plan || expiresAt) {
      try {
        const supabase = createAdminClient();
        const targetPlan: SubscriptionPlan = plan || 'trial';
        const targetExpiry = expiresAt
          ? new Date(expiresAt + (expiresAt.includes('T') ? '' : 'T23:59:59Z')).toISOString()
          : new Date(Date.now() + (targetPlan === 'pro' ? 365 : targetPlan === 'basic' ? 30 : 14) * 86400000).toISOString();

        const addressWithSub = serializeSubscriptionAddress('', targetPlan, targetExpiry);

        await (supabase as any)
          .from('branches')
          .update({ address: addressWithSub })
          .eq('id', registered.branchId);

        // Update memory store if exists
        const memRecord = global.__menusRestaurantsStore?.get(registered.slug);
        if (memRecord) {
          memRecord.subscription = {
            plan: targetPlan,
            planNameAr: targetPlan === 'pro' ? 'احترافي VIP' : targetPlan === 'basic' ? 'أساسي' : 'تجريبي',
            expiresAt: targetExpiry,
            daysRemaining: Math.max(0, Math.ceil((new Date(targetExpiry).getTime() - Date.now()) / 86400000)),
            isExpired: false,
            status: targetPlan === 'trial' ? 'trial' : 'active',
          };
          global.__menusRestaurantsStore?.set(registered.slug, memRecord);
        }
      } catch (subErr) {
        console.warn('Custom subscription update error during creation:', subErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إنشاء المطعم ${registered.name} بنجاح`,
      restaurant: registered,
    });
  } catch (error: any) {
    console.error('Create restaurant error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'حدث خطأ أثناء إنشاء المطعم',
    }, { status: 500 });
  }
}
