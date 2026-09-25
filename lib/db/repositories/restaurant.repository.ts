import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { hashPassword, hashPin, generateSecureToken, sanitizeInput } from '@/lib/security/crypto';
import { appCache } from '@/lib/cache/lru-cache';
import { parseSubscriptionFromAddress, serializeSubscriptionAddress, SubscriptionInfo } from '@/lib/subscription/subscription.service';

export interface RegisterRestaurantInput {
  name: string;
  slug: string;
  phone: string;
  city: string;
  ownerEmail: string;
  password?: string;
  tablesCount?: number;
  whatsappNumber?: string;
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
  isActive?: boolean;
  subscription?: SubscriptionInfo;
  whatsappNumber?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  offersBannerUrl?: string;
  offersBannerTitle?: string;
  offersBannerSubtitle?: string;
  offersBannerActive?: boolean;
  requireGps?: boolean;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsRadiusMeters?: number;
  ownerEmail?: string;
  ownerPassword?: string;
  createdAt: string;
}

// In-memory global store for restaurants to support instant fallback & dev resilience
declare global {
  // eslint-disable-next-line no-var
  var __menusRestaurantsStore: Map<string, RegisteredRestaurantResult> | undefined;
}

const BASE_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://menus.cool';

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
    subdomainUrl: 'https://burger-house-nablus.menus.cool',
    branchId: 'b0000000-0000-0000-0000-000000000001',
    branchName: 'فرع رفيديا — نابلس',
    tablesCount: 15,
    tables: Array.from({ length: 15 }, (_, i) => ({
      id: `tbl-${i + 1}`,
      tableNumber: i + 1,
      qrToken: `qr_token_table_${i + 1}_nablus`,
      qrUrl: `${BASE_APP_URL}/m?t=qr_token_table_${i + 1}_nablus&restaurant=burger-house-nablus`,
    })),
    createdAt: new Date().toISOString(),
  });

  // Seed authentic sh-manoosha restaurant with exact database branch UUID
  global.__menusRestaurantsStore.set('sh-manoosha', {
    id: '0b2f5bd8-7cd2-4cc9-854f-d0a136698cfb',
    name: 'مطعم وكافيه شيشة ومنقوشة',
    slug: 'sh-manoosha',
    phone: '092343905',
    city: 'نابلس - رفيديا',
    currency: '₪',
    subdomainUrl: 'https://sh-manoosha.menus.cool',
    branchId: 'a84f5ec9-714f-44fe-980d-82a78eb4f9b9',
    branchName: 'الفرع الرئيسي - نابلس',
    tablesCount: 15,
    tables: Array.from({ length: 15 }, (_, i) => ({
      id: `tbl-manoosha-${i + 1}`,
      tableNumber: i + 1,
      qrToken: `qr_sh-manoosha_t${i + 1}`,
      qrUrl: `https://sh-manoosha.menus.cool/m?table=${i + 1}`,
    })),
    logoUrl: '/sh-manoosha/logo.png',
    address: 'نابلس - رفيديا - الشارع الرئيسي',
    isActive: true,
    ownerEmail: 'shisha.manoosha@menus.ps',
    subscription: {
      plan: 'pro',
      planNameAr: 'الباقة الاحترافية السنوية (VIP PRO)',
      expiresAt: '2027-01-01T00:00:00.000Z',
      daysRemaining: 281,
      isExpired: false,
      status: 'active',
    },
    whatsappNumber: '092343905',
    instagramUrl: 'shisha_manoosha',
    facebookUrl: 'https://facebook.com/shisha.manoosha',
    tiktokUrl: '',
    offersBannerUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80',
    offersBannerTitle: 'أشهى المناقيش والشيشة الفاخرة يومياً 🔥',
    offersBannerSubtitle: 'مناقيش طازجة على الحطب مع تشكيلة واسعة من المشروبات والمقبلات',
    offersBannerActive: true,
    requireGps: true,
    gpsLatitude: 32.2272,
    gpsLongitude: 35.2289,
    gpsRadiusMeters: 350,
    createdAt: new Date('2025-01-01').toISOString(),
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
      qrUrl: `${BASE_APP_URL}/m?t=${qrToken}&restaurant=${slug}`,
    };
  });

  // Securely hash owner password with PBKDF2-SHA256
  const passwordHash = input.password ? await hashPassword(input.password) : '';

  const cleanName = sanitizeInput(input.name, 100);
  const cleanPhone = sanitizeInput(input.phone, 30);
  const cleanWhatsapp = input.whatsappNumber ? sanitizeInput(input.whatsappNumber, 30) : undefined;
  const cleanCity = sanitizeInput(input.city || 'نابلس', 50);
  const cleanEmail = input.ownerEmail ? sanitizeInput(input.ownerEmail, 150).toLowerCase() : undefined;

  const registeredRecord: RegisteredRestaurantResult = {
    id: restaurantId,
    name: cleanName,
    slug,
    phone: cleanPhone,
    whatsappNumber: cleanWhatsapp,
    city: cleanCity,
    currency: '₪',
    subdomainUrl: `https://${slug}.menus.cool`,
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

        const initialBranchAddress = serializeSubscriptionAddress(
          '',
          'trial',
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          cleanWhatsapp ? { whatsappNumber: cleanWhatsapp } : undefined
        );

        // Insert primary branch
        const { data: branchData } = await supabase
          .from('branches')
          .insert({
            restaurant_id: dbRestId,
            name: 'الفرع الرئيسي',
            city: registeredRecord.city,
            address: initialBranchAddress,
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

          // Auto-create starter menu categories for the new restaurant
          try {
            await (supabase as any).from('menu_categories').insert([
              { restaurant_id: dbRestId, name_ar: 'الوجبات الرئيسية', icon: '🍽️', sort_order: 1 },
              { restaurant_id: dbRestId, name_ar: 'المقبلات والبطاطا', icon: '🍟', sort_order: 2 },
              { restaurant_id: dbRestId, name_ar: 'المشروبات', icon: '🥤', sort_order: 3 },
            ]);
          } catch (catErr) {
            console.warn('Failed to seed starter categories:', catErr);
          }

          // Insert staff user record with hashed PIN
          const staffPinHash = input.password ? await hashPin(input.password.slice(0, 6)) : await hashPin('1234');
          await supabase.from('staff_users').insert({
            branch_id: dbBranchId,
            full_name: registeredRecord.name,
            role: 'owner',
            pin_hash: staffPinHash,
            is_active: true,
          } as never);

          // Provision or update Supabase Auth account
          if (cleanEmail) {
            try {
              const { data: userListData } = await supabase.auth.admin.listUsers();
              const existingUser = userListData?.users?.find(
                u => u.email?.toLowerCase() === cleanEmail.toLowerCase()
              );

              if (existingUser) {
                // User already registered (e.g. via Google OAuth) -> Link restaurant to their user_metadata
                await supabase.auth.admin.updateUserById(existingUser.id, {
                  user_metadata: {
                    ...(existingUser.user_metadata || {}),
                    full_name: registeredRecord.name,
                    role: 'admin',
                    restaurant_id: dbRestId,
                    restaurant_slug: slug,
                    branch_id: dbBranchId,
                  },
                });
              } else if (input.password && input.password.length >= 6) {
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
              }
            } catch (authCreateErr) {
              console.warn('Could not provision or update Supabase Auth user:', authCreateErr);
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
              .select('id, name, address, tables_count, is_active')
              .eq('restaurant_id', restData.id)
              .limit(1)
              .maybeSingle();

            const branchId = (branchData as any)?.id || restData.id;
            const branchName = (branchData as any)?.name || `${restData.name} — الفرع الرئيسي`;
            const rawBranchAddress = (branchData as any)?.address || '';
            const { cleanAddress, subscription, extraMeta } = parseSubscriptionFromAddress(rawBranchAddress, restData.created_at);
            const isActive = (branchData as any)?.is_active !== false;

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
                  qrUrl: `${BASE_APP_URL}/m?t=${t.qr_token}&restaurant=${restData.slug}`,
                }))
              : Array.from({ length: 10 }, (_, i) => ({
                  id: `tbl-${i + 1}`,
                  tableNumber: i + 1,
                  qrToken: `qr_${restData.slug}_t${i + 1}`,
                  qrUrl: `${BASE_APP_URL}/m?t=qr_${restData.slug}_t${i + 1}&restaurant=${restData.slug}`,
                }));

            const memRecord = global.__menusRestaurantsStore?.get(cleanSlug);

            const result: RegisteredRestaurantResult = {
              id: restData.id,
              name: restData.name,
              slug: restData.slug,
              logoUrl: restData.logo_url || '',
              address: cleanAddress,
              phone: restData.phone || '',
              city: restData.city || 'نابلس',
              currency: restData.currency || '₪',
              subdomainUrl: `https://${restData.slug}.menus.cool`,
              branchId,
              branchName,
              tablesCount: tables.length,
              tables,
              isActive,
              subscription,
              whatsappNumber: extraMeta?.whatsappNumber || memRecord?.whatsappNumber || '',
              instagramUrl: extraMeta?.instagramUrl || memRecord?.instagramUrl || '',
              facebookUrl: extraMeta?.facebookUrl || memRecord?.facebookUrl || '',
              tiktokUrl: extraMeta?.tiktokUrl || memRecord?.tiktokUrl || '',
              offersBannerUrl: extraMeta?.offersBannerUrl || memRecord?.offersBannerUrl || '',
              offersBannerTitle: extraMeta?.offersBannerTitle || memRecord?.offersBannerTitle || '',
              offersBannerSubtitle: extraMeta?.offersBannerSubtitle || memRecord?.offersBannerSubtitle || '',
              offersBannerActive: extraMeta?.offersBannerActive !== undefined ? extraMeta.offersBannerActive : (memRecord?.offersBannerActive !== false),
              requireGps: extraMeta?.requireGps !== undefined ? extraMeta.requireGps : (memRecord?.requireGps !== false),
              gpsLatitude: extraMeta?.gpsLatitude ?? memRecord?.gpsLatitude ?? 32.2272,
              gpsLongitude: extraMeta?.gpsLongitude ?? memRecord?.gpsLongitude ?? 35.2289,
              gpsRadiusMeters: extraMeta?.gpsRadiusMeters ?? memRecord?.gpsRadiusMeters ?? 350,
              createdAt: restData.created_at,
            };

            // Cache for 5 seconds in appCache for dynamic freshness
            appCache.set(cacheKey, result, 5, ['restaurants', `restaurant:${cleanSlug}`]);
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
  whatsappNumber?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  offersBannerUrl?: string;
  offersBannerTitle?: string;
  offersBannerSubtitle?: string;
  offersBannerActive?: boolean;
  requireGps?: boolean;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsRadiusMeters?: number;
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
    if (input.whatsappNumber !== undefined) existing.whatsappNumber = input.whatsappNumber.trim();
    if (input.instagramUrl !== undefined) existing.instagramUrl = input.instagramUrl.trim();
    if (input.facebookUrl !== undefined) existing.facebookUrl = input.facebookUrl.trim();
    if (input.tiktokUrl !== undefined) existing.tiktokUrl = input.tiktokUrl.trim();
    if (input.offersBannerUrl !== undefined) existing.offersBannerUrl = input.offersBannerUrl.trim();
    if (input.offersBannerTitle !== undefined) existing.offersBannerTitle = input.offersBannerTitle.trim();
    if (input.offersBannerSubtitle !== undefined) existing.offersBannerSubtitle = input.offersBannerSubtitle.trim();
    if (input.offersBannerActive !== undefined) existing.offersBannerActive = input.offersBannerActive;
    if (input.requireGps !== undefined) existing.requireGps = input.requireGps;
    if (input.gpsLatitude !== undefined) existing.gpsLatitude = input.gpsLatitude;
    if (input.gpsLongitude !== undefined) existing.gpsLongitude = input.gpsLongitude;
    if (input.gpsRadiusMeters !== undefined) existing.gpsRadiusMeters = input.gpsRadiusMeters;
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

      // Update primary branch city/name/address/social/GPS/banners if changed
      if (
        input.city ||
        input.name ||
        input.address !== undefined ||
        input.whatsappNumber !== undefined ||
        input.instagramUrl !== undefined ||
        input.facebookUrl !== undefined ||
        input.tiktokUrl !== undefined ||
        input.requireGps !== undefined ||
        input.gpsLatitude !== undefined ||
        input.gpsLongitude !== undefined ||
        input.gpsRadiusMeters !== undefined ||
        input.offersBannerUrl !== undefined ||
        input.offersBannerTitle !== undefined ||
        input.offersBannerSubtitle !== undefined ||
        input.offersBannerActive !== undefined
      ) {
        const { data: rest } = await (supabase as any)
          .from('restaurants')
          .select('id, created_at')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (rest) {
          const { data: curBranch } = await (supabase as any)
            .from('branches')
            .select('id, address')
            .eq('restaurant_id', rest.id)
            .limit(1)
            .maybeSingle();

          const branchUpdates: any = {};
          if (input.city) branchUpdates.city = input.city.trim();

          const rawAddr = curBranch?.address || '';
          const parsed = parseSubscriptionFromAddress(rawAddr, rest.created_at);
          const nextMeta = {
            whatsappNumber: input.whatsappNumber !== undefined ? input.whatsappNumber.trim() : (parsed.extraMeta?.whatsappNumber || existing?.whatsappNumber),
            instagramUrl: input.instagramUrl !== undefined ? input.instagramUrl.trim() : (parsed.extraMeta?.instagramUrl || existing?.instagramUrl),
            facebookUrl: input.facebookUrl !== undefined ? input.facebookUrl.trim() : (parsed.extraMeta?.facebookUrl || existing?.facebookUrl),
            tiktokUrl: input.tiktokUrl !== undefined ? input.tiktokUrl.trim() : (parsed.extraMeta?.tiktokUrl || existing?.tiktokUrl),
            requireGps: input.requireGps !== undefined ? Boolean(input.requireGps) : (parsed.extraMeta?.requireGps ?? existing?.requireGps),
            gpsLatitude: input.gpsLatitude !== undefined ? Number(input.gpsLatitude) : (parsed.extraMeta?.gpsLatitude ?? existing?.gpsLatitude),
            gpsLongitude: input.gpsLongitude !== undefined ? Number(input.gpsLongitude) : (parsed.extraMeta?.gpsLongitude ?? existing?.gpsLongitude),
            gpsRadiusMeters: input.gpsRadiusMeters !== undefined ? Number(input.gpsRadiusMeters) : (parsed.extraMeta?.gpsRadiusMeters ?? existing?.gpsRadiusMeters),
            offersBannerUrl: input.offersBannerUrl !== undefined ? input.offersBannerUrl.trim() : (parsed.extraMeta?.offersBannerUrl || existing?.offersBannerUrl),
            offersBannerTitle: input.offersBannerTitle !== undefined ? input.offersBannerTitle.trim() : (parsed.extraMeta?.offersBannerTitle || existing?.offersBannerTitle),
            offersBannerSubtitle: input.offersBannerSubtitle !== undefined ? input.offersBannerSubtitle.trim() : (parsed.extraMeta?.offersBannerSubtitle || existing?.offersBannerSubtitle),
            offersBannerActive: input.offersBannerActive !== undefined ? Boolean(input.offersBannerActive) : (parsed.extraMeta?.offersBannerActive ?? existing?.offersBannerActive),
          };
          const nextAddress = input.address !== undefined ? input.address.trim() : parsed.cleanAddress;
          branchUpdates.address = serializeSubscriptionAddress(
            nextAddress,
            parsed.subscription.plan,
            parsed.subscription.expiresAt,
            nextMeta
          );

          const { error: bErr } = await (supabase as any)
            .from('branches')
            .update(branchUpdates)
            .eq('restaurant_id', rest.id);

          if (bErr) {
            console.error('Failed to update branches in Supabase:', bErr);
          }

          // Update staff PIN if provided
          if (input.staffPin && input.staffPin.length >= 4) {
            const pinHash = await hashPin(input.staffPin);
            await (supabase as any)
              .from('staff_users')
              .update({ pin_hash: pinHash })
              .eq('branch_id', existing?.branchId || curBranch?.id || rest.id);
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

