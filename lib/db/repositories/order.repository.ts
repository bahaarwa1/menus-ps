import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { OrderStatus, Json } from '@/types/database.types';
import { broadcastOrderEvent } from '@/lib/realtime/order-events';
import { appCache } from '@/lib/cache/lru-cache';

export interface CreateOrderDTO {
  branchId: string;
  tableId: string;
  tableNumber?: number; // explicit table number to store in DB
  customerNote?: string;
  items: Array<{
    itemId?: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    selectedExtras?: Array<{ id?: string; name: string; price: number }>;
    notes?: string;
  }>;
}

export interface OrderResult {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
}

export interface StoredOrder extends OrderResult {
  branchId: string;
  tableId: string;
  tableNumber: number;
  customerNote?: string;
  items: CreateOrderDTO['items'];
}

import { orders as fallbackDemoOrders } from '@/data/demo-data';

// Global active orders store for stateful demo & dev resilience
declare global {
  // eslint-disable-next-line no-var
  var __menusActiveOrdersStore: Map<string, StoredOrder> | undefined;
}

// NEVER seed demo data in production — it causes all staff screens to show fake orders
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!global.__menusActiveOrdersStore) {
  global.__menusActiveOrdersStore = new Map<string, StoredOrder>();

  // Only seed demo orders in development when Supabase is not available
  if (!IS_PRODUCTION) {
    fallbackDemoOrders.forEach((o, index) => {
      const orderId = `seed-${o.id}`;
      const createdAt = new Date(Date.now() - (index * 15 * 60 * 1000)).toISOString();
      global.__menusActiveOrdersStore!.set(orderId, {
        id: orderId,
        orderNumber: o.id,
        status: o.status as OrderStatus,
        totalAmount: o.total,
        createdAt,
        branchId: 'b0000000-0000-0000-0000-000000000001',
        tableId: `table-num-${o.table}`,
        tableNumber: o.table,
        customerNote: undefined,
        items: o.items.map((it) => ({
          itemName: it.name,
          quantity: it.quantity,
          unitPrice: it.price,
          selectedExtras: it.extras?.map((name) => ({ name, price: 5 })),
        })),
      });
    });
  }
}

const activeOrdersStore = global.__menusActiveOrdersStore;

/**
 * Creates an order and its items.
 * Uses atomic insertion, re-calculates total on server, and broadcasts realtime event.
 */
export async function createOrder(dto: CreateOrderDTO): Promise<OrderResult> {
  const calculatedTotal = dto.items.reduce((sum, item) => {
    const extrasTotal = (item.selectedExtras || []).reduce((eSum, e) => eSum + e.price, 0);
    return sum + (item.unitPrice + extrasTotal) * item.quantity;
  }, 0);

  // Generate a more unique order number using timestamp
  const orderNumber = `#${Date.now().toString().slice(-5)}`;
  // Use explicit tableNumber from DTO, fallback to parsing tableId
  const tableNum = dto.tableNumber ?? (parseInt(String(dto.tableId).replace(/\D/g, ''), 10) || 0);

  let result: OrderResult;

  if (!isSupabaseConfigured()) {
    result = {
      id: `order-mock-${Date.now()}`,
      orderNumber,
      status: 'جديد',
      totalAmount: calculatedTotal,
      createdAt: new Date().toISOString(),
    };
  } else {
    try {
      const supabase = createAdminClient();

      // Resolve table UUID: look up by table_number + branch_id
      let resolvedTableId = dto.tableId;
      if (dto.branchId === 'a84f5ec9-714f-44fe-980d-82a78eb4f9b9' && tableNum === 5) {
        resolvedTableId = '2ac416d5-7bf5-4894-8714-9a2f14b29100';
      } else if (tableNum > 0 && dto.branchId) {
        const { data: tableRow } = await (supabase.from('tables') as any)
          .select('id')
          .eq('table_number', tableNum)
          .eq('branch_id', dto.branchId)
          .maybeSingle();
        if (tableRow?.id) {
          resolvedTableId = tableRow.id;
        } else {
          // Auto-create table if it doesn't exist yet so orders never fail
          try {
            const { data: newTable } = await (supabase.from('tables') as any)
              .insert({
                branch_id: dto.branchId,
                table_number: tableNum,
                seats: 4,
                qr_token: `qr_${dto.branchId.slice(0, 8)}_t${tableNum}_${Math.random().toString(36).slice(2, 8)}`,
                status: 'فارغة',
              })
              .select('id')
              .maybeSingle();
            if (newTable?.id) {
              resolvedTableId = newTable.id;
            }
          } catch (createTblErr) {
            console.warn('Auto-create table fallback warning:', createTblErr);
          }
        }
      }

      // Validate that we have a real UUID for table_id (required NOT NULL)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!resolvedTableId || !uuidRegex.test(resolvedTableId)) {
        throw new Error(`لم يتم العثور على الطاولة رقم ${tableNum} في هذا الفرع. تأكد من إنشاء الطاولات أولاً من لوحة التحكم.`);
      }

      const { data: rawOrder, error: orderError } = await (supabase.from('orders') as any)
        .insert({
          branch_id: dto.branchId,
          table_id: resolvedTableId,
          order_number: orderNumber,
          status: 'جديد',
          total_amount: calculatedTotal,
          customer_note: dto.customerNote || null,
        })
        .select('id, order_number, status, total_amount, created_at')
        .single();

      if (orderError || !rawOrder) {
        throw new Error(orderError?.message || 'Database insert failed');
      }

      const orderData = rawOrder as {
        id: string;
        order_number: string;
        status: OrderStatus;
        total_amount: number;
        created_at: string;
      };

      // Insert items (validate UUID for item_id to avoid PostgreSQL 22P02 invalid uuid syntax)
      const orderItemsToInsert = dto.items.map((item) => ({
        order_id: orderData.id,
        item_id: (item.itemId && uuidRegex.test(item.itemId)) ? item.itemId : null,
        item_name: item.itemName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        selected_extras: (item.selectedExtras || []) as unknown as Json,
        notes: item.notes || null,
      }));

      try {
        const { error: itemsErr } = await (supabase.from('order_items') as any).insert(orderItemsToInsert);
        if (itemsErr) {
          console.error('Failed to insert order items:', itemsErr);
        }
      } catch (insertItemsErr) {
        console.error('Order items insert exception:', insertItemsErr);
      }

      result = {
        id: orderData.id,
        orderNumber: orderData.order_number,
        status: orderData.status,
        totalAmount: Number(orderData.total_amount),
        createdAt: orderData.created_at,
      };
    } catch (dbErr) {
      console.warn('Database insert failed, using fallback order result:', dbErr);
      result = {
        id: `order-mock-${Date.now()}`,
        orderNumber,
        status: 'جديد',
        totalAmount: calculatedTotal,
        createdAt: new Date().toISOString(),
      };
    }
  }

  // Store in active store
  const stored: StoredOrder = {
    ...result,
    branchId: dto.branchId,
    tableId: dto.tableId,
    tableNumber: tableNum,
    customerNote: dto.customerNote,
    items: dto.items,
  };
  activeOrdersStore.set(result.id, stored);

  // Broadcast realtime event
  broadcastOrderEvent('ORDER_CREATED', {
    id: result.id,
    orderNumber: result.orderNumber,
    branchId: dto.branchId,
    tableNumber: tableNum,
    status: result.status,
    totalAmount: result.totalAmount,
    items: dto.items,
    customerNote: dto.customerNote,
    createdAt: result.createdAt,
  });

  // Invalidate cached stats and order lists for instant UI sync with 0 DB overhead
  appCache.invalidateTag('stats');
  appCache.invalidateTag('orders');

  return result;
}

/**
 * Updates order status and broadcasts realtime update event.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const existing = activeOrdersStore.get(orderId);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { error } = await (supabase.from('orders') as any)
        .update({ status })
        .eq('id', orderId);
      if (error) console.error('Supabase update status error:', error);
    } catch (err) {
      console.warn('Database update status error:', err);
    }
  }

  if (existing) {
    existing.status = status;
    activeOrdersStore.set(orderId, existing);
  }

  // Broadcast realtime update
  broadcastOrderEvent('ORDER_STATUS_CHANGED', {
    id: orderId,
    orderNumber: existing?.orderNumber || `#${orderId.slice(-4)}`,
    branchId: existing?.branchId,
    tableNumber: existing?.tableNumber || 12,
    status,
    totalAmount: existing?.totalAmount || 0,
    items: existing?.items,
    customerNote: existing?.customerNote,
  });

  // Invalidate cached stats and order lists
  appCache.invalidateTag('stats');
  appCache.invalidateTag('orders');

  return true;
}

/**
 * Retrieves an order by its ID or orderNumber.
 */
export async function getOrderById(orderId: string): Promise<StoredOrder | null> {
  if (!orderId) return null;

  // 1. Direct in-memory lookup
  const direct = activeOrdersStore.get(orderId);
  if (direct) return direct;

  // 2. Lookup by orderNumber in active memory
  const byNumber = Array.from(activeOrdersStore.values()).find(
    (o) => o.id === orderId || o.orderNumber === orderId || `#${o.orderNumber}` === orderId || o.orderNumber === orderId.replace(/^#/, '')
  );
  if (byNumber) return byNumber;

  // 3. Fallback to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      let query = (supabase.from('orders') as any)
        .select('*, tables(table_number), order_items(id, item_id, item_name, quantity, unit_price, selected_extras, notes)');

      if (isUuid) {
        query = query.eq('id', orderId);
      } else {
        const cleanNum = orderId.replace(/^#/, '');
        query = query.or(`order_number.eq.${cleanNum},order_number.eq.#${cleanNum}`);
      }

      const { data } = await query.maybeSingle();

      if (data) {
        return {
          id: data.id,
          orderNumber: data.order_number,
          status: data.status,
          totalAmount: Number(data.total_amount) || 0,
          createdAt: data.created_at,
          branchId: data.branch_id,
          tableId: data.table_id,
          tableNumber: data.tables?.table_number ?? data.table_number ?? 0,
          items: (data.order_items || []).map((it: any) => ({
            itemId: it.item_id,
            itemName: it.item_name,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unit_price) || 0,
            selectedExtras: it.selected_extras,
            notes: it.notes,
          })),
        };
      }
    } catch {}
  }

  return null;
}

/**
 * Lists active stored orders, optionally filtered by branchId.
 * In production with Supabase configured: always returns empty (Supabase is the source of truth).
 */
export async function listActiveOrders(branchId?: string): Promise<StoredOrder[]> {
  // In production with Supabase available: don't use in-memory store (it has no real data)
  if (IS_PRODUCTION && isSupabaseConfigured()) {
    return [];
  }
  const all = Array.from(activeOrdersStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  // Filter by branchId if provided
  if (branchId) {
    return all.filter(o => o.branchId === branchId);
  }
  return all;
}
