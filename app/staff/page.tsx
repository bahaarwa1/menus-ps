'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, CheckCircle2, UtensilsCrossed, AlertCircle, 
  Bell, BellOff, Check, RotateCcw, LogOut, ChefHat,
  Undo2, History, X
} from 'lucide-react';
import Logo from '@/components/common/Logo';

// Audio chime using Web Audio API (zero external asset dependencies)
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
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // Graceful fallback if autoplay blocked
  }
}

// Food images for rapid visual recognition in the kitchen
const foodImages: Record<string, string> = {
  'دبل سماش برغر': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'تشيز فرايز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80',
  'تشيز بيكون فرايز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80',
  'كلاسيك برغر فاخر': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
  'وجبة أطفال': 'https://images.unsplash.com/photo-1625937759403-1c39050d276c?w=400&q=80',
  'بيتزا مارغريتا': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
  'عصير برتقال': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
  'تشيكن كريسبي': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80',
  'بطاطا ودجز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80',
  'كولا': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
};

interface OrderItem {
  name: string;
  qty: number;
  notes?: string;
  extras?: string[];
  done?: boolean;
}

interface KitchenOrder {
  id: string;
  table: number;
  time: string;
  elapsedMinutes: number;
  status: 'new' | 'cooking' | 'ready' | 'completed';
  customerNote?: string;
  items: OrderItem[];
  completedAt?: string;
}

const initialKitchenOrders: KitchenOrder[] = [
  {
    id: '#1048',
    table: 4,
    time: '14:32',
    elapsedMinutes: 2,
    status: 'new',
    customerNote: 'بدون بصل في أحد البرغرين، صوص خارجي حار',
    items: [
      { name: 'دبل سماش برغر', qty: 2, notes: 'لحم مستوي ميديوم', extras: ['جبنة شيدر إضافية'] },
      { name: 'تشيز فرايز', qty: 1 },
      { name: 'كولا', qty: 2, notes: 'مع ثلج وليمون' },
    ],
  },
  {
    id: '#1049',
    table: 12,
    time: '14:35',
    elapsedMinutes: 6,
    status: 'cooking',
    customerNote: 'اللحم مستوي جيداً من أجل طفل صغير',
    items: [
      { name: 'كلاسيك برغر فاخر', qty: 1, notes: 'بدون مخلل' },
      { name: 'وجبة أطفال', qty: 1, notes: 'عصير برتقال طبيعي' },
    ],
  },
  {
    id: '#1050',
    table: 2,
    time: '14:38',
    elapsedMinutes: 1,
    status: 'new',
    customerNote: 'أرجو تحميص أطراف البيتزا قليلاً',
    items: [
      { name: 'بيتزا مارغريتا', qty: 1, extras: ['ريحان طازج'] },
      { name: 'عصير برتقال', qty: 2, notes: 'بدون سكر' },
    ],
  },
  {
    id: '#1051',
    table: 8,
    time: '14:41',
    elapsedMinutes: 12,
    status: 'cooking',
    customerNote: 'الصلصات منفصلة في علب خارجية',
    items: [
      { name: 'تشيكن كريسبي', qty: 3, notes: 'حار جداً سبايسي' },
      { name: 'بطاطا ودجز', qty: 2, extras: ['صوص ثوم'] },
    ],
  },
  {
    id: '#1045',
    table: 6,
    time: '14:20',
    elapsedMinutes: 18,
    status: 'ready',
    items: [
      { name: 'دبل سماش برغر', qty: 1 },
      { name: 'كولا', qty: 1 },
    ],
  },
  {
    id: '#1042',
    table: 3,
    time: '14:05',
    elapsedMinutes: 35,
    status: 'completed',
    completedAt: '14:25',
    items: [
      { name: 'تشيكن كريسبي', qty: 2 },
      { name: 'عصير برتقال', qty: 2 },
    ],
  },
];

export default function StaffProtectedOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<KitchenOrder[]>(initialKitchenOrders);
  const [activeTab, setActiveTab] = useState<'active' | 'new' | 'cooking' | 'ready' | 'archive'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);

  // Connect to SSE Realtime stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/orders/stream');

      eventSource.addEventListener('connected', () => {
        setIsRealtimeConnected(true);
      });

      eventSource.addEventListener('order', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.eventType === 'ORDER_CREATED') {
            const incoming = payload.order;
            setOrders(prev => {
              const alreadyExists = prev.some(o => o.id === incoming.orderNumber || o.id === incoming.id);
              if (alreadyExists) return prev;
              const newKOrder: KitchenOrder = {
                id: incoming.orderNumber || incoming.id,
                table: incoming.tableNumber || 12,
                time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                elapsedMinutes: 0,
                status: 'new',
                customerNote: incoming.customerNote,
                items: (incoming.items || []).map((i: { itemName: string; quantity: number; notes?: string; selectedExtras?: Array<{ name: string }> }) => ({
                  name: i.itemName,
                  qty: i.quantity,
                  notes: i.notes,
                  extras: (i.selectedExtras || []).map((ext) => ext.name || String(ext)),
                })),
              };
              return [newKOrder, ...prev];
            });

            if (soundEnabled) {
              playOrderChime();
            }
          } else if (payload.eventType === 'ORDER_STATUS_CHANGED') {
            const incoming = payload.order;
            const statusMapReverse: Record<string, KitchenOrder['status']> = {
              'جديد': 'new',
              'قيد التحضير': 'cooking',
              'جاهز': 'ready',
              'تم التسليم': 'completed',
              new: 'new',
              cooking: 'cooking',
              ready: 'ready',
              completed: 'completed',
            };
            const mapped = statusMapReverse[incoming.status];
            if (mapped) {
              setOrders(prev => prev.map(o => (o.id === incoming.orderNumber || o.id === incoming.id) ? { ...o, status: mapped } : o));
            }
          }
        } catch (err) {
          console.error('Error parsing SSE order event:', err);
        }
      });

      eventSource.onerror = () => {
        setIsRealtimeConnected(false);
      };
    } catch {
      setIsRealtimeConnected(false);
    }

    return () => {
      eventSource?.close();
    };
  }, [soundEnabled]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login?role=staff');
      router.refresh();
    } catch {
      router.push('/login?role=staff');
    }
  };

  // Safety Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    show: boolean;
    message: string;
    orderId: string;
    prevStatus: KitchenOrder['status'];
  }>({ show: false, message: '', orderId: '', prevStatus: 'new' });

  // Confirmation modal state for closing order
  const [confirmCompleteId, setConfirmCompleteId] = useState<string | null>(null);

  const showUndo = (orderId: string, prevStatus: KitchenOrder['status'], message: string) => {
    setUndoToast({
      show: true,
      message,
      orderId,
      prevStatus,
    });
    // Auto-hide toast after 8 seconds
    setTimeout(() => {
      setUndoToast(prev => ({ ...prev, show: false }));
    }, 8000);
  };

  const handleUndo = () => {
    if (!undoToast.orderId) return;
    setOrders(prev => prev.map(o => o.id === undoToast.orderId ? { ...o, status: undoToast.prevStatus } : o));
    setUndoToast(prev => ({ ...prev, show: false }));
  };

  // Status transitions with safety & realtime sync
  const startCooking = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cooking' } : o));
    showUndo(id, 'new', `تم نقل طلب طاولة ${order.table} إلى (قيد التحضير)`);
    fetch(`/api/v1/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cooking' }),
    }).catch(() => {});
  };

  const markReady = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'ready' } : o));
    showUndo(id, 'cooking', `تم نقل طلب طاولة ${order.table} إلى (جاهز للتسليم)`);
    fetch(`/api/v1/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ready' }),
    }).catch(() => {});
  };

  const moveBackStep = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      if (o.status === 'cooking') return { ...o, status: 'new' };
      if (o.status === 'ready') return { ...o, status: 'cooking' };
      if (o.status === 'completed') return { ...o, status: 'ready' };
      return o;
    }));
  };

  const confirmAndComplete = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'completed', completedAt: nowTime } : o));
    setConfirmCompleteId(null);
    showUndo(id, 'ready', `تم تسليم طلب طاولة ${order.table} وحفظه في الأرشيف`);
    fetch(`/api/v1/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    }).catch(() => {});
  };

  const restoreFromArchive = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cooking' } : o));
  };

  const toggleItemDone = (orderId: string, itemIdx: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const updatedItems = [...o.items];
      updatedItems[itemIdx] = {
        ...updatedItems[itemIdx],
        done: !updatedItems[itemIdx].done
      };
      return { ...o, items: updatedItems };
    }));
  };

  // Counts
  const newOrders = orders.filter(o => o.status === 'new');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const activeOrders = orders.filter(o => o.status !== 'completed');
  const completedOrders = orders.filter(o => o.status === 'completed');

  const displayedOrders = orders.filter(o => {
    if (activeTab === 'new') return o.status === 'new';
    if (activeTab === 'cooking') return o.status === 'cooking';
    if (activeTab === 'ready') return o.status === 'ready';
    if (activeTab === 'archive') return o.status === 'completed';
    return o.status !== 'completed'; // 'active'
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-orange-500 selection:text-white" dir="rtl">
      
      {/* 1. Industrial Kitchen Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Logo size="sm" href="/staff" />
            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white leading-none flex items-center gap-2">
                  <ChefHat size={20} className="text-orange-500" />
                  <span>شاشة المطبخ وإعداد الطلبات (KDS)</span>
                </h1>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">فرع نابلس • مزامنة فورية في أجزاء من الثانية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Realtime Live Status Badge */}
            <div className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
              isRealtimeConnected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span className="hidden sm:inline">{isRealtimeConnected ? 'مباشر (Realtime)' : 'جارٍ إعادة الاتصال...'}</span>
            </div>

            {/* Sound alert toggle & test */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                soundEnabled 
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="تفعيل/كتم التنبيه الصوتي أو اختبار الصوت"
            >
              {soundEnabled ? <Bell size={14} className="animate-bounce text-orange-400" /> : <BellOff size={14} />}
              <span className="hidden sm:inline">{soundEnabled ? 'الجرس شغال (اختبار)' : 'مكتوم'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => setOrders(initialKitchenOrders)}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
              title="إعادة تعيين البيانات الافتراضية"
            >
              <RotateCcw size={15} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/50 rounded-xl transition-colors flex items-center gap-1 border border-slate-700"
            >
              <span className="hidden sm:inline">خروج</span>
              <LogOut size={14} />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Order Filter Tabs & Kitchen KPI Strip */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {/* Active All */}
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'active'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-400/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>كل الطلبات النشطة</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'active' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {activeOrders.length}
              </span>
            </button>

            {/* New */}
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'new'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-500/30'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              <span>جديدة ({newOrders.length})</span>
            </button>

            {/* Cooking */}
            <button
              onClick={() => setActiveTab('cooking')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'cooking'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-2 ring-amber-500/30'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-800/60'
              }`}
            >
              <UtensilsCrossed size={14} />
              <span>قيد الطهي ({cookingOrders.length})</span>
            </button>

            {/* Ready */}
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'ready'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                  : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-800/60'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>جاهزة للتقديم ({readyOrders.length})</span>
            </button>

            {/* Archive */}
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'archive'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <History size={14} />
              <span>أرشيف اليوم ({completedOrders.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              <Clock size={13} className="text-orange-400" />
              <span>متوسط وقت التحضير: <strong>8 دقائق</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Orders Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-5 w-full flex-1 pb-24">
        {displayedOrders.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 max-w-md mx-auto my-12 shadow-xs">
            <ChefHat size={48} className="mx-auto mb-3 opacity-40 text-orange-500" />
            <h3 className="text-lg font-black text-slate-800 mb-1">
              {activeTab === 'archive' ? 'لا توجد طلبات في سجل اليوم بعد' : 'لا توجد طلبات في هذا القسم'}
            </h3>
            <p className="text-xs text-slate-400">
              {activeTab === 'archive' ? 'الطلبات التي يتم تسليمها تظهر هنا تلقائياً لتوثيقها.' : 'الطلبات الحية ستظهر فور قيام الزبائن بالطلب من الطاولات.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-start">
            {displayedOrders.map((order) => {
              const isNew = order.status === 'new';
              const isCooking = order.status === 'cooking';
              const isReady = order.status === 'ready';
              const isCompleted = order.status === 'completed';

              return (
                <div
                  key={order.id}
                  className={`bg-slate-900 rounded-3xl border-2 transition-all shadow-xl flex flex-col justify-between overflow-hidden relative ${
                    isNew
                      ? 'border-rose-500/80 shadow-rose-950/20'
                      : isCooking
                      ? 'border-amber-500/80 shadow-amber-950/20'
                      : isReady
                      ? 'border-emerald-500/80 shadow-emerald-950/20'
                      : 'border-slate-800 bg-slate-900/60 opacity-80'
                  }`}
                >
                  
                  {/* Card Header: Table Number & Status */}
                  <div className={`p-4 border-b flex items-center justify-between ${
                    isNew 
                      ? 'bg-rose-950/40 border-rose-900/40 text-rose-200' 
                      : isCooking 
                      ? 'bg-amber-950/40 border-amber-900/40 text-amber-200' 
                      : isReady 
                      ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-200'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}>
                    {/* Big Table Badge */}
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-xl px-4 py-1.5 rounded-2xl shadow-md ${
                        isNew
                          ? 'bg-rose-500 text-white'
                          : isCooking
                          ? 'bg-amber-500 text-slate-950'
                          : isReady
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        طاولة {order.table}
                      </span>
                      <div>
                        <span className="font-mono font-bold text-white text-sm">{order.id}</span>
                        <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                          <Clock size={12} />
                          {isCompleted ? `أُنجز الساعة ${order.completedAt}` : `${order.time} (منذ ${order.elapsedMinutes} د)`}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill & Undo Button */}
                    <div className="flex items-center gap-1.5">
                      {/* Move back button if cooking or ready */}
                      {(isCooking || isReady) && (
                        <button
                          onClick={() => moveBackStep(order.id)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-all"
                          title="تراجع خطوة للوراء"
                        >
                          <Undo2 size={12} />
                          <span>تراجع</span>
                        </button>
                      )}

                      {isNew && (
                        <span className="bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                          جديد
                        </span>
                      )}
                      {isCooking && (
                        <span className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                          <UtensilsCrossed size={13} />
                          قيد الطهي
                        </span>
                      )}
                      {isReady && (
                        <span className="bg-emerald-500 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                          <CheckCircle2 size={13} />
                          جاهز للتقديم
                        </span>
                      )}
                      {isCompleted && (
                        <span className="bg-slate-800 text-slate-400 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1">
                          ✓ تم التسليم
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items Checklist */}
                  <div className="p-4 space-y-2.5 flex-1">
                    <p className="text-[11px] font-black text-slate-400 mb-1">
                      محتويات الوجبة ({order.items.length} أصناف):
                    </p>

                    {order.items.map((item, idx) => {
                      const img = foodImages[item.name];
                      return (
                        <div
                          key={idx}
                          onClick={() => !isCompleted && toggleItemDone(order.id, idx)}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCompleted
                              ? 'bg-slate-950/40 border-slate-800'
                              : item.done 
                              ? 'bg-slate-950/40 border-slate-800/80 opacity-40 line-through cursor-pointer' 
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 cursor-pointer shadow-inner'
                          }`}
                          title={!isCompleted ? "اضغط للشطب بعد التجهيز" : undefined}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Quantity Badge */}
                            <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 border ${
                              item.done 
                                ? 'bg-slate-800 text-slate-500 border-slate-700' 
                                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            }`}>
                              {item.qty}×
                            </span>

                            {/* Food Photo */}
                            {img && (
                              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-900">
                                <img src={img} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            )}

                            {/* Details */}
                            <div className="min-w-0">
                              <p className="font-black text-sm text-white leading-tight truncate">
                                {item.name}
                              </p>
                              {item.notes && (
                                <span className="text-xs font-bold text-orange-400 block mt-0.5">
                                  • {item.notes}
                                </span>
                              )}
                              {item.extras && item.extras.length > 0 && (
                                <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                                  • {item.extras.join('، ')}
                                </span>
                              )}
                            </div>
                          </div>

                          {!isCompleted && (
                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                              item.done ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {item.done && <Check size={14} strokeWidth={3} />}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Customer Notes Alert */}
                    {order.customerNote && (
                      <div className="mt-3 bg-amber-950/40 border border-amber-600/50 rounded-2xl p-3 text-xs font-black text-amber-200">
                        <span className="flex items-center gap-1.5 text-amber-400 mb-1">
                          <AlertCircle size={14} className="shrink-0" />
                          ملاحظة هامة من الزبون:
                        </span>
                        <p className="font-bold leading-relaxed">{order.customerNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Action Section with Anti-Error Safeguards */}
                  <div className="p-3.5 bg-slate-950/90 border-t border-slate-800">
                    
                    {/* State 1: New -> Start Cooking */}
                    {isNew && (
                      <button
                        onClick={() => startCooking(order.id)}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <UtensilsCrossed size={18} />
                        <span>بدء التحضير على الشواية 🔥</span>
                      </button>
                    )}

                    {/* State 2: Cooking -> Mark Ready */}
                    {isCooking && (
                      <button
                        onClick={() => markReady(order.id)}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={18} />
                        <span>تم تجهيز الطلب — نداء الويتر ✅</span>
                      </button>
                    )}

                    {/* State 3: Ready -> Confirm Handover */}
                    {isReady && (
                      <div>
                        {confirmCompleteId === order.id ? (
                          <div className="bg-slate-900 border border-emerald-500/50 p-3 rounded-2xl text-center space-y-2">
                            <p className="text-xs font-black text-emerald-400">
                              هل استلم الويتر الطلب وتوجه لطاولة {order.table}؟
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmAndComplete(order.id)}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md"
                              >
                                نعم، تم التسليم ✓
                              </button>
                              <button
                                onClick={() => setConfirmCompleteId(null)}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCompleteId(order.id)}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                          >
                            <span>تسليم للويتر وأرشفة</span>
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* State 4: Completed (In Archive) -> Restore Option */}
                    {isCompleted && (
                      <button
                        onClick={() => restoreFromArchive(order.id)}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                        title="استرجاع الطلب للمطبخ في حال كان هناك استفسار من الزبون"
                      >
                        <Undo2 size={13} />
                        <span>استرجاع للمطبخ (إلغاء الأرشفة)</span>
                      </button>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. Safety Floating Undo Toast (Gives immediate peace of mind for 8 seconds!) */}
      {undoToast.show && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-lg w-[90%] sm:w-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="text-xs sm:text-sm font-black truncate">{undoToast.message}</span>
          </div>

          <button
            onClick={handleUndo}
            className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1 shrink-0 shadow-xs transition-all"
          >
            <Undo2 size={14} />
            <span>تراجع الآن (Undo)</span>
          </button>

          <button 
            onClick={() => setUndoToast(prev => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

    </div>
  );
}
