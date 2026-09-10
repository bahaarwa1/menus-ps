import { NextRequest } from 'next/server';
import { orderEventBus, OrderEventPayload } from '@/lib/realtime/order-events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const branchFilter = request.nextUrl.searchParams.get('branchId');
  const orderFilter = request.nextUrl.searchParams.get('orderId');

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Send initial connection confirmation event
  const initMsg = `event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`;
  await writer.write(encoder.encode(initMsg));

  const listener = (payload: OrderEventPayload) => {
    if (branchFilter && payload.order.branchId && payload.order.branchId !== branchFilter) {
      return;
    }
    if (orderFilter && payload.order.id !== orderFilter) {
      return;
    }
    const data = `event: order\ndata: ${JSON.stringify(payload)}\n\n`;
    writer.write(encoder.encode(data)).catch(() => {
      // Stream write closed
      orderEventBus.off('order_update', listener);
    });
  };

  orderEventBus.on('order_update', listener);

  // Keep-alive heartbeat every 15s
  const heartbeatInterval = setInterval(() => {
    writer.write(encoder.encode(': ping\n\n')).catch(() => {
      clearInterval(heartbeatInterval);
      orderEventBus.off('order_update', listener);
    });
  }, 15000);

  // Clean up on client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval);
    orderEventBus.off('order_update', listener);
    writer.close().catch(() => {});
  });

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
