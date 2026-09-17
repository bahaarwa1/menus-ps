import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    const isMasterOwner = session?.email === 'almhtrf.information22@gmail.com' || session?.email === 'admin@menus.ps';
    const isSuperAdmin = session?.role === 'admin' && (isMasterOwner || session?.restaurantSlug === 'platform-master' || session?.restaurantSlug === 'burger-house-nablus');

    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const { isActive } = await request.json();
    const restaurantId = params.id;

    if (!restaurantId) {
      return NextResponse.json({ success: false, error: 'معرف المطعم مطلوب' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Toggle branches active state for this restaurant
    const { error: branchErr } = await (supabase as any)
      .from('branches')
      .update({ is_active: Boolean(isActive) })
      .eq('restaurant_id', restaurantId);

    if (branchErr) {
      return NextResponse.json({ success: false, error: branchErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: isActive ? 'تم تفعيل المطعم بنجاح' : 'تم إيقاف المطعم مؤقتاً',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
