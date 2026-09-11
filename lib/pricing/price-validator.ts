import { menuItems as demoMenuItems } from '@/data/demo-data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { appCache } from '@/lib/cache/lru-cache';

export interface ClientOrderItemInput {
  itemId: string;
  quantity: number;
  note?: string;
  selectedExtras?: string[]; // Extra IDs or names
}

export interface ValidatedOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  extrasTotal: number;
  lineTotal: number;
  selectedExtras: Array<{ id?: string; name: string; price: number }>;
  note: string;
}

export interface PriceValidationResult {
  isValid: boolean;
  error?: string;
  items: ValidatedOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

/**
 * Server-side Price Validation & Recalculation Engine.
 *
 * CRITICAL SECURITY INVARIANT:
 * NEVER trust prices sent by the client. The client provides only { itemId, quantity, selectedExtras }.
 * The server queries the authoritative database/catalog, validates item availability,
 * and recomputes the unit price, extras, and grand total.
 */
export async function validateAndCalculateOrder(
  rawItems: ClientOrderItemInput[]
): Promise<PriceValidationResult> {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    return {
      isValid: false,
      error: 'قائمة الطلبات فارغة',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      currency: '₪',
    };
  }

  // 1. Fetch authoritative catalog with item-level memory caching
  type AuthoritativeItem = {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
    extras?: Array<{ id: string; name: string; price: number }>;
  };

  const authoritativeItems: AuthoritativeItem[] = [];
  const missingItemIds: string[] = [];

  // Cost-optimization: Check LRU cache first to avoid repetitive Supabase hits on popular dishes
  for (const item of rawItems) {
    const cachedItem = appCache.get<AuthoritativeItem>(`item_price:${item.itemId}`);
    if (cachedItem) {
      if (!authoritativeItems.some((ai) => ai.id === cachedItem.id)) {
        authoritativeItems.push(cachedItem);
      }
    } else {
      if (!missingItemIds.includes(item.itemId)) {
        missingItemIds.push(item.itemId);
      }
    }
  }

  if (missingItemIds.length > 0 && isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          id,
          name_ar,
          price,
          is_available,
          item_extras (
            id,
            name_ar,
            price
          )
        `)
        .in('id', missingItemIds);

      if (!error && data && data.length > 0) {
        const fetchedItems: AuthoritativeItem[] = (data as any[]).map((d) => ({
          id: d.id,
          name: d.name_ar,
          price: Number(d.price),
          isAvailable: d.is_available,
          extras: (d.item_extras || []).map((e: any) => ({
            id: e.id,
            name: e.name_ar,
            price: Number(e.price),
          })),
        }));

        for (const fItem of fetchedItems) {
          appCache.set(`item_price:${fItem.id}`, fItem, 300, ['menu', 'pricing']);
          authoritativeItems.push(fItem);
        }
      }
    } catch (err) {
      console.warn('Database price lookup warning, using demo catalog:', err);
    }
  }

  // Fallback to demoMenuItems if DB returned empty or unconfigured
  if (authoritativeItems.length < rawItems.length) {
    for (const m of demoMenuItems) {
      if (!authoritativeItems.some((ai) => ai.id === m.id)) {
        authoritativeItems.push({
          id: m.id,
          name: m.name,
          price: m.price,
          isAvailable: true,
          extras: m.extras?.map((e) => ({
            id: e.id,
            name: e.name,
            price: e.price,
          })),
        });
      }
    }
  }

  // 2. Validate each item and calculate prices on server
  const validatedItems: ValidatedOrderItem[] = [];
  let subtotal = 0;

  for (const clientItem of rawItems) {
    // Quantity validation: must be integer between 1 and 50
    const qty = Math.floor(Number(clientItem.quantity));
    if (isNaN(qty) || qty < 1 || qty > 50) {
      return {
        isValid: false,
        error: `الكمية غير صالحة للصنف (${clientItem.itemId}). يجب أن تكون بين 1 و 50`,
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        currency: '₪',
      };
    }

    // Lookup authoritative item
    const catalogItem = authoritativeItems.find((i) => i.id === clientItem.itemId);
    if (!catalogItem) {
      return {
        isValid: false,
        error: `الصنف المطلوب غير موجود في قائمة المطعم: ${clientItem.itemId}`,
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        currency: '₪',
      };
    }

    // Check availability
    if (!catalogItem.isAvailable) {
      return {
        isValid: false,
        error: `عذراً، الصنف "${catalogItem.name}" غير متوفر حالياً في المطبخ`,
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        currency: '₪',
      };
    }

    // Validate and calculate extras
    const validSelectedExtras: Array<{ id?: string; name: string; price: number }> = [];
    let extrasTotalPerUnit = 0;

    if (clientItem.selectedExtras && Array.isArray(clientItem.selectedExtras)) {
      for (const extraIdOrName of clientItem.selectedExtras) {
        const foundExtra = catalogItem.extras?.find(
          (e) => e.id === extraIdOrName || e.name === extraIdOrName
        );
        if (foundExtra) {
          validSelectedExtras.push(foundExtra);
          extrasTotalPerUnit += foundExtra.price;
        }
      }
    }

    // Sanitize customer note (max 250 characters, strip potential HTML)
    const sanitizedNote = (clientItem.note || '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 250);

    const unitPrice = catalogItem.price;
    const lineTotal = (unitPrice + extrasTotalPerUnit) * qty;
    subtotal += lineTotal;

    validatedItems.push({
      itemId: catalogItem.id,
      itemName: catalogItem.name,
      quantity: qty,
      unitPrice,
      extrasTotal: extrasTotalPerUnit,
      lineTotal,
      selectedExtras: validSelectedExtras,
      note: sanitizedNote,
    });
  }

  // Tax is inclusive in Palestinian restaurant pricing
  const taxAmount = 0;
  const totalAmount = subtotal;

  return {
    isValid: true,
    items: validatedItems,
    subtotal,
    taxAmount,
    totalAmount,
    currency: '₪',
  };
}
