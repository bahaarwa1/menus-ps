'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, CheckCircle2, AlertCircle, ChefHat, 
  Search, Volume2, VolumeX, Check, RefreshCw, ShoppingBag
} from 'lucide-react';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  extras?: string[];
}

interface Order {
  id: string;
  rawId: string;
  tableNumber: number;
  status: 'new' | 'cooking' | 'ready' | 'completed';
  items: OrderItem[];
  total: number;
  createdAt: string;
  notes?: string;
}

export default function ProductionOrdersPage() {
  const [filter, setFilter] = useState<'all' | 'new' | 'cooking' | 'ready' | 'completed'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branchId, setBranchId] = useState('');

  const mapDbOrderToCard = (raw: any): Order => {
    const rawStatus = raw.status || 'جديد';
    let cardStatus: Order['status'] = 'new';
    if (rawStatus === 'قيد التحضير' || rawStatus === 'cooking') cardStatus = 'cooking';
    else if (rawStatus === 'جاهز' || rawStatus === 'ready') cardStatus = 'ready';
    else if (rawStatus === 'تم التسليم' || rawStatus === 'completed') cardStatus = 'completed';

    const items: OrderItem[] = (raw.order_items || raw.items || []).map((it: any) => ({
      name: it.item_name || it.itemName || it.name || 'صنف',
      qty: Number(it.quantity || it.qty) || 1,
      price: Number(it.unit_price || it.price) || 0,
      extras: it.selected_extras || it.extras || [],
    }));

    return {
      id: raw.order_number || `#${raw.id?.slice(0, 6)}`,
      rawId: raw.id,
      tableNumber: Number(raw.table_number ?? raw.tableNumber ?? raw.table_id) || 0,
      status: cardStatus,
      total: Number(raw.total_amount || raw.totalAmount) || 0,
      createdAt: raw.created_at
        ? new Date(raw.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        : 'الآن',
      notes: raw.customer_note || raw.customerNote || '',
      items,
    };
  };

  const loadOrders = useCallback(async (bid?: string) => {
    setIsLoading(true);
    try {
      const url = `/api/v1/orders/list${bid ? `?branchId=${encodeURIComponent(bid)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders.map(mapDbOrderToCard));
      }
    } catch (err) {
      console.error('Error fetching dashboard orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load orders immediately on mount
    loadOrders();

    // Concurrently cache branchId if available
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        const bid = data.user?.branchId || '';
        if (bid) setBranchId(bid);
      })
      .catch(() => {});
  }, [loadOrders]);

  const advanceOrderStatus = async (rawId: string, currentStatus: Order['status']) => {
    const nextStatusMap: Record<Order['status'], { next: Order['status']; arabic: string }> = {
      new: { next: 'cooking', arabic: 'قيد التحضير' },
      cooking: { next: 'ready', arabic: 'جاهز' },
      ready: { next: 'completed', arabic: 'تم التسليم' },
      completed: { next: 'completed', arabic: 'تم التسليم' },
    };

    const target = nextStatusMap[currentStatus];
    if (!target) return;

    // Optimistic local update
    setOrders((prev) =>
      prev.map((o) => (o.rawId === rawId ? { ...o, status: target.next } : o))
    );

    try {
      await fetch(`/api/v1/orders/${rawId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target.arabic }),
      });
    } catch (err) {
      console.error('Failed to update order status in database:', err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (searchQuery) {
      const matchId = o.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTable = `طاولة ${o.tableNumber}`.includes(searchQuery) || `${o.tableNumber}` === searchQuery;
      return matchId || matchTable;
    }
    return true;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-200 text-xs font-black">جديد 🔥</span>;
      case 'cooking':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-200 text-xs font-bold">قيد التحضير 🍳</span>;
      case 'ready':
        return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-200 text-xs font-bold">جاهز للتقديم 🛎️</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200 text-xs font-bold">تم التسليم والدفع ✅</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة الطلبات الحية</h1>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <p className="text-xs text-slate-500 mt-1">متابعة وحفظ تحديثات طلبات الزبائن مباشرة في قاعدة البيانات</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadOrders(branchId)}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            title="تحديث الطلبات من قاعدة البيانات"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-orange-500' : 'text-slate-500'} />
            <span>تحديث</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-orange-50 border-orange-200 text-orange-600'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'صوت التنبيه: مفعّل' : 'التنبيه صامت'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {[
            { id: 'all', label: 'كل الطلبات', count: orders.length },
            { id: 'new', label: 'جديدة', count: orders.filter((o) => o.status === 'new').length },
            { id: 'cooking', label: 'في المطبخ', count: orders.filter((o) => o.status === 'cooking').length },
            { id: 'ready', label: 'جاهزة للتقديم', count: orders.filter((o) => o.status === 'ready').length },
            { id: 'completed', label: 'مكتملة', count: orders.filter((o) => o.status === 'completed').length },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <input
            type="text"
            placeholder="بحث برقم الطلب أو الطاولة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
          />
          <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Orders Grid or Empty State */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium bg-white rounded-3xl border border-slate-200/80">
          جاري تحميل الطلبات الحية من قاعدة البيانات...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag size={28} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">
            {orders.length === 0 ? 'لا توجد طلبات مسجلة بعد' : 'لا توجد طلبات تطابق هذا التصنيف'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {orders.length === 0
              ? 'عندما يمسح الزبون باركود الطاولة ويرسل طلبه، سيظهر الطلب هنا في الوقت الفعلي مع خيارات تحويله للمطبخ وتسليمه.'
              : 'جرّب اختيار تصنيف آخر مثل "كل الطلبات" أو تغيير كلمة البحث.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.rawId}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                order.status === 'new' ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-slate-200/80'
              }`}
            >
              {/* Order Card Header */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900">{order.id}</span>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-0.5">
                      <Clock size={12} />
                      {order.createdAt}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Table Info Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="px-3 py-1 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center gap-1.5">
                    <span>طاولة رقم {order.tableNumber}</span>
                  </div>
                  <span className="font-mono font-black text-sm text-orange-600">{order.total} ₪</span>
                </div>

                {/* Items List */}
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{item.qty}x {item.name}</span>
                        <span className="font-mono text-slate-500">{item.price * item.qty} ₪</span>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          إضافات: {item.extras.join('، ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Customer Notes */}
                {order.notes && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs mb-3 flex items-start gap-1.5">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                    <p className="font-medium">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                {order.status === 'new' && (
                  <button
                    onClick={() => advanceOrderStatus(order.rawId, 'new')}
                    className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <ChefHat size={14} />
                    <span>تحويل للمطبخ (تحضير)</span>
                  </button>
                )}

                {order.status === 'cooking' && (
                  <button
                    onClick={() => advanceOrderStatus(order.rawId, 'cooking')}
                    className="flex-1 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>جاهز للتقديم للطاولة</span>
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    onClick={() => advanceOrderStatus(order.rawId, 'ready')}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>تم التسليم وتحصيل الفاتورة</span>
                  </button>
                )}

                {order.status === 'completed' && (
                  <div className="w-full text-center py-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 rounded-xl">
                    ✓ تم إنهاء الطلب ومحاسبة الطاولة
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
