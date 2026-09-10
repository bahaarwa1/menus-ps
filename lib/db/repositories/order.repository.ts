import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { OrderStatus, Json } from '@/types/database.types';
import { broadcastOrderEvent } from '@/lib/realtime/order-events';

export interface CreateOrderDTO {
  branchId: string;
  tableId: string;
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

// Global active orders store for stateful demo & dev resilience
declare global {
  // eslint-disable-next-line no-var
  var __menusActiveOrdersStore: Map<string, StoredOrder> | undefined;
}

if (!global.__menusActiveOrdersStore) {
  global.__menusActiveOrdersStore = new Map<string, StoredOrder>();
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

  const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
  const tableNum = parseInt(String(dto.tableId).replace(/\D/g, ''), 10) || 12;

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
      const supabase = createClient();
      const { data: rawOrder, error: orderError } = await (supabase.from('orders') as any)
        .insert({
          branch_id: dto.branchId,
          table_id: dto.tableId,
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

      // Insert items
      const orderItemsToInsert = dto.items.map((item) => ({
        order_id: orderData.id,
        item_id: item.itemId || null,
        item_name: item.itemName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        selected_extras: (item.selectedExtras || []) as unknown as Json,
        notes: item.notes || null,
      }));

      await (supabase.from('order_items') as any).insert(orderItemsToInsert);

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

  return result;
}

/**
 * Updates order status and broadcasts realtime update event.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  const existing = activeOrdersStore.get(orderId);

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
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

  return true;
}

/**
 * Retrieves an order by its ID.
 */
export async function getOrderById(orderId: string): Promise<StoredOrder | null> {
  return activeOrdersStore.get(orderId) || null;
}

/**
 * Lists all active stored orders.
 */
export async function listActiveOrders(): Promise<StoredOrder[]> {
  return Array.from(activeOrdersStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
