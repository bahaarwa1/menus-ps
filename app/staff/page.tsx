'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, CheckCircle2, UtensilsCrossed, AlertCircle, 
  Bell, BellOff, Check, RotateCcw, LogOut, ChefHat,
  Undo2, History, X, Minus, Square
} from 'lucide-react';

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

  // Mobile Touch Swipe Gesture between Tabs
  const tabList: Array<'active' | 'new' | 'cooking' | 'ready' | 'archive'> = ['active', 'new', 'cooking', 'ready', 'archive'];
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Only trigger horizontal swipe when horizontal movement is greater than vertical & exceeds 40px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      const currentIndex = tabList.indexOf(activeTab);
      if (diffX > 0) {
        // Swiped left (in RTL: next tab)
        if (currentIndex < tabList.length - 1) {
          const nextTab = tabList[currentIndex + 1];
          setActiveTab(nextTab);
          document.getElementById(`staff-tab-${nextTab}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      } else {
        // Swiped right (in RTL: prev tab)
        if (currentIndex > 0) {
          const prevTab = tabList[currentIndex - 1];
          setActiveTab(prevTab);
          document.getElementById(`staff-tab-${prevTab}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

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

  // Windows 11 OS Desktop state for Staff POS
  const [liveTime, setLiveTime] = useState('');
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('ar-PS', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-orange-500 selection:text-white pb-6 md:pb-14" dir="rtl">
      
      {/* 1. Industrial Kitchen Header Bar - Windows 11 on Desktop, Clean App Bar on Mobile */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        {/* Windows 11 Mica Title Bar (Desktop Only) */}
        <div className="hidden md:flex bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
              🪟
            </div>
            <span className="font-extrabold text-white text-xs truncate">
              Menus.ps POS Pro — شاشة المطبخ وإعداد الطلبات (KDS) — Burger House نابلس
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              نظام الطهاة النشط
            </span>
          </div>

          {/* Windows Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button 
              title="تصغير"
              className="w-7 h-5 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white rounded text-xs transition-colors"
            >
              <Minus size={12} />
            </button>
            <button 
              onClick={toggleFullscreen}
              title="ملء الشاشة (F11 للتابلت والمطبخ)"
              className="w-7 h-5 flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white rounded text-xs transition-colors"
            >
              <Square size={10} />
            </button>
            <Link 
              href="/demo" 
              title="إغلاق والعودة للإدارة"
              className="w-7 h-5 flex items-center justify-center hover:bg-rose-600 text-slate-400 hover:text-white rounded text-xs transition-colors"
            >
              <X size={13} />
            </Link>
          </div>
        </div>

        {/* Compact Kitchen App Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm sm:text-lg shadow-md shadow-orange-500/20 shrink-0">
              👨‍🍳
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-black text-white leading-none">
                  شاشة المطبخ (KDS)
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold mt-0.5">فرع نابلس • مزامنة فورية</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Realtime Live Status Badge */}
            <div className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-black flex items-center gap-1 border ${
              isRealtimeConnected
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span>{isRealtimeConnected ? 'مباشر' : 'إعادة اتصال...'}</span>
            </div>

            {/* Sound alert toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border ${
                soundEnabled 
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="تفعيل/كتم التنبيه الصوتي"
            >
              {soundEnabled ? <Bell size={13} className="text-orange-400" /> : <BellOff size={13} />}
              <span className="hidden sm:inline text-[11px]">{soundEnabled ? 'الجرس' : 'مكتوم'}</span>
            </button>

            {/* Fullscreen F11 - Desktop only */}
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="ملء الشاشة"
            >
              <Square size={13} />
            </button>

            {/* Reset - Desktop only */}
            <button
              onClick={() => setOrders(initialKitchenOrders)}
              className="hidden sm:flex p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              title="إعادة تعيين"
            >
              <RotateCcw size={13} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 sm:px-2.5 sm:py-1 text-xs font-bold text-slate-300 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/50 rounded-lg transition-colors flex items-center gap-1 border border-slate-700"
              title="تسجيل خروج"
            >
              <LogOut size={13} />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Order Filter Tabs */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 py-2 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-0.5 scrollbar-none">
            {/* Active All */}
            <button
              id="staff-tab-active"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'active'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-400/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>النشطة</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'active' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {activeOrders.length}
              </span>
            </button>

            {/* New */}
            <button
              id="staff-tab-new"
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'new'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-500/30'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
              <span>جديدة ({newOrders.length})</span>
            </button>

            {/* Cooking */}
            <button
              id="staff-tab-cooking"
              onClick={() => setActiveTab('cooking')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'cooking'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-500/30'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-800/60'
              }`}
            >
              <UtensilsCrossed size={12} />
              <span>طهي ({cookingOrders.length})</span>
            </button>

            {/* Ready */}
            <button
              id="staff-tab-ready"
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ready'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-500/30'
                  : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-800/60'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>جاهزة ({readyOrders.length})</span>
            </button>

            {/* Archive */}
            <button
              id="staff-tab-archive"
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'archive'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <History size={12} />
              <span>أرشيف ({completedOrders.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
              <Clock size={12} className="text-orange-400" />
              <span>متوسط: <strong>8 د</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Orders Area with Swipe Touch Gesture */}
      <main 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="max-w-7xl mx-auto p-2.5 sm:p-4 w-full flex-1 pb-20 touch-pan-y"
      >
        {displayedOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 max-w-sm mx-auto my-8 shadow-xs">
            <ChefHat size={40} className="mx-auto mb-2 text-orange-500 opacity-60" />
            <h3 className="text-sm sm:text-base font-black text-white mb-1">
              {activeTab === 'archive' ? 'لا توجد طلبات في سجل اليوم بعد' : 'لا توجد طلبات في هذا القسم'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeTab === 'archive' ? 'الطلبات المكتملة تظهر هنا' : 'الطلبات الحية ستظهر فور إرسالها من الطاولات'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 items-start">
            {displayedOrders.map((order) => {
              const isNew = order.status === 'new';
              const isCooking = order.status === 'cooking';
              const isReady = order.status === 'ready';
              const isCompleted = order.status === 'completed';

              return (
                <div
                  key={order.id}
                  className={`bg-slate-900 rounded-2xl sm:rounded-3xl border transition-all shadow-md flex flex-col justify-between overflow-hidden relative ${
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
                  <div className={`px-2.5 py-2 sm:px-3.5 sm:py-2.5 border-b flex items-center justify-between ${
                    isNew 
                      ? 'bg-rose-950/50 border-rose-900/50 text-rose-200' 
                      : isCooking 
                      ? 'bg-amber-950/50 border-amber-900/50 text-amber-200' 
                      : isReady 
                      ? 'bg-emerald-950/50 border-emerald-900/50 text-emerald-200'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}>
                    {/* Compact Table Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-xs sm:text-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg shadow-xs ${
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
                      <span className="font-mono font-bold text-white text-xs">{order.id}</span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock size={10} />
                        {isCompleted ? order.completedAt : `${order.time} (${order.elapsedMinutes}د)`}
                      </span>
                    </div>

                    {/* Status Pill & Undo Button */}
                    <div className="flex items-center gap-1">
                      {(isCooking || isReady) && (
                        <button
                          onClick={() => moveBackStep(order.id)}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[10px] font-bold flex items-center gap-0.5 active:scale-95 transition-all"
                          title="تراجع خطوة للوراء"
                        >
                          <Undo2 size={10} />
                          <span>تراجع</span>
                        </button>
                      )}

                      {isNew && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          جديد
                        </span>
                      )}
                      {isCooking && (
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <UtensilsCrossed size={11} />
                          قيد الطهي
                        </span>
                      )}
                      {isReady && (
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <CheckCircle2 size={11} />
                          جاهز
                        </span>
                      )}
                      {isCompleted && (
                        <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          ✓ تم التسليم
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items Checklist - High Density */}
                  <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5 flex-1">
                    {order.items.map((item, idx) => {
                      const img = foodImages[item.name];
                      return (
                        <div
                          key={idx}
                          onClick={() => !isCompleted && toggleItemDone(order.id, idx)}
                          className={`px-2 py-1.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                            isCompleted
                              ? 'bg-slate-950/40 border-slate-800/60'
                              : item.done 
                              ? 'bg-slate-950/40 border-slate-800/80 opacity-40 line-through cursor-pointer' 
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 cursor-pointer shadow-inner'
                          }`}
                          title={!isCompleted ? "اضغط للشطب بعد التجهيز" : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Quantity Badge */}
                            <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md font-black text-[11px] sm:text-xs flex items-center justify-center shrink-0 border ${
                              item.done 
                                ? 'bg-slate-800 text-slate-500 border-slate-700' 
                                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                            }`}>
                              {item.qty}×
                            </span>

                            {/* Food Photo - Desktop/Tablet only */}
                            {img && (
                              <div className="w-6 h-6 rounded overflow-hidden shrink-0 border border-slate-700 bg-slate-900 hidden sm:block">
                                <img src={img} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            )}

                            {/* Details */}
                            <div className="min-w-0">
                              <p className="font-black text-xs text-white leading-tight truncate">
                                {item.name}
                              </p>
                              {(item.notes || (item.extras && item.extras.length > 0)) && (
                                <p className="text-[10px] text-orange-400 font-bold truncate mt-0.5">
                                  {item.notes && <span>• {item.notes} </span>}
                                  {item.extras && item.extras.length > 0 && <span>• + {item.extras.join('، ')}</span>}
                                </p>
                              )}
                            </div>
                          </div>

                          {!isCompleted && (
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              item.done ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700 bg-slate-900'
                            }`}>
                              {item.done && <Check size={11} strokeWidth={3} />}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Customer Notes Alert */}
                    {order.customerNote && (
                      <div className="mt-1 bg-amber-950/40 border border-amber-600/50 rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold text-amber-200 flex items-start gap-1">
                        <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                        <p className="leading-tight"><span className="text-amber-400 font-black">ملاحظة:</span> {order.customerNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Action Section */}
                  <div className="p-2 sm:p-2.5 bg-slate-950/90 border-t border-slate-800">
                    {/* State 1: New -> Start Cooking */}
                    {isNew && (
                      <button
                        onClick={() => startCooking(order.id)}
                        className="w-full py-2 sm:py-2.5 px-3 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <UtensilsCrossed size={14} />
                        <span>بدء التحضير 🔥</span>
                      </button>
                    )}

                    {/* State 2: Cooking -> Mark Ready */}
                    {isCooking && (
                      <button
                        onClick={() => markReady(order.id)}
                        className="w-full py-2 sm:py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>جاهز للتقديم (نداء الويتر) ✅</span>
                      </button>
                    )}

                    {/* State 3: Ready -> Confirm Handover */}
                    {isReady && (
                      <div>
                        {confirmCompleteId === order.id ? (
                          <div className="bg-emerald-950/80 border border-emerald-500/80 rounded-xl p-1.5 text-center animate-in fade-in duration-200">
                            <p className="text-[11px] font-black text-emerald-200 mb-1">
                              تأكيد استلام الويتر لطاولة {order.table}؟
                            </p>
                            <div className="flex gap-1">
                              <button
                                onClick={() => confirmAndComplete(order.id)}
                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black"
                              >
                                نعم، تم التسليم ✓
                              </button>
                              <button
                                onClick={() => setConfirmCompleteId(null)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCompleteId(order.id)}
                            className="w-full py-2 sm:py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>تسليم للويتر وأرشفة</span>
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* State 4: Completed (In Archive) -> Restore Option */}
                    {isCompleted && (
                      <button
                        onClick={() => restoreFromArchive(order.id)}
                        className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-slate-700"
                        title="استرجاع الطلب للمطبخ"
                      >
                        <Undo2 size={12} />
                        <span>استرجاع للمطبخ</span>
                      </button>
                    )}

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. Safety Floating Undo Toast */}
      {undoToast.show && (
        <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-lg w-[94%] sm:w-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="text-xs sm:text-sm font-black truncate">{undoToast.message}</span>
          </div>

          <button
            onClick={handleUndo}
            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg sm:rounded-xl text-xs font-black flex items-center gap-1 shrink-0 shadow-xs transition-all"
          >
            <Undo2 size={13} />
            <span>تراجع (Undo)</span>
          </button>

          <button 
            onClick={() => setUndoToast(prev => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ============================================================
          5. WINDOWS 11 TASKBAR FOR STAFF KDS (شريط مهام ويندوز 11 للمطبخ - للشاشات الكبيرة فقط)
      ============================================================ */}
      <footer className="hidden md:flex fixed bottom-0 inset-x-0 z-40 h-11 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-3 sm:px-4 items-center justify-between text-white shadow-2xl select-none">
        
        {/* Right: Start Button + Pinned Apps */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs font-black transition-all active:scale-95 shadow-xs ${
              startMenuOpen 
                ? 'bg-sky-500 text-white ring-2 ring-sky-400/30' 
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            <span>🪟</span>
            <span className="hidden sm:inline">ابدأ</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1">
            <span className="relative px-2.5 py-1 rounded-lg bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
              <span>👨‍🍳</span>
              <span className="hidden sm:inline text-[11px]">شاشة المطبخ (نشط)</span>
              <span className="absolute -bottom-1 inset-x-2 h-0.5 bg-sky-400 rounded-full" />
            </span>

            <Link 
              href="/demo" 
              className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs flex items-center gap-1.5"
              title="لوحة الإدارة الرئيسية"
            >
              <span>🏠</span>
              <span className="hidden md:inline text-[11px]">لوحة الإدارة</span>
            </Link>

            <Link 
              href="/m" 
              target="_blank"
              className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs flex items-center gap-1.5"
              title="معاينة منيو الجوال"
            >
              <span>📱</span>
              <span className="hidden md:inline text-[11px]">منيو الزبون</span>
            </Link>
          </div>
        </div>

        {/* Left: System Tray (الصوت، ملء الشاشة، الساعة الحية) */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playOrderChime();
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
              soundEnabled ? 'bg-orange-500/20 text-orange-300' : 'bg-slate-800 text-slate-400'
            }`}
            title="تفعيل أو كتم التنبيه الصوتي"
          >
            <span>{soundEnabled ? '🔔 رنين الطلبات' : '🔕 صامت'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors hidden sm:flex items-center"
            title="وضع ملء الشاشة للمطبخ (F11)"
          >
            <Square size={13} />
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <span className="hidden sm:inline text-[11px] text-emerald-400 font-bold">🟢 سحابي نشط</span>

          <div className="text-left font-mono text-[11px] text-white font-bold px-1">
            {liveTime || '12:00:00 م'}
          </div>
        </div>
      </footer>

      {/* Start Menu for Staff */}
      {startMenuOpen && (
        <div 
          onClick={() => setStartMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-13 right-4 sm:right-6 w-[90vw] sm:w-[360px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white font-sans text-right animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="flex items-center justify-between text-xs font-black text-slate-400 mb-3 px-1">
              <span>نظام تشغيل المطبخ وإدارة الطلبات</span>
              <span className="text-[10px] text-sky-400">Burger House</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center mb-4">
              <button 
                onClick={() => { setStartMenuOpen(false); setActiveTab('active'); }}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 flex flex-col items-center gap-1"
              >
                <span className="text-xl">👨‍🍳</span>
                <span className="text-xs font-bold">الطلبات النشطة ({activeOrders.length})</span>
              </button>

              <button 
                onClick={() => { setStartMenuOpen(false); setActiveTab('new'); }}
                className="p-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 flex flex-col items-center gap-1"
              >
                <span className="text-xl">🛎️</span>
                <span className="text-xs font-bold text-rose-300">طلبات جديدة ({newOrders.length})</span>
              </button>

              <Link 
                href="/demo" 
                onClick={() => setStartMenuOpen(false)}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 flex flex-col items-center gap-1"
              >
                <span className="text-xl">🏠</span>
                <span className="text-xs font-bold">لوحة الإدارة</span>
              </Link>

              <Link 
                href="/m" 
                target="_blank"
                onClick={() => setStartMenuOpen(false)}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 flex flex-col items-center gap-1"
              >
                <span className="text-xl">📱</span>
                <span className="text-xs font-bold">منيو الجوال</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-slate-400">طاقم التجهيز والمطبخ</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] font-bold"
              >
                <span>خروج</span>
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
