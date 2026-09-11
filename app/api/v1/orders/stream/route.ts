import { NextRequest } from 'next/server';
import { orderEventBus, OrderEventPayload } from '@/lib/realtime/order-events';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  let branchFilter = request.nextUrl.searchParams.get('branchId');
  const orderFilter = request.nextUrl.searchParams.get('orderId');

  const isStaffOrAdmin = session && ['owner', 'admin', 'branch_manager', 'staff', 'kitchen'].includes(session.role);
  const isDev = process.env.NODE_ENV !== 'production';

  // SECURITY CHECK:
  // If no specific orderId is requested, caller MUST be an authenticated staff/manager.
  // This prevents random internet users from snooping on all live restaurant orders.
  if (!orderFilter && !isStaffOrAdmin && !isDev) {
    return new Response(JSON.stringify({ error: 'غير مصرح لك بالاستماع للطلبات' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Branch isolation: if staff/manager, enforce their branch
  if (session?.branchId) {
    branchFilter = session.branchId;
  }

  const encoder = new TextEncoder();
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
