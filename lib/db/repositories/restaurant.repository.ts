import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface RegisterRestaurantInput {
  name: string;
  slug: string;
  phone: string;
  city: string;
  ownerEmail?: string;
  password?: string;
  tablesCount?: number;
}

export interface RegisteredRestaurantResult {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string;
  currency: string;
  subdomainUrl: string;
  branchId: string;
  branchName: string;
  tablesCount: number;
  tables: Array<{
    id: string;
    tableNumber: number;
    qrToken: string;
    qrUrl: string;
  }>;
  ownerEmail?: string;
  ownerPassword?: string;
  createdAt: string;
}

// In-memory global store for restaurants to support instant fallback & dev resilience
declare global {
  // eslint-disable-next-line no-var
  var __menusRestaurantsStore: Map<string, RegisteredRestaurantResult> | undefined;
}

if (!global.__menusRestaurantsStore) {
  global.__menusRestaurantsStore = new Map<string, RegisteredRestaurantResult>();
  
  // Seed default demo restaurant
  global.__menusRestaurantsStore.set('burger-house-nablus', {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Burger House نابلس',
    slug: 'burger-house-nablus',
    phone: '+970 59 900 0000',
    city: 'نابلس',
    currency: '₪',
    subdomainUrl: 'https://burger-house-nablus.menus-ps.vercel.app',
    branchId: 'b0000000-0000-0000-0000-000000000001',
    branchName: 'فرع رفيديا — نابلس',
    tablesCount: 15,
    tables: Array.from({ length: 15 }, (_, i) => ({
      id: `tbl-${i + 1}`,
      tableNumber: i + 1,
      qrToken: `qr_token_table_${i + 1}_nablus`,
      qrUrl: `https://menus-ps.vercel.app/m?t=qr_token_table_${i + 1}_nablus`,
    })),
    createdAt: new Date().toISOString(),
  });
}

const RESERVED_SLUGS = new Set([
  'www', 'api', 'admin', 'staff', 'demo', 'm', 'login', 'register',
  'signup', 'app', 'pricing', 'contact', 'how-it-works', 'features',
  'faq', 'terms', 'privacy', 'dashboard', 'settings', 'checkout', 'cart',
  'static', 'assets', 'public', 'auth', 'webhook', 'support'
]);

/**
 * Validates whether a slug is available and formatted correctly.
 */
export async function isSlugAvailable(rawSlug: string): Promise<{ available: boolean; slug: string; reason?: string }> {
  const slug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!slug || slug.length < 3) {
    return { available: false, slug, reason: 'يجب أن يتكون الرابط من 3 أحرف على الأقل باللغة الإنجليزية والأرقام' };
  }

  if (slug.length > 30) {
    return { available: false, slug, reason: 'الرابط طويل جداً (الحد الأقصى 30 حرف)' };
  }

  if (RESERVED_SLUGS.has(slug)) {
    return { available: false, slug, reason: 'هذا الرابط محجوز للنظام، يرجى اختيار اسم آخر' };
  }

  // Check in-memory store
  if (global.__menusRestaurantsStore?.has(slug)) {
    return { available: false, slug, reason: 'هذا الرابط محجوز لمطعم آخر بالفعل' };
  }

  // Check Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        return { available: false, slug, reason: 'هذا الرابط محجوز لمطعم آخر بالفعل' };
      }
    } catch (err) {
      console.warn('Supabase slug check fallback:', err);
    }
  }

  return { available: true, slug };
}

/**
 * Registers a new restaurant with instant auto-provisioning.
 */
export async function registerNewRestaurant(input: RegisterRestaurantInput): Promise<RegisteredRestaurantResult> {
  const availability = await isSlugAvailable(input.slug);
  if (!availability.available) {
    throw new Error(availability.reason || 'الرابط المطلوب غير متاح');
  }

  const slug = availability.slug;
  const restaurantId = `rest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const branchId = `br-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const tablesCount = Math.min(Math.max(input.tablesCount || 10, 1), 50);

  const tables = Array.from({ length: tablesCount }, (_, i) => {
    const tableNum = i + 1;
    const qrToken = `qr_${slug}_t${tableNum}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      id: `tbl-${tableNum}-${Date.now()}`,
      tableNumber: tableNum,
      qrToken,
      qrUrl: `https://menus-ps.vercel.app/m?t=${qrToken}`,
    };
  });

  const registeredRecord: RegisteredRestaurantResult = {
    id: restaurantId,
    name: input.name.trim(),
    slug,
    phone: input.phone.trim(),
    city: input.city.trim() || 'نابلس',
    currency: '₪',
    subdomainUrl: `https://${slug}.menus-ps.vercel.app`,
    branchId,
    branchName: 'الفرع الرئيسي',
    tablesCount,
    tables,
    ownerEmail: input.ownerEmail?.trim().toLowerCase(),
    ownerPassword: input.password || '',
    createdAt: new Date().toISOString(),
  };

  // 1. Always persist to resilient memory store
  global.__menusRestaurantsStore?.set(slug, registeredRecord);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      
      // Insert restaurant
      const { data: restData, error: restErr } = await supabase
        .from('restaurants')
        .insert({
          name: registeredRecord.name,
          slug: registeredRecord.slug,
          phone: registeredRecord.phone,
          city: registeredRecord.city,
          currency: '₪',
        } as never)
        .select('id')
        .single();

      if (!restErr && restData) {
        const dbRestId = (restData as { id: string }).id;
        registeredRecord.id = dbRestId;

        // Insert primary branch
        const { data: branchData } = await supabase
          .from('branches')
          .insert({
            restaurant_id: dbRestId,
            name: 'الفرع الرئيسي',
            city: registeredRecord.city,
            tables_count: tablesCount,
            is_active: true,
          } as never)
          .select('id')
          .single();

        if (branchData) {
          const dbBranchId = (branchData as { id: string }).id;
          registeredRecord.branchId = dbBranchId;

          // Insert tables with secure QR tokens
          const tablesToInsert = tables.map((t) => ({
            branch_id: dbBranchId,
            table_number: t.tableNumber,
            seats: 4,
            qr_token: t.qrToken,
            status: 'فارغة',
          }));

          await supabase.from('tables').insert(tablesToInsert as never);

          // Insert default sample categories for quick start
          const defaultCategories = [
            { name_ar: 'الوجبات الرئيسية', icon: '🍔', sort_order: 1 },
            { name_ar: 'المقبلات والبطاطا', icon: '🍟', sort_order: 2 },
            { name_ar: 'المشروبات الباردة', icon: '🥤', sort_order: 3 },
          ];

          await supabase.from('menu_categories').insert(
            defaultCategories.map((c) => ({
              restaurant_id: dbRestId,
              ...c,
            })) as never
          );
        }
      }
    } catch (err) {
      console.error('Supabase registration error, persisted to resilient store:', err);
    }
  }

  return registeredRecord;
}

/**
 * Gets restaurant info by slug.
 */
export async function getRestaurantBySlug(slug: string): Promise<RegisteredRestaurantResult | null> {
  const cleanSlug = slug.trim().toLowerCase();

  // Check memory store first
  const memoryRecord = global.__menusRestaurantsStore?.get(cleanSlug);
  if (memoryRecord) {
    return memoryRecord;
  }

  // Check Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: rest, error } = await supabase
        .from('restaurants')
        .select('id, name, slug, phone, city, currency, created_at')
        .eq('slug', cleanSlug)
        .single();

      if (error || !rest) return null;

      const restData = rest as {
        id: string;
        name: string;
        slug: string;
        phone: string;
        city: string;
        currency: string;
        created_at: string;
      };

      return {
        id: restData.id,
        name: restData.name,
        slug: restData.slug,
        phone: restData.phone || '',
        city: restData.city || 'نابلس',
        currency: restData.currency || '₪',
        subdomainUrl: `https://${restData.slug}.menus-ps.vercel.app`,
        branchId: 'b0000000-0000-0000-0000-000000000001',
        branchName: 'الفرع الرئيسي',
        tablesCount: 10,
        tables: Array.from({ length: 10 }, (_, i) => ({
          id: `tbl-${i + 1}`,
          tableNumber: i + 1,
          qrToken: `qr_${restData.slug}_t${i + 1}`,
          qrUrl: `https://menus-ps.vercel.app/m?t=qr_${restData.slug}_t${i + 1}`,
        })),
        createdAt: restData.created_at,
      };
    } catch {
      return null;
    }
  }

  return null;
}
