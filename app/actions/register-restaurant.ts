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

    // 1. Provision restaurant, branch, and tables
    const restaurant = await registerNewRestaurant(input);

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
