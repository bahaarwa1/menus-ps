import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { rateLimiter } from '@/lib/security/rate-limiter';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024; // 6MB

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = rateLimiter.check(`upload:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز الحد المسموح به لرفع الصور' },
        { status: 429 }
      );
    }

    // 1. Verify session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك برفع الصور' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم اختيار أي ملف' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: 'صيغة الصورة غير مدعومة. الصيغ المتاحة: JPEG, PNG, WEBP, AVIF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'حجم الصورة كبير جداً (الحد الأقصى 6 ميغابايت)' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const restaurantFolder = session.restaurantSlug || 'restaurant';
    const fileName = `${restaurantFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // 2. Try Supabase Storage
    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.storage
          .from('menu-items')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from('menu-items')
            .getPublicUrl(fileName);

          return NextResponse.json({
            success: true,
            url: publicData.publicUrl,
            fileName: file.name,
          });
        }
        console.warn('Supabase storage upload returned error:', error?.message);
      } catch (uploadErr) {
        console.warn('Supabase storage upload exception:', uploadErr);
      }
    }

    // 3. Fallback: Data URL if file is reasonable size (< 2MB)
    if (file.size <= 2 * 1024 * 1024) {
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        fileName: file.name,
      });
    }

    return NextResponse.json(
      { success: false, error: 'فشل حفظ الصورة على خادم التخزين' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Upload API route error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة رفع الصورة' },
      { status: 500 }
    );
  }
}
