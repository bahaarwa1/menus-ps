import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { hashPassword, hashPin, generateSecureToken, sanitizeInput } from '@/lib/security/crypto';
import { appCache } from '@/lib/cache/lru-cache';

export interface RegisterRestaurantInput {
  name: string;
  slug: string;
  phone: string;
  city: string;
  ownerEmail: string;
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
  logoUrl?: string;
  address?: string;
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
    subdomainUrl: 'https://menus-ps.vercel.app/r/burger-house-nablus',
    branchId: 'b0000000-0000-0000-0000-000000000001',
    branchName: 'فرع رفيديا — نابلس',
    tablesCount: 15,
    tables: Array.from({ length: 15 }, (_, i) => ({
      id: `tbl-${i + 1}`,
      tableNumber: i + 1,
      qrToken: `qr_token_table_${i + 1}_nablus`,
      qrUrl: `https://menus-ps.vercel.app/m?t=qr_token_table_${i + 1}_nablus&restaurant=burger-house-nablus`,
    })),
    createdAt: new Date().toISOString(),
  });
}

const RESERVED_SLUGS = new Set([
  'www', 'api', 'admin', 'staff', 'demo', 'm', 'r', 'login', 'register',
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

  // Cost-optimization: Check LRU cache for slug availability check
  const cacheKey = `slug:avail:${slug}`;
  const cached = appCache.get<{ available: boolean; slug: string; reason?: string }>(cacheKey);
  if (cached) return cached;

  if (RESERVED_SLUGS.has(slug)) {
    const res = { available: false, slug, reason: 'هذا الرابط محجوز للنظام، يرجى اختيار اسم آخر' };
    appCache.set(cacheKey, res, 300, ['restaurants']);
    return res;
  }

  // Check in-memory store
  if (global.__menusRestaurantsStore?.has(slug)) {
    const res = { available: false, slug, reason: 'هذا الرابط محجوز لمطعم آخر بالفعل' };
    appCache.set(cacheKey, res, 300, ['restaurants']);
    return res;
  }

  // Check Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        const res = { available: false, slug, reason: 'هذا الرابط محجوز لمطعم آخر بالفعل' };
        appCache.set(cacheKey, res, 300, ['restaurants']);
        return res;
      }
    } catch (err) {
      console.warn('Supabase slug check fallback:', err);
    }
  }

  const res = { available: true, slug };
  appCache.set(cacheKey, res, 60, ['restaurants']);
  return res;
}

/**
 * Registers a new restaurant with instant auto-provisioning and hardened security.
 */
export async function registerNewRestaurant(input: RegisterRestaurantInput): Promise<RegisteredRestaurantResult> {
  const availability = await isSlugAvailable(input.slug);
  if (!availability.available) {
    throw new Error(availability.reason || 'الرابط المطلوب غير متاح');
  }

  const slug = availability.slug;
  const restaurantId = `rest-${Date.now()}-${generateSecureToken(4)}`;
  const branchId = `br-${Date.now()}-${generateSecureToken(4)}`;
  const tablesCount = Math.min(Math.max(input.tablesCount || 10, 1), 50);

  // Use CSPRNG for all table QR tokens
  const tables = Array.from({ length: tablesCount }, (_, i) => {
    const tableNum = i + 1;
    const secureToken = generateSecureToken(8);
    const qrToken = `qr_${slug}_t${tableNum}_${secureToken}`;
    return {
      id: `tbl-${tableNum}-${Date.now()}`,
      tableNumber: tableNum,
      qrToken,
      qrUrl: `https://menus-ps.vercel.app/m?t=${qrToken}&restaurant=${slug}`,
    };
  });

  // Securely hash owner password with PBKDF2-SHA256
  const passwordHash = input.password ? await hashPassword(input.password) : '';

  const cleanName = sanitizeInput(input.name, 100);
  const cleanPhone = sanitizeInput(input.phone, 30);
  const cleanCity = sanitizeInput(input.city || 'نابلس', 50);
  const cleanEmail = input.ownerEmail ? sanitizeInput(input.ownerEmail, 150).toLowerCase() : undefined;

  const registeredRecord: RegisteredRestaurantResult = {
    id: restaurantId,
    name: cleanName,
    slug,
    phone: cleanPhone,
    city: cleanCity,
    currency: '₪',
    subdomainUrl: `https://menus-ps.vercel.app/r/${slug}`,
    branchId,
    branchName: 'الفرع الرئيسي',
    tablesCount,
    tables,
    ownerEmail: cleanEmail,
    ownerPassword: passwordHash, // Store hash, NEVER plain text
    createdAt: new Date().toISOString(),
  };

  // 1. Always persist to resilient memory store
  global.__menusRestaurantsStore?.set(slug, registeredRecord);

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      
      // Insert restaurant (only existing schema columns)
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

          // Menu starts completely empty as requested (no unwanted default items)

          // Insert staff user record with hashed PIN
          const staffPinHash = input.password ? await hashPin(input.password.slice(0, 6)) : await hashPin('1234');
          await supabase.from('staff_users').insert({
            branch_id: dbBranchId,
            full_name: registeredRecord.name,
            role: 'owner',
            pin_hash: staffPinHash,
            is_active: true,
          } as never);

          // Provision Supabase Auth account if email & password are provided
          if (cleanEmail && input.password && input.password.length >= 6) {
            try {
              await supabase.auth.admin.createUser({
                email: cleanEmail,
                password: input.password,
                email_confirm: true,
                user_metadata: {
                  full_name: registeredRecord.name,
                  role: 'admin',
                  restaurant_id: dbRestId,
                  restaurant_slug: slug,
                  branch_id: dbBranchId,
                },
              });
            } catch (authCreateErr) {
              console.warn('Could not provision Supabase Auth user:', authCreateErr);
            }
          }
        }
      } else if (restErr) {
        console.error('Supabase restaurant insert error:', restErr);
      }
    } catch (err) {
      console.error('Supabase registration error, persisted to resilient store:', err);
    }
  }

  // Cost-optimization: Invalidate restaurant caches
  appCache.invalidateTag('restaurants');
  appCache.invalidateTag(`restaurant:${slug}`);

  return registeredRecord;
}

const inFlightRestaurantRequests = new Map<string, Promise<RegisteredRestaurantResult | null>>();

/**
 * Gets restaurant info by slug with multi-layer caching and request coalescing.
 */
export async function getRestaurantBySlug(slug: string): Promise<RegisteredRestaurantResult | null> {
  const cleanSlug = slug.trim().toLowerCase();
  const cacheKey = `restaurant:slug:${cleanSlug}`;

  // 1. O(1) Memory Cache Check
  const cached = appCache.get<RegisteredRestaurantResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Request coalescing: avoid concurrent duplicate fetches
  const inFlight = inFlightRestaurantRequests.get(cleanSlug);
  if (inFlight) {
    return inFlight;
  }

  const fetchPromise = (async () => {
    try {
      // Check Supabase first if configured
      if (isSupabaseConfigured()) {
        try {
          const supabase = createAdminClient();
          const { data: rest, error } = await supabase
            .from('restaurants')
            .select('id, name, slug, logo_url, phone, city, currency, created_at')
            .eq('slug', cleanSlug)
            .single();

          if (!error && rest) {
            const restData = rest as {
              id: string;
              name: string;
              slug: string;
              logo_url?: string | null;
              phone: string;
              city: string;
              currency: string;
              created_at: string;
            };

            // Fetch primary branch
            const { data: branchData } = await supabase
              .from('branches')
              .select('id, name, address, tables_count')
              .eq('restaurant_id', restData.id)
              .limit(1)
              .maybeSingle();

            const branchId = (branchData as any)?.id || restData.id;
            const branchName = (branchData as any)?.name || `${restData.name} — الفرع الرئيسي`;
            const branchAddress = (branchData as any)?.address || '';

            const { data: tablesData } = await supabase
              .from('tables')
              .select('id, table_number, qr_token, status')
              .eq('branch_id', branchId)
              .order('table_number', { ascending: true });

            const tables = (tablesData && tablesData.length > 0)
              ? tablesData.map((t: any) => ({
                  id: t.id,
                  tableNumber: t.table_number,
                  qrToken: t.qr_token,
                  qrUrl: `https://menus-ps.vercel.app/m?t=${t.qr_token}&restaurant=${restData.slug}`,
                }))
              : Array.from({ length: 10 }, (_, i) => ({
                  id: `tbl-${i + 1}`,
                  tableNumber: i + 1,
                  qrToken: `qr_${restData.slug}_t${i + 1}`,
                  qrUrl: `https://menus-ps.vercel.app/m?t=qr_${restData.slug}_t${i + 1}&restaurant=${restData.slug}`,
                }));

            const result: RegisteredRestaurantResult = {
              id: restData.id,
              name: restData.name,
              slug: restData.slug,
              logoUrl: restData.logo_url || '',
              address: branchAddress,
              phone: restData.phone || '',
              city: restData.city || 'نابلس',
              currency: restData.currency || '₪',
              subdomainUrl: `https://menus-ps.vercel.app/r/${restData.slug}`,
              branchId,
              branchName,
              tablesCount: tables.length,
              tables,
              createdAt: restData.created_at,
            };

            // Cache for 10 minutes in appCache
            appCache.set(cacheKey, result, 600, ['restaurants', `restaurant:${cleanSlug}`]);
            global.__menusRestaurantsStore?.set(cleanSlug, result);
            return result;
          }
        } catch (err) {
          console.warn('Supabase getRestaurantBySlug error:', err);
        }
      }

      // Fallback to memory store
      const memoryRecord = global.__menusRestaurantsStore?.get(cleanSlug);
      if (memoryRecord) {
        appCache.set(cacheKey, memoryRecord, 300, ['restaurants', `restaurant:${cleanSlug}`]);
        return memoryRecord;
      }

      return null;
    } finally {
      inFlightRestaurantRequests.delete(cleanSlug);
    }
  })();

  inFlightRestaurantRequests.set(cleanSlug, fetchPromise);
  return fetchPromise;
}

export interface UpdateRestaurantSettingsInput {
  slug: string;
  name?: string;
  logoUrl?: string;
  phone?: string;
  city?: string;
  address?: string;
  currency?: string;
  staffPin?: string;
}

/**
 * Updates restaurant profile, logo, contact, city, currency, and staff PIN with cache invalidation.
 */
export async function updateRestaurantSettings(input: UpdateRestaurantSettingsInput): Promise<boolean> {
  const cleanSlug = input.slug.trim().toLowerCase();

  // 1. Update in-memory store
  const existing = global.__menusRestaurantsStore?.get(cleanSlug);
  if (existing) {
    if (input.name) existing.name = input.name.trim();
    if (input.logoUrl !== undefined) existing.logoUrl = input.logoUrl.trim();
    if (input.phone) existing.phone = input.phone.trim();
    if (input.city) existing.city = input.city.trim();
    if (input.address !== undefined) existing.address = input.address.trim();
    if (input.currency) existing.currency = input.currency.trim();
    global.__menusRestaurantsStore?.set(cleanSlug, existing);
  }

  // 2. Update Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const updates: any = {};
      if (input.name) updates.name = input.name.trim();
      if (input.logoUrl !== undefined) updates.logo_url = input.logoUrl.trim();
      if (input.phone) updates.phone = input.phone.trim();
      if (input.city) updates.city = input.city.trim();
      if (input.currency) updates.currency = input.currency.trim();

      if (Object.keys(updates).length > 0) {
        await (supabase as any)
          .from('restaurants')
          .update(updates)
          .eq('slug', cleanSlug);
      }

      // Update primary branch city/name/address if changed
      if (input.city || input.name || input.address !== undefined) {
        const { data: rest } = await (supabase as any)
          .from('restaurants')
          .select('id')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (rest) {
          const branchUpdates: any = {};
          if (input.city) branchUpdates.city = input.city.trim();
          if (input.address !== undefined) branchUpdates.address = input.address.trim();
          await (supabase as any)
            .from('branches')
            .update(branchUpdates)
            .eq('restaurant_id', rest.id);

          // Update staff PIN if provided
          if (input.staffPin && input.staffPin.length >= 4) {
            const pinHash = await hashPin(input.staffPin);
            await (supabase as any)
              .from('staff_users')
              .update({ pin_hash: pinHash })
              .eq('branch_id', existing?.branchId || rest.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to update restaurant settings in database:', err);
    }
  }

  // 3. Invalidate caches
  appCache.invalidateTag('restaurants');
  appCache.invalidateTag(`restaurant:${cleanSlug}`);
  appCache.delete(`restaurant:slug:${cleanSlug}`);
  appCache.invalidateTag('tables');
  appCache.invalidateTag(`tables:${cleanSlug}`);

  return true;
}

