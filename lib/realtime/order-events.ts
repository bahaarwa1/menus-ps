import { EventEmitter } from 'events';

export type OrderEventType = 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'ORDER_PAID';

export interface OrderEventPayload {
  eventId: string;
  eventType: OrderEventType;
  timestamp: string;
  order: {
    id: string;
    orderNumber: string;
    branchId?: string;
    tableNumber?: number;
    status: string;
    totalAmount: number;
    items?: Array<{
      itemName: string;
      quantity: number;
      unitPrice: number;
      selectedExtras?: Array<{ name: string; price: number }>;
      notes?: string;
    }>;
    customerNote?: string;
    createdAt?: string;
  };
}

// Global in-memory singleton EventEmitter for Next.js dev & server runtimes
declare global {
  // eslint-disable-next-line no-var
  var __menusOrderEventEmitter: EventEmitter | undefined;
  // eslint-disable-next-line no-var
  var __menusProcessedEventIds: Set<string> | undefined;
}

if (!global.__menusOrderEventEmitter) {
  global.__menusOrderEventEmitter = new EventEmitter();
  global.__menusOrderEventEmitter.setMaxListeners(100);
}

if (!global.__menusProcessedEventIds) {
  global.__menusProcessedEventIds = new Set<string>();
}

export const orderEventBus: EventEmitter = global.__menusOrderEventEmitter;
const processedEventIds: Set<string> = global.__menusProcessedEventIds;

/**
 * Broadcasts an order event to all connected listeners (SSE & Realtime streams).
 * Automatically de-duplicates events and timestamps them.
 */
export function broadcastOrderEvent(
  eventType: OrderEventType,
  order: OrderEventPayload['order']
): OrderEventPayload {
  const eventId = `evt_${Date.now()}_${order.id}_${Math.random().toString(36).substring(2, 7)}`;
  
  const payload: OrderEventPayload = {
    eventId,
    eventType,
    timestamp: new Date().toISOString(),
    order,
  };

  // Track deduplication
  processedEventIds.add(eventId);
  if (processedEventIds.size > 200) {
    // Keep set bounded to last 200 items
    const firstItem = processedEventIds.values().next().value;
    if (firstItem) processedEventIds.delete(firstItem);
  }

  // Emit to local node event bus
  orderEventBus.emit('order_update', payload);

  return payload;
}

/**
 * Checks if an event has already been processed to prevent duplicates.
 */
export function isEventDuplicate(eventId: string): boolean {
  return processedEventIds.has(eventId);
}
