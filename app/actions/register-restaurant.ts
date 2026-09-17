'use server';

import { cookies } from 'next/headers';
import { registerNewRestaurant, RegisterRestaurantInput, RegisteredRestaurantResult } from '@/lib/db/repositories/restaurant.repository';
import { signSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth/session';

export interface RegisterActionState {
  success: boolean;
  restaurant?: RegisteredRestaurantResult;
  error?: string;
  redirectTo?: string;
}

export async function registerRestaurantAction(input: RegisterRestaurantInput): Promise<RegisterActionState> {
  try {
    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: 'يرجى إدخال اسم المطعم بشكل صحيح' };
    }

    if (!input.slug || input.slug.trim().length < 3) {
      return { success: false, error: 'يرجى اختيار رابط فرعي (Subdomain) لا يقل عن 3 أحرف' };
    }

    if (!input.phone || input.phone.trim().length < 7) {
      return { success: false, error: 'يرجى إدخال رقم هاتف أو جوال صالح للتواصل' };
    }

    if (!input.ownerEmail || !input.ownerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.ownerEmail.trim())) {
      return { success: false, error: 'يرجى إدخال بريد إلكتروني صالح للإدارة (مطلوب لتسجيل الدخول واستلام الفواتير)' };
    }

    // 1. Provision restaurant, branch, and tables
    const restaurant = await registerNewRestaurant(input);

    // 1.5. Automatically provision dedicated SSL subdomain on Vercel
    provisionSubdomainInVercel(restaurant.slug).catch(() => {});

    // 2. Create authenticated admin session for the owner
    const sessionToken = await signSession({
      userId: `owner-${restaurant.id}`,
      name: input.name.trim(),
      email: input.ownerEmail || `${restaurant.slug}@menus.ps`,
      role: 'admin',
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      branchId: restaurant.branchId,
    });

    // 3. Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set({
      ...getSessionCookieOptions(60 * 60 * 24 * 7),
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
    });

    return {
      success: true,
      restaurant,
      redirectTo: `/dashboard?created=${restaurant.slug}`,
    };
  } catch (err: unknown) {
    console.error('Restaurant registration error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء المطعم، يرجى المحاولة ثانية',
    };
  }
}

async function provisionSubdomainInVercel(slug: string) {
  const token = process.env.VERCEL_AUTH_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return;

  try {
    const domainName = `${slug}.menus.cool`;
    await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domainName }),
    });
  } catch (e) {
    console.warn('Vercel domain provisioning error:', e);
  }
}
