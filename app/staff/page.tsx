'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, CheckCircle2, Clock, PlusCircle, RotateCcw, 
  Search, Printer, ChevronRight, Check, X, Bell, BellOff,
  Sun, Moon, LogOut, Flame, ChefHat
} from 'lucide-react';
import { orders as initialOrders } from '@/data/demo-data';
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
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

// Food images map for visual preview
const mockImages: Record<string, string> = {
  'دبل سماش برغر': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
  'تشيز بيكون فرايز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
  'تشيز فرايز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
  'كوكا كولا مثلجة': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80',
  'كولا': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80',
  'كلاسيك برغر فاخر': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80',
  'وجبة أطفال': 'https://images.unsplash.com/photo-1625937759403-1c39050d276c?w=500&q=80',
  'بيتزا مارغريتا': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80',
  'عصير برتقال': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80',
  'عصير برتقال طازج': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80',
  'تشيكن كريسبي': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80',
  'بطاطا ودجز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
  'بطاطا مقلية': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
};

export default function StaffOrdersManagementPage() {
  const router = useRouter();
  const [ordersList, setOrdersList] = useState<any[]>(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrders[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);

  const selectedOrder = ordersList.find(o => o.id === selectedOrderId) || ordersList[0];

  // Realtime SSE listener for customer orders placed via QR
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/orders/stream');
      eventSource.addEventListener('connected', () => setIsRealtimeConnected(true));
      eventSource.addEventListener('order', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.eventType === 'ORDER_CREATED' && payload.order) {
            const inc = payload.order;
            const newOrder = {
              id: inc.orderNumber || `#${inc.id?.slice(0, 6)}`,
              table: inc.tableNumber || 1,
              items: (inc.items || []).map((it: any) => ({
                name: it.itemName || it.name,
                quantity: it.quantity || 1,
                price: it.price || 35,
                extras: it.extras || [],
                customization: it.customization || it.notes || ''
              })),
              total: inc.totalAmount || 75,
              status: 'جديد',
              time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
              customerName: `طاولة ${inc.tableNumber || 1}`,
              notes: inc.customerNote || ''
            };

            setOrdersList(prev => [newOrder, ...prev]);
            setSelectedOrderId(newOrder.id);
            if (soundEnabled) playOrderChime();
          }
        } catch {}
      });
      eventSource.onerror = () => setIsRealtimeConnected(false);
    } catch {
      setIsRealtimeConnected(false);
    }
    return () => eventSource?.close();
  }, [soundEnabled]);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (newStatus === 'جاهز' && soundEnabled) {
      playOrderChime();
    }
  };

  const addNewSimulatedOrder = () => {
    const newId = `ORD-0${Math.floor(Math.random() * 900 + 100)}`;
    const randomTable = Math.floor(Math.random() * 14 + 1);
    const newOrder = {
      id: newId,
      table: randomTable,
      items: [
        { name: 'دبل سماش برغر', quantity: 2, price: 42, extras: ['جبنة شيدر'], customization: 'ميديوم' },
        { name: 'تشيز بيكون فرايز', quantity: 1, price: 22 },
        { name: 'كوكا كولا مثلجة', quantity: 2, price: 7 }
      ],
      total: 120,
      status: 'جديد',
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      customerName: `زبون طاولة ${randomTable}`,
      notes: 'بدون بصل في أحد البرغرين، صوص خارجي'
    };
    setOrdersList(prev => [newOrder, ...prev]);
    setSelectedOrderId(newId);
    if (soundEnabled) playOrderChime();
  };

  const resetOrders = () => {
    setOrdersList(initialOrders);
    setSelectedOrderId(initialOrders[0]?.id || '');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLogout = () => {
    router.push('/staff/login');
  };

  // Dedicated single-page thermal receipt print (80mm) via isolated iframe
  const handlePrintReceipt = (order: any) => {
    if (!order) return;
    printThermalReceipt({
      id: order.id,
      table: order.table,
      time: order.time,
      total: order.total,
      items: order.items || [],
      notes: order.notes,
      restaurantName: 'Burger House نابلس'
    });
  };

  // Filter orders
  const filteredOrders = ordersList.filter(o => {
    const matchesFilter = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          <span className="bg-slate-700 text-slate-100 font-black text-[11px] px-2.5 py-0.5 rounded-full">
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
        <div className={`rounded-2xl border p-8 text-center text-slate-400 text-xs ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          اختر طلباً من القائمة لعرض تفاصيله
        </div>
      );
    }

    return (
      <div className={`space-y-3.5 ${
        isMobileModal 
          ? '' 
          : `rounded-2xl border shadow-sm p-4 max-h-[calc(100vh-160px)] overflow-y-auto ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`
      }`}>
        {/* Order Details Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{order.id}</span>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">
              طلب طاولة <span className="text-orange-600 font-black">{order.table}</span> — الساعة {order.time}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePrintReceipt(order)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs font-black"
              title="طباعة بون المطبخ (صفحة واحدة فورية)"
            >
              <Printer size={15} />
              <span>طباعة البون</span>
            </button>

            {isMobileModal && (
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                title="إغلاق"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className={`space-y-2 ${isMobileModal ? 'max-h-64' : 'max-h-60'} overflow-y-auto pr-0.5`}>
          <p className="text-xs font-black text-slate-700 dark:text-slate-300">
            محتويات الطلب ({order.items.length} أصناف)
          </p>
          {order.items.map((item: any, iIdx: number) => {
            const img = mockImages[item.name];
            return (
              <div 
                key={iIdx} 
                className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800/90 border-slate-700 text-slate-100' 
                    : 'bg-slate-50 border-slate-200/80 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {item.quantity}×
                  </span>
                  {img && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200/80">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate text-slate-900 dark:text-white">{item.name}</p>
                    {item.customization && (
                      <span className="text-[11px] text-orange-600 dark:text-orange-400 font-bold block">• {item.customization}</span>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">• + {item.extras.join('، ')}</span>
                    )}
                  </div>
                </div>
                <span className="font-black text-xs sm:text-sm shrink-0 text-slate-900 dark:text-white">{item.price * item.quantity} ₪</span>
              </div>
            );
          })}
        </div>

        {/* Customer Notes */}
        {order.notes && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl p-3 text-xs font-bold text-amber-950 dark:text-amber-200 shadow-2xs">
            <span className="block mb-1 font-black text-amber-700 dark:text-amber-400">⚠️ ملاحظات الزبون الخاصة:</span>
            <p className="font-semibold leading-relaxed">{order.notes}</p>
          </div>
        )}

        {/* Bill Breakdown */}
        <div className={`p-3.5 rounded-xl space-y-1.5 text-xs ${
          isDarkMode ? 'bg-slate-800/70 border border-slate-700' : 'bg-slate-100/80 border border-slate-200/80'
        }`}>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 font-semibold">
            <span>المجموع الفرعي:</span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{order.total} ₪</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 font-semibold">
            <span>الضريبة والخدمة:</span>
            <span className="font-bold text-emerald-600">مشمولة بالكامل (0 ₪)</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base font-black pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-900 dark:text-white">الإجمالي المطلوب:</span>
            <span className="text-orange-600 font-black">{order.total} ₪</span>
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
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check size={17} />
              <span>تم التسليم بنجاح وإغلاق الطلب 🚀</span>
            </button>
          )}

          {order.status === 'تم التسليم' && (
            <div className="text-center py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-slate-800 dark:text-emerald-400 rounded-xl text-xs sm:text-sm font-black">
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
      <header className={`sticky top-0 z-30 border-b shadow-sm transition-colors backdrop-blur-md ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          
          {/* Logo & Title */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center font-black shadow-md shadow-orange-500/20">
                <ChefHat size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black leading-tight text-slate-900 dark:text-white">إدارة الطلبات الحية</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    isRealtimeConnected 
                      ? 'bg-emerald-500 text-white shadow-xs' 
                      : 'bg-amber-500 text-white'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{isRealtimeConnected ? 'سحابي مباشر' : 'إعادة اتصال...'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Burger House نابلس · متابعة وتحديث طلبات الصالة</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border text-xs font-bold ${
                  soundEnabled ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl border border-slate-200 text-xs font-bold"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>

          {/* Action Toolbar (Without QR code, purely staff order management) */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={addNewSimulatedOrder}
              className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all"
            >
              <PlusCircle size={15} />
              <span>+ محاكاة طلب QR جديد</span>
            </button>

            <button
              onClick={resetOrders}
              className="p-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="إعادة ضبط البيانات"
            >
              <RotateCcw size={15} />
            </button>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`hidden md:flex p-2 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                soundEnabled
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
              title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت التنبيه'}
            >
              {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`hidden md:flex p-2 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                isDarkMode
                  ? 'bg-amber-400 text-slate-900 border-amber-400'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="تبديل المظهر النهاري/الليلي"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="hidden lg:flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold shadow-2xs"
              title="ملء الشاشة"
            >
              ⛶
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs"
              title="تسجيل خروج"
            >
              <LogOut size={15} />
            </button>
          </div>

        </div>

        {/* 2. Filter Tabs & Search Bar */}
        <div className={`max-w-7xl mx-auto px-3 sm:px-5 py-2 border-t flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'
        }`}>
          {/* Status Filter Tabs with Bold Vibrant Counters */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs font-extrabold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              الكل ({ordersList.length})
            </button>

            <button
              onClick={() => setStatusFilter('جديد')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'جديد'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>بانتظار التأكيد ({newOrdersCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('قيد التحضير')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'قيد التحضير'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>قيد التحضير ({preparingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('جاهز')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
                statusFilter === 'جاهز'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>جاهز للتسليم ({readyCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('تم التسليم')}
              className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                statusFilter === 'تم التسليم'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              مكتمل ({ordersList.filter(o => o.status === 'تم التسليم').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الطلب أو الطاولة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-9 pl-3.5 py-1.5 border rounded-full text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>
        </div>
      </header>

      {/* 3. Main Split Master-Detail Interface */}
      <main className="max-w-7xl mx-auto p-3 sm:p-5 w-full flex-1 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
          
          {/* Orders Cards Container: 2 COLUMNS ON DESKTOP & TABLET ("كل طاولتين فصف") */}
          <div className="w-full lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[calc(100vh-170px)] overflow-y-auto pr-0.5 content-start">
            {filteredOrders.length === 0 ? (
              <div className={`col-span-full rounded-2xl border p-12 text-center ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <ClipboardList size={36} className="mx-auto mb-2 text-orange-500 opacity-40" />
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">لا توجد طلبات مطابقة</p>
                <p className="text-xs text-slate-400 mt-1">جرّب تغيير حالة الفلتر أو محاكاة طلب QR جديد</p>
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
                    className={`rounded-2xl p-3 border transition-all cursor-pointer relative shadow-2xs hover:shadow-md flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/20 dark:bg-orange-950/20'
                        : isDarkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200/90 hover:border-orange-300'
                    }`}
                  >
                    {/* Top Row: Order ID + Table badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{order.id}</span>
                        <span className="bg-slate-900 text-amber-300 font-black text-[11px] px-2 py-0.5 rounded-md shadow-2xs">
                          طاولة {order.table}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                        <Clock size={11} />
                        {order.time}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-2">
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Items preview (compact) */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-bold line-clamp-2 mb-2 leading-relaxed">
                      {order.items.map((i: any) => `${i.quantity}× ${i.name}`).join('، ')}
                    </p>

                    {/* Bottom Row: Total & Action Preview */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-orange-600 text-base">{order.total}</span>
                        <span className="text-xs text-orange-600 font-bold">₪</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-xs text-slate-500 font-black">
                        <span className="text-[11px] text-orange-600">معاينة</span>
                        <ChevronRight size={13} className="rtl:rotate-180 text-orange-600" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Sticky Inspector Pane (5 Cols on Desktop) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-20">
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
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
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
