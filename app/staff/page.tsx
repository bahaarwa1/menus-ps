'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, CheckCircle2, Clock,
  Search, Printer, Check, X, Bell, BellOff,
  Sun, Moon, LogOut, Flame, ChefHat, RefreshCw, ChevronRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { printThermalReceipt } from '@/lib/print-utils';

// Audio chime using Web Audio API
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

function mapDbOrder(raw: any) {
  return {
    id: raw.id,
    orderNumber: raw.order_number || raw.orderNumber || `#${raw.id?.slice(0, 6)}`,
    table: raw.table_number ?? raw.tableNumber ?? 0,
    items: (raw.order_items || raw.items || []).map((it: any) => ({
      name: it.item_name || it.itemName || it.name || 'صنف',
      quantity: Number(it.quantity) || 1,
      price: Number(it.unit_price || it.unitPrice || it.price) || 0,
      extras: it.selected_extras || it.extras || [],
      customization: it.notes || it.customization || ''
    })),
    total: Number(raw.total_amount || raw.totalAmount) || 0,
    status: raw.status || 'جديد',
    time: raw.created_at
      ? new Date(raw.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    customerName: `طاولة ${raw.table_number ?? raw.tableNumber ?? 0}`,
    notes: raw.customer_note || raw.customerNote || '',
    branchId: raw.branch_id || raw.branchId,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export default function StaffOrdersManagementPage() {
  const router = useRouter();
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [branchId, setBranchId] = useState<string>('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const selectedOrder = ordersList.find(o => o.id === selectedOrderId) || ordersList[0];

  // Fetch session + load initial orders
  const loadOrders = useCallback(async (bid?: string) => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/v1/orders/list${bid ? `?branchId=${encodeURIComponent(bid)}` : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const mapped = data.orders.map(mapDbOrder);
        setOrdersList(mapped);
        if (mapped.length > 0 && !selectedOrderId) {
          setSelectedOrderId(mapped[0].id);
        }
      }
    } catch (e) {
      console.error('loadOrders error:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [selectedOrderId]);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        const bid = data.user?.branchId || '';
        setBranchId(bid);
        loadOrders(bid);
      })
      .catch(() => loadOrders());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase Realtime subscription for live order updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const raw = payload.new as any;
          if (branchId && raw.branch_id !== branchId) return;
          // Fetch full order with items
          fetch(`/api/v1/orders/list?orderId=${raw.id}`)
            .then(r => r.json())
            .then(data => {
              if (data.success && data.orders?.length > 0) {
                const newOrder = mapDbOrder(data.orders[0]);
                setOrdersList(prev => {
                  const exists = prev.some(o => o.id === newOrder.id);
                  if (exists) return prev;
                  return [newOrder, ...prev];
                });
                setSelectedOrderId(newOrder.id);
                if (soundEnabled) playOrderChime();
              }
            })
            .catch(() => {
              // Fallback: map directly from payload
              const newOrder = mapDbOrder(raw);
              setOrdersList(prev => {
                const exists = prev.some(o => o.id === newOrder.id);
                if (exists) return prev;
                return [newOrder, ...prev];
              });
              if (soundEnabled) playOrderChime();
            });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const raw = payload.new as any;
          setOrdersList(prev => prev.map(o =>
            o.id === raw.id ? { ...o, status: raw.status } : o
          ));
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [branchId, soundEnabled]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Optimistic update
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (newStatus === 'جاهز' && soundEnabled) playOrderChime();
    // Persist to DB
    try {
      await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error('updateOrderStatus error:', e);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login?role=staff');
  };

  const handlePrintReceipt = (order: any) => {
    if (!order) return;
    printThermalReceipt({
      id: order.orderNumber || order.id,
      table: order.table,
      time: order.time,
      total: order.total,
      items: order.items || [],
      notes: order.notes,
      restaurantName: 'MENUS.PS'
    });
  };

  // Filter orders
  const filteredOrders = ordersList.filter(o => {
    const matchesFilter = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      (o.orderNumber || o.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      `طاولة ${o.table}`.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });


  // Vibrant, high-contrast, saturated status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'جديد':
        return (
          <span className="bg-rose-500 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>بانتظار التأكيد</span>
          </span>
        );
      case 'قيد التحضير':
        return (
          <span className="bg-amber-500 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-spin" />
            <span>قيد التحضير</span>
          </span>
        );
      case 'جاهز':
        return (
          <span className="bg-emerald-600 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-emerald-600/30">
            <Check size={11} strokeWidth={3} />
            <span>جاهز للتسليم</span>
          </span>
        );
      case 'تم التسليم':
        return (
          <span className="bg-slate-800 text-white font-black text-[11px] px-2.5 py-0.5 rounded-full">
            مكتمل
          </span>
        );
      default:
        return null;
    }
  };

  const newOrdersCount = ordersList.filter(o => o.status === 'جديد').length;
  const preparingCount = ordersList.filter(o => o.status === 'قيد التحضير').length;
  const readyCount = ordersList.filter(o => o.status === 'جاهز').length;

  const renderInspectorContent = (order: any, isMobileModal: boolean = false) => {
    if (!order) {
      return (
        <div className={`rounded-2xl border p-8 text-center text-xs ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200/80 text-slate-500'
        }`}>
          اختر طلباً من القائمة لعرض تفاصيله
        </div>
      );
    }

    return (
      <div className={`space-y-3.5 ${
        isMobileModal 
          ? '' 
          : `rounded-2xl border shadow-xs p-4 max-h-[calc(100vh-160px)] overflow-y-auto ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800'
            }`
      }`}>
        {/* Order Details Header */}
        <div className={`pb-3 flex items-center justify-between border-b ${
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-lg tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>{order.id}</span>
              {getStatusBadge(order.status)}
            </div>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              طلب طاولة <span className="text-orange-600 font-bold">{order.table}</span> — الساعة {order.time}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePrintReceipt(order)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
              title="طباعة بون المطبخ (صفحة واحدة فورية)"
            >
              <Printer size={15} />
              <span>طباعة البون</span>
            </button>

            {isMobileModal && (
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="إغلاق"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className={`space-y-2 ${isMobileModal ? 'max-h-64' : 'max-h-60'} overflow-y-auto pr-0.5`}>
          <p className={`text-xs font-bold ${
            isDarkMode ? 'text-slate-200' : 'text-slate-700'
          }`}>
            محتويات الطلب ({order.items.length} أصناف)
          </p>
          {order.items.map((item: any, iIdx: number) => {
            const img = item.imageUrl || item.image || null;
            return (
              <div 
                key={iIdx} 
                className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800/80 border-slate-700 text-slate-100' 
                    : 'bg-slate-50/70 border-slate-200/70 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {item.quantity}×
                  </span>
                  {img && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200/70">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`font-semibold text-xs sm:text-sm truncate ${
                      isDarkMode ? 'text-white' : 'text-slate-800'
                    }`}>{item.name}</p>
                    {item.customization && (
                      <span className="text-[11px] text-orange-600 font-medium block">• {item.customization}</span>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <span className={`text-[11px] font-normal block ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>• + {item.extras.join('، ')}</span>
                    )}
                  </div>
                </div>
                <span className={`font-bold text-xs sm:text-sm shrink-0 ${
                  isDarkMode ? 'text-white' : 'text-slate-800'
                }`}>{item.price * item.quantity} ₪</span>
              </div>
            );
          })}
        </div>

        {/* Customer Notes */}
        {order.notes && (
          <div className={`rounded-xl p-3 text-xs shadow-2xs border ${
            isDarkMode 
              ? 'bg-amber-950/40 border-amber-800 text-amber-200' 
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <span className={`block mb-1 font-bold ${
              isDarkMode ? 'text-amber-300' : 'text-amber-800'
            }`}>⚠️ ملاحظات الزبون الخاصة:</span>
            <p className={`leading-relaxed ${
              isDarkMode ? 'text-amber-100' : 'text-slate-700'
            }`}>{order.notes}</p>
          </div>
        )}

        {/* Bill Breakdown */}
        <div className={`p-3 rounded-xl space-y-1.5 text-xs border ${
          isDarkMode 
            ? 'bg-slate-800/60 border-slate-700' 
            : 'bg-slate-50 border-slate-200/70'
        }`}>
          <div className={`flex justify-between ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>المجموع الفرعي:</span>
            <span className={`font-semibold ${
              isDarkMode ? 'text-slate-200' : 'text-slate-700'
            }`}>{order.total} ₪</span>
          </div>
          <div className={`flex justify-between ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>الضريبة والخدمة:</span>
            <span className={`font-semibold ${
              isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
            }`}>مشمولة بالكامل (0 ₪)</span>
          </div>
          <div className={`flex justify-between text-sm font-bold pt-2 border-t ${
            isDarkMode ? 'border-slate-700' : 'border-slate-200/80'
          }`}>
            <span className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>الإجمالي المطلوب:</span>
            <span className="text-orange-600 font-extrabold text-base">{order.total} ₪</span>
          </div>
        </div>

        {/* Primary Action Button Based on Order Status */}
        <div className="pt-1">
          {order.status === 'جديد' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'قيد التحضير')}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Flame size={17} />
              <span>قبول الطلب وبدء التحضير فوراً 🔥</span>
            </button>
          )}

          {order.status === 'قيد التحضير' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'جاهز')}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={17} />
              <span>الطلب جاهز للتسليم (طاولة {order.table}) ✅</span>
            </button>
          )}

          {order.status === 'جاهز' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'تم التسليم')}
              className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check size={17} />
              <span>تم التسليم بنجاح وإغلاق الطلب 🚀</span>
            </button>
          )}

          {order.status === 'تم التسليم' && (
            <div className={`text-center py-2.5 border rounded-xl text-xs sm:text-sm font-black ${
              isDarkMode 
                ? 'bg-slate-800 text-emerald-400 border-slate-700' 
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}>
              ✓ تم تسليم هذا الطلب للزبون بنجاح
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col selection:bg-orange-500 selection:text-white transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F4F6F9] text-slate-900'
    }`} dir="rtl">
      
      {/* 1. Header Bar */}
      <header className={`sticky top-0 z-30 border-b shadow-xs transition-colors backdrop-blur-md ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200/80'
      }`}>
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          
          {/* Logo & Title */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                <ChefHat size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-base sm:text-lg font-bold leading-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>إدارة الطلبات الحية</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isRealtimeConnected 
                      ? 'bg-emerald-500 text-white shadow-xs' 
                      : 'bg-amber-500 text-white'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{isRealtimeConnected ? 'سحابي مباشر' : 'إعادة اتصال...'}</span>
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>Burger House نابلس · متابعة وتحديث طلبات الصالة</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border text-xs font-medium ${
                  soundEnabled ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>

          {/* Action Toolbar (Without QR code, purely staff order management) */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => loadOrders(branchId)}
              disabled={isLoadingOrders}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-2xs ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
              }`}
              title="تحديث قائمة الطلبات"
            >
              <RefreshCw size={14} className={isLoadingOrders ? 'animate-spin text-orange-500' : 'text-slate-500'} />
              <span>تحديث الطلبات</span>
            </button>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`hidden md:flex p-2 rounded-xl border text-xs font-medium transition-all shadow-2xs ${
                soundEnabled
                  ? 'bg-orange-500 text-white border-orange-500'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200/80'
              }`}
              title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت التنبيه'}
            >
              {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`hidden md:flex p-2 rounded-xl border text-xs font-medium transition-all shadow-2xs ${
                isDarkMode
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
              title="تبديل المظهر النهاري/الليلي"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className={`hidden lg:flex p-2 rounded-xl border text-xs font-medium shadow-2xs ${
                isDarkMode 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
              title="ملء الشاشة"
            >
              ⛶
            </button>

            <button
              onClick={handleLogout}
              className={`p-2 rounded-xl border transition-colors shadow-2xs ${
                isDarkMode 
                  ? 'border-slate-700 text-slate-300 hover:text-rose-400 hover:bg-rose-950/40' 
                  : 'border-slate-200/80 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="تسجيل خروج"
            >
              <LogOut size={15} />
            </button>
          </div>

        </div>

        {/* 2. Filter Tabs & Search Bar */}
        <div className={`max-w-[1600px] mx-auto px-3 sm:px-5 py-2 border-t flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'
        }`}>
          {/* Status Filter Tabs with Balanced Counters */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 font-medium ${
                statusFilter === 'all'
                  ? isDarkMode ? 'bg-white text-slate-950 shadow-xs font-bold' : 'bg-slate-900 text-white shadow-xs font-bold'
                  : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              الكل ({ordersList.length})
            </button>

            <button
              onClick={() => setStatusFilter('جديد')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 font-medium ${
                statusFilter === 'جديد'
                  ? 'bg-rose-500 text-white shadow-xs font-bold'
                  : isDarkMode ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/60' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>بانتظار التأكيد ({newOrdersCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('قيد التحضير')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 font-medium ${
                statusFilter === 'قيد التحضير'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : isDarkMode ? 'bg-amber-950/60 text-amber-300 hover:bg-amber-900/60' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>قيد التحضير ({preparingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('جاهز')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 font-medium ${
                statusFilter === 'جاهز'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : isDarkMode ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>جاهز للتسليم ({readyCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('تم التسليم')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 font-medium ${
                statusFilter === 'تم التسليم'
                  ? isDarkMode ? 'bg-white text-slate-950 shadow-xs font-bold' : 'bg-slate-900 text-white shadow-xs font-bold'
                  : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              مكتمل ({ordersList.filter(o => o.status === 'تم التسليم').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search size={14} className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="بحث برقم الطلب أو الطاولة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-9 pl-3.5 py-1.5 border rounded-full text-xs transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-orange-500'
              }`}
            />
          </div>
        </div>
      </header>

      {/* 3. Main Split Master-Detail Interface */}
      <main className="max-w-[1600px] mx-auto p-3 sm:p-5 w-full flex-1 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
          
          {/* Orders Cards Container: 3 COLUMNS PER ROW ("3 طاولات جمب بعض") */}
          <div className="w-full lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[calc(100vh-170px)] overflow-y-auto pr-0.5 content-start">
            {filteredOrders.length === 0 ? (
              <div className={`col-span-full rounded-2xl border p-12 text-center ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200/80 text-slate-500'
              }`}>
                <ClipboardList size={36} className="mx-auto mb-2 text-orange-500 opacity-40" />
                <p className={`text-sm font-bold ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>لا توجد طلبات مطابقة</p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-400'
                }`}>جرّب تغيير حالة الفلتر أو محاكاة طلب QR جديد</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsMobileDetailOpen(true);
                    }}
                    className={`rounded-2xl p-2.5 sm:p-3 border transition-all cursor-pointer relative shadow-xs hover:shadow-md flex flex-col justify-between ${
                      isSelected
                        ? isDarkMode
                          ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-950/20'
                          : 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/20'
                        : isDarkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200/80 hover:border-orange-300'
                    }`}
                  >
                    {/* Top Row: Order ID + Table badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`font-bold text-xs sm:text-sm tracking-tight truncate ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>{order.id}</span>
                        <span className="bg-slate-900 text-amber-300 font-semibold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                          طاولة {order.table}
                        </span>
                      </div>
                      <span className={`text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        <Clock size={11} />
                        {order.time}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-2">
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Items preview (compact) */}
                    <p className={`text-xs line-clamp-2 mb-2 leading-relaxed ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {order.items.map((i: any) => `${i.quantity}× ${i.name}`).join('، ')}
                    </p>

                    {/* Bottom Row: Total & Action Preview */}
                    <div className={`flex items-center justify-between pt-2 border-t ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-orange-600 text-base">{order.total}</span>
                        <span className="text-xs text-orange-600 font-medium">₪</span>
                      </div>
                      <div className={`flex items-center gap-0.5 text-xs ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        <span className="text-[11px] text-orange-600 font-semibold">معاينة</span>
                        <ChevronRight size={13} className="rtl:rotate-180 text-orange-600" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Sticky Inspector Pane (4 Cols on Desktop) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-20">
            {renderInspectorContent(selectedOrder, false)}
          </div>

        </div>
      </main>

      {/* 4. Mobile Slide-Up Bottom Sheet Drawer */}
      <AnimatePresence>
        {isMobileDetailOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDetailOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className={`relative w-full max-h-[88vh] rounded-t-3xl shadow-2xl z-10 overflow-hidden flex flex-col border-t ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
              }`}
            >
              {/* Drawer Pull Handle */}
              <div 
                className="pt-3 pb-1 flex justify-center cursor-pointer"
                onClick={() => setIsMobileDetailOpen(false)}
              >
                <div className={`w-12 h-1.5 rounded-full ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
                }`} />
              </div>
              
              <div className="p-4 overflow-y-auto">
                {renderInspectorContent(selectedOrder, true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
