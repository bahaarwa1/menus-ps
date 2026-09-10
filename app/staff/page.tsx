'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, CheckCircle2, UtensilsCrossed, 
  Bell, BellOff, Check, RotateCcw, LogOut, ChefHat,
  Undo2, X, Armchair, LayoutGrid,
  Sun, Moon
} from 'lucide-react';

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
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

export interface OrderItem {
  name: string;
  qty: number;
  notes?: string;
  extras?: string[];
  done?: boolean;
}

export interface TableItem {
  id: number;
  seats: number;
  status: 'فارغة' | 'جديد' | 'قيد التحضير' | 'جاهز' | 'محجوزة' | 'تم التسليم';
  orderId?: string;
  time?: string;
  elapsedMinutes?: number;
  items?: OrderItem[];
  customerNote?: string;
  completedAt?: string;
}

// Initial 15 tables - Covering ALL tables in the restaurant
const initialTablesData: TableItem[] = [
  {
    id: 1, seats: 2, status: 'قيد التحضير', orderId: '#1041', time: '14:22', elapsedMinutes: 10,
    items: [
      { name: 'كلاسيك برغر فاخر', qty: 2 },
      { name: 'بطاطا مقلية', qty: 2 },
      { name: 'كولا', qty: 2 }
    ]
  },
  {
    id: 2, seats: 4, status: 'جديد', orderId: '#1050', time: '14:38', elapsedMinutes: 1,
    customerNote: 'أرجو تحميص أطراف البيتزا قليلاً',
    items: [
      { name: 'بيتزا مارغريتا', qty: 1, extras: ['ريحان طازج'] },
      { name: 'عصير برتقال', qty: 2, notes: 'بدون سكر' }
    ]
  },
  { id: 3, seats: 2, status: 'فارغة' },
  {
    id: 4, seats: 6, status: 'جديد', orderId: '#1048', time: '14:32', elapsedMinutes: 2,
    customerNote: 'بدون بصل في أحد البرغرين، صوص خارجي حار',
    items: [
      { name: 'دبل سماش برغر', qty: 2, notes: 'لحم مستوي ميديوم', extras: ['جبنة شيدر إضافية'] },
      { name: 'تشيز فرايز', qty: 1 },
      { name: 'كولا', qty: 2, notes: 'مع ثلج وليمون' }
    ]
  },
  { id: 5, seats: 4, status: 'فارغة' },
  {
    id: 6, seats: 2, status: 'جاهز', orderId: '#1045', time: '14:20', elapsedMinutes: 18,
    items: [
      { name: 'دبل سماش برغر', qty: 1 },
      { name: 'كولا', qty: 1 }
    ]
  },
  {
    id: 7, seats: 4, status: 'قيد التحضير', orderId: '#1046', time: '14:25', elapsedMinutes: 14,
    items: [
      { name: 'تشيكن كريسبي', qty: 2 },
      { name: 'تشيز فرايز', qty: 1 }
    ]
  },
  {
    id: 8, seats: 8, status: 'قيد التحضير', orderId: '#1051', time: '14:41', elapsedMinutes: 12,
    customerNote: 'الصلصات منفصلة في علب خارجية',
    items: [
      { name: 'تشيكن كريسبي', qty: 3, notes: 'حار جداً سبايسي' },
      { name: 'بطاطا ودجز', qty: 2, extras: ['صوص ثوم'] }
    ]
  },
  { id: 9, seats: 2, status: 'فارغة' },
  { id: 10, seats: 4, status: 'فارغة' },
  { id: 11, seats: 6, status: 'محجوزة' },
  {
    id: 12, seats: 4, status: 'قيد التحضير', orderId: '#1049', time: '14:35', elapsedMinutes: 6,
    customerNote: 'اللحم مستوي جيداً من أجل طفل صغير',
    items: [
      { name: 'كلاسيك برغر فاخر', qty: 1, notes: 'بدون مخلل' },
      { name: 'وجبة أطفال', qty: 1, notes: 'عصير برتقال طبيعي' }
    ]
  },
  { id: 13, seats: 2, status: 'فارغة' },
  {
    id: 14, seats: 4, status: 'جديد', orderId: '#1052', time: '14:44', elapsedMinutes: 3,
    items: [
      { name: 'دبل سماش برغر', qty: 1 },
      { name: 'عصير برتقال', qty: 1 }
    ]
  },
  { id: 15, seats: 6, status: 'فارغة' }
];

export default function StaffProtectedOrdersPage() {
  const router = useRouter();
  const [tables, setTables] = useState<TableItem[]>(initialTablesData);
  const [viewMode, setViewMode] = useState<'all_tables' | 'kitchen_cards'>('all_tables');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'cooking' | 'ready' | 'empty'>('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [selectedTableModal, setSelectedTableModal] = useState<TableItem | null>(null);
  
  // Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    show: boolean;
    message: string;
    tableId: number;
    prevStatus: TableItem['status'];
  }>({ show: false, message: '', tableId: 0, prevStatus: 'فارغة' });

  // Clock state
  const [liveTime, setLiveTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('ar-PS', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime SSE listener
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/orders/stream');
      eventSource.addEventListener('connected', () => setIsRealtimeConnected(true));
      eventSource.addEventListener('order', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.eventType === 'ORDER_CREATED') {
            const incoming = payload.order;
            const tableNum = incoming.tableNumber || 1;
            setTables(prev => prev.map(t => {
              if (t.id === tableNum) {
                return {
                  ...t,
                  status: 'جديد',
                  orderId: incoming.orderNumber || incoming.id,
                  time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                  elapsedMinutes: 0,
                  customerNote: incoming.customerNote,
                  items: (incoming.items || []).map((i: { itemName: string; quantity: number; notes?: string }) => ({
                    name: i.itemName,
                    qty: i.quantity,
                    notes: i.notes,
                  }))
                };
              }
              return t;
            }));
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

  // Actions with Undo capability
  const startCooking = (tableId: number) => {
    const target = tables.find(t => t.id === tableId);
    if (!target) return;
    const prevStatus = target.status;

    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'قيد التحضير' } : t));
    setUndoToast({
      show: true,
      message: `بدأ تحضير طاولة ${tableId} في المطبخ 🔥`,
      tableId,
      prevStatus
    });
    setTimeout(() => setUndoToast(prev => prev.tableId === tableId ? { ...prev, show: false } : prev), 6000);
    if (selectedTableModal?.id === tableId) {
      setSelectedTableModal(prev => prev ? { ...prev, status: 'قيد التحضير' } : null);
    }
  };

  const markReady = (tableId: number) => {
    const target = tables.find(t => t.id === tableId);
    if (!target) return;
    const prevStatus = target.status;

    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'جاهز' } : t));
    if (soundEnabled) playOrderChime();

    setUndoToast({
      show: true,
      message: `طاولة ${tableId} جاهزة للتقديم للزبون! 🔔`,
      tableId,
      prevStatus
    });
    setTimeout(() => setUndoToast(prev => prev.tableId === tableId ? { ...prev, show: false } : prev), 6000);
    if (selectedTableModal?.id === tableId) {
      setSelectedTableModal(prev => prev ? { ...prev, status: 'جاهز' } : null);
    }
  };

  const completeAndDeliver = (tableId: number) => {
    const target = tables.find(t => t.id === tableId);
    if (!target) return;
    const prevStatus = target.status;

    setTables(prev => prev.map(t => t.id === tableId ? { 
      ...t, 
      status: 'تم التسليم',
      completedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    } : t));

    setUndoToast({
      show: true,
      message: `تم تسليم طلب طاولة ${tableId} وأرشفته بنجاح ✅`,
      tableId,
      prevStatus
    });
    setTimeout(() => setUndoToast(prev => prev.tableId === tableId ? { ...prev, show: false } : prev), 6000);
    if (selectedTableModal?.id === tableId) {
      setSelectedTableModal(null);
    }
  };

  const clearTable = (tableId: number) => {
    const target = tables.find(t => t.id === tableId);
    if (!target) return;
    const prevStatus = target.status;

    setTables(prev => prev.map(t => t.id === tableId ? {
      id: tableId,
      seats: t.seats,
      status: 'فارغة'
    } : t));

    setUndoToast({
      show: true,
      message: `تم تفريغ طاولة ${tableId} وأصبحت جاهزة للزبائن الجدد 🪑`,
      tableId,
      prevStatus
    });
    setTimeout(() => setUndoToast(prev => prev.tableId === tableId ? { ...prev, show: false } : prev), 6000);
    if (selectedTableModal?.id === tableId) {
      setSelectedTableModal(null);
    }
  };

  const handleUndo = () => {
    if (!undoToast.tableId) return;
    setTables(prev => prev.map(t => t.id === undoToast.tableId ? { ...t, status: undoToast.prevStatus } : t));
    setUndoToast({ show: false, message: '', tableId: 0, prevStatus: 'فارغة' });
  };

  const toggleItemDone = (tableId: number, itemIdx: number) => {
    setTables(prev => prev.map(t => {
      if (t.id !== tableId || !t.items) return t;
      const updated = [...t.items];
      updated[itemIdx] = { ...updated[itemIdx], done: !updated[itemIdx].done };
      return { ...t, items: updated };
    }));
    if (selectedTableModal?.id === tableId && selectedTableModal.items) {
      const updated = [...selectedTableModal.items];
      updated[itemIdx] = { ...updated[itemIdx], done: !updated[itemIdx].done };
      setSelectedTableModal({ ...selectedTableModal, items: updated });
    }
  };

  // Counts
  const occupiedTables = tables.filter(t => t.status !== 'فارغة');
  const newCount = tables.filter(t => t.status === 'جديد').length;
  const cookingCount = tables.filter(t => t.status === 'قيد التحضير').length;
  const readyCount = tables.filter(t => t.status === 'جاهز').length;
  const emptyCount = tables.filter(t => t.status === 'فارغة').length;

  const filteredTables = tables.filter(t => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'new') return t.status === 'جديد';
    if (statusFilter === 'cooking') return t.status === 'قيد التحضير';
    if (statusFilter === 'ready') return t.status === 'جاهز';
    if (statusFilter === 'empty') return t.status === 'فارغة';
    return true;
  });

  const activeOrdersForKitchen = tables.filter(t => t.status === 'جديد' || t.status === 'قيد التحضير' || t.status === 'جاهز');

  // Status style helper
  const getStatusBadge = (status: TableItem['status']) => {
    switch (status) {
      case 'جديد':
        return { 
          bg: 'bg-rose-50 text-rose-700 border border-rose-200/80', 
          border: 'border-rose-400', 
          label: 'طلب جديد', 
          dot: 'bg-rose-500 animate-pulse' 
        };
      case 'قيد التحضير':
        return { 
          bg: 'bg-amber-50 text-amber-800 border border-amber-200/80', 
          border: 'border-amber-400', 
          label: 'قيد التحضير', 
          dot: 'bg-amber-500 animate-spin' 
        };
      case 'جاهز':
        return { 
          bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80', 
          border: 'border-emerald-400', 
          label: 'جاهز للتقديم', 
          dot: 'bg-emerald-500' 
        };
      case 'محجوزة':
        return { 
          bg: 'bg-sky-50 text-sky-700 border border-sky-200/80', 
          border: 'border-sky-400', 
          label: 'محجوزة', 
          dot: 'bg-sky-500' 
        };
      case 'تم التسليم':
        return { 
          bg: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80', 
          border: 'border-indigo-400', 
          label: 'تم التسليم', 
          dot: 'bg-indigo-500' 
        };
      case 'فارغة':
      default:
        return { 
          bg: 'bg-slate-100 text-slate-500 border border-slate-200/80', 
          border: 'border-slate-200', 
          label: 'فارغة', 
          dot: 'bg-slate-400' 
        };
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col selection:bg-orange-500 selection:text-white transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`} dir="rtl">
      
      {/* 1. Professional Modern Restaurant POS Top Bar */}
      <header className={`sticky top-0 z-30 border-b shadow-xs transition-colors backdrop-blur-md ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200/90'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2">
          
          {/* Brand & Live Connection Beacon */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shadow-orange-500/20 shrink-0">
              <ChefHat size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Menus.ps POS
                </h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isRealtimeConnected 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="hidden xs:inline">{isRealtimeConnected ? 'مباشر سحابياً' : 'إعادة اتصال...'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate">
                {tables.length} طاولة · {occupiedTables.length} مشغولة · نابلس
              </p>
            </div>
          </div>

          {/* Center Mode Switch */}
          <div className={`p-1 rounded-xl border flex items-center ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200/80'
          }`}>
            <button
              onClick={() => setViewMode('all_tables')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'all_tables'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
              <span>الطاولات ({tables.length})</span>
            </button>

            <button
              onClick={() => setViewMode('kitchen_cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kitchen_cards'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ChefHat size={14} />
              <span>المطبخ ({activeOrdersForKitchen.length})</span>
            </button>
          </div>

          {/* Right Action Tools & Clock */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Clock on Desktop */}
            <div className="hidden md:flex items-center font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              {liveTime || '12:00:00 م'}
            </div>

            {/* Sound alert */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                soundEnabled
                  ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40'
                  : 'bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
              title={soundEnabled ? 'كتم التنبيه الصوتي' : 'تفعيل التنبيه الصوتي'}
            >
              {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                isDarkMode
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="تبديل المظهر النهاري/الليلي"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold"
              title="ملء الشاشة"
            >
              ⛶
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="تسجيل خروج"
            >
              <LogOut size={15} />
            </button>
          </div>

        </div>

        {/* 2. Quick Status Filters Strip */}
        <div className={`px-3 sm:px-5 py-2 border-t flex items-center justify-between gap-1 overflow-x-auto hide-scrollbar text-xs font-bold ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              الكل ({tables.length})
            </button>

            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                statusFilter === 'new'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200/80'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>جديد ({newCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('cooking')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                statusFilter === 'cooking'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200/80'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>بالطهي ({cookingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                statusFilter === 'ready'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200/80'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>جاهز ({readyCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('empty')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                statusFilter === 'empty'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              <span>فارغة ({emptyCount})</span>
            </button>
          </div>

          <button
            onClick={() => setTables(initialTablesData)}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="إعادة ضبط الطاولات"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
        </div>
      </header>

      {/* 3. MAIN CONTENT: ALL TABLES MATRIX (15 TABLES) OR KITCHEN TICKETS */}
      <main className="max-w-7xl mx-auto p-3 sm:p-5 w-full flex-1 pb-16">
        
        {/* =========================================================================
            MODE 1: ALL 15 TABLES FLOOR MATRIX
        ========================================================================= */}
        {viewMode === 'all_tables' && (
          <div>
            {/* Quick Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                طاولات الصالة (اضغط على الطاولة للتفاصيل الكاملة):
              </span>
              <span className="text-xs text-slate-400">
                {filteredTables.length} طاولة
              </span>
            </div>

            {/* Responsive Multi-Column Matrix: 3 cols on mobile, 4 on tablet, 5 on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
              {filteredTables.map((table) => {
                const badge = getStatusBadge(table.status);
                const isOccupied = table.status !== 'فارغة';
                const itemsCount = table.items?.reduce((sum, i) => sum + i.qty, 0) || 0;

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTableModal(table)}
                    className={`rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between relative shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
                      isDarkMode ? 'bg-slate-900 hover:border-orange-500/70' : 'bg-white hover:border-orange-300'
                    } ${
                      table.status === 'جديد'
                        ? 'border-rose-300 ring-2 ring-rose-400/15'
                        : table.status === 'قيد التحضير'
                        ? 'border-amber-300 ring-2 ring-amber-400/15'
                        : table.status === 'جاهز'
                        ? 'border-emerald-300 ring-2 ring-emerald-400/15'
                        : isDarkMode ? 'border-slate-800' : 'border-slate-200/80'
                    }`}
                  >
                    <div>
                      {/* Card Header: Table Number & Seats */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs flex items-center justify-center">
                            {table.id}
                          </span>
                          <span className="font-bold text-xs sm:text-sm leading-none text-slate-900 dark:text-white">
                            طاولة {table.id}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold">
                          <Armchair size={12} />
                          <span>{table.seats}</span>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <div className="mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold w-full justify-center ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span className="truncate">{badge.label}</span>
                        </span>
                      </div>

                      {/* Summary Info */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        {isOccupied ? (
                          <div className="space-y-1">
                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                              <span className="truncate font-mono">{table.orderId}</span>
                              <span className="text-orange-600 font-extrabold">{itemsCount} أصناف</span>
                            </div>
                            {table.time && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                <Clock size={11} />
                                <span>{table.time} ({table.elapsedMinutes || 1} دقيقة)</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-slate-400 py-1 font-medium text-xs">
                            جاهزة للاستقبال
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick 1-Click Action Button on Card (Fitts's Law) */}
                    {isOccupied && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {table.status === 'جديد' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startCooking(table.id);
                            }}
                            className="w-full py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
                          >
                            <UtensilsCrossed size={12} />
                            <span>بدء الطهي 🔥</span>
                          </button>
                        )}
                        {table.status === 'قيد التحضير' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markReady(table.id);
                            }}
                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
                          >
                            <CheckCircle2 size={12} />
                            <span>جاهز للتقديم ✅</span>
                          </button>
                        )}
                        {table.status === 'جاهز' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              completeAndDeliver(table.id);
                            }}
                            className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-xs"
                          >
                            <Check size={12} />
                            <span>تسليم للويتر 🚀</span>
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 2: KITCHEN ORDER TICKETS
        ========================================================================= */}
        {viewMode === 'kitchen_cards' && (
          <div>
            {/* Quick Strip for All 15 Tables at Top of Kitchen View */}
            <div className={`p-2.5 rounded-2xl mb-4 border flex items-center justify-between gap-1.5 overflow-x-auto hide-scrollbar ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
            }`}>
              <span className="text-xs font-bold text-slate-500 shrink-0 ml-1">كل الطاولات:</span>
              <div className="flex items-center gap-1 shrink-0">
                {tables.map(t => {
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTableModal(t)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                        t.status === 'جديد'
                          ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                          : t.status === 'قيد التحضير'
                          ? 'bg-amber-500 text-white font-bold'
                          : t.status === 'جاهز'
                          ? 'bg-emerald-500 text-white'
                          : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}
                      title={`طاولة ${t.id}: ${t.status}`}
                    >
                      {t.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kitchen Orders Grid */}
            {activeOrdersForKitchen.length === 0 ? (
              <div className={`border rounded-2xl p-10 text-center max-w-sm mx-auto my-8 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <ChefHat size={44} className="mx-auto mb-2 text-orange-500 opacity-60" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  لا توجد طلبات معلقة في المطبخ الآن 🎉
                </h3>
                <p className="text-xs text-slate-400">
                  جميع الوجبات تم تجهيزها وتسليمها بالكامل
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-start">
                {activeOrdersForKitchen.map((order) => {
                  const isNew = order.status === 'جديد';
                  const isCooking = order.status === 'قيد التحضير';

                  return (
                    <div
                      key={order.id}
                      className={`rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden relative ${
                        isDarkMode ? 'bg-slate-900' : 'bg-white'
                      } ${
                        isNew
                          ? 'border-rose-300'
                          : isCooking
                          ? 'border-amber-300'
                          : 'border-emerald-300'
                      }`}
                    >
                      {/* Ticket Header: Table Number & Status */}
                      <div className={`px-3 py-2 border-b flex items-center justify-between ${
                        isNew
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : isCooking
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-sm">
                            طاولة {order.id}
                          </span>
                          <span className="text-xs font-mono opacity-80">
                            {order.orderId}
                          </span>
                        </div>
                        
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80">
                          {isNew ? 'طلب جديد' : isCooking ? 'قيد الطهي' : 'جاهز'}
                        </span>
                      </div>

                      {/* Ticket Time & Note */}
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{order.time} ({order.elapsedMinutes || 1} دقيقة)</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {order.items?.length || 0} أطباق
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="p-3 space-y-1.5 flex-1">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => toggleItemDone(order.id, idx)}
                            className={`p-2 rounded-xl border text-xs transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                              item.done
                                ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-40 line-through'
                                : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-orange-400'
                            }`}
                            title="اضغط لتأكيد تجهيز الصنف"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {item.qty}
                              </span>
                              <span className="font-bold truncate text-slate-800 dark:text-slate-200">
                                {item.name}
                              </span>
                            </div>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {item.done && <Check size={11} strokeWidth={3} />}
                            </div>
                          </div>
                        ))}

                        {/* Customer note if any */}
                        {order.customerNote && (
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300 leading-tight">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">ملاحظة: </span>
                            {order.customerNote}
                          </div>
                        )}
                      </div>

                      {/* 1-Tap Action Button */}
                      <div className="p-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800">
                        {isNew && (
                          <button
                            onClick={() => startCooking(order.id)}
                            className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                          >
                            <UtensilsCrossed size={14} />
                            <span>بدء الطهي 🔥</span>
                          </button>
                        )}

                        {isCooking && (
                          <button
                            onClick={() => markReady(order.id)}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={14} />
                            <span>جاهز للتقديم ✅</span>
                          </button>
                        )}

                        {order.status === 'جاهز' && (
                          <button
                            onClick={() => completeAndDeliver(order.id)}
                            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                          >
                            <Check size={14} />
                            <span>تسليم للويتر 🚀</span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* =========================================================================
          4. TABLE DETAILS MODAL / BOTTOM SHEET
      ========================================================================= */}
      {selectedTableModal && (
        <div 
          onClick={() => setSelectedTableModal(null)}
          className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border transition-all animate-in slide-in-from-bottom-5 duration-200 ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-orange-500 text-white font-bold text-sm flex items-center justify-center">
                  {selectedTableModal.id}
                </span>
                <div>
                  <h3 className="font-bold text-base leading-none">
                    تفاصيل طاولة {selectedTableModal.id}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    السعة: {selectedTableModal.seats} مقاعد • {selectedTableModal.status}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTableModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-3.5 max-h-[60vh] overflow-y-auto">
              {selectedTableModal.status === 'فارغة' ? (
                <div className="text-center py-6 text-slate-400">
                  <Armchair size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-300">هذه الطاولة فارغة حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">يمكن للزبون مسح كود QR والطلب مباشرة</p>
                  <button
                    onClick={() => {
                      setTables(prev => prev.map(t => t.id === selectedTableModal.id ? { 
                        ...t, 
                        status: 'جديد', 
                        orderId: '#ORD-NEW', 
                        time: 'الآن', 
                        items: [{ name: 'دبل سماش برغر', qty: 1 }, { name: 'كولا', qty: 1 }] 
                      } : t));
                      setSelectedTableModal(null);
                    }}
                    className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    + فتح طلب جديد للطاولة
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400">رقم الطلب: </span>
                      <span className="font-mono font-bold text-orange-600">{selectedTableModal.orderId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">وقت الطلب: </span>
                      <span className="font-bold">{selectedTableModal.time}</span>
                    </div>
                  </div>

                  {/* Customer note if any */}
                  {selectedTableModal.customerNote && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300">
                      <span className="font-bold text-amber-600 dark:text-amber-400">ملاحظة الزبون: </span>
                      {selectedTableModal.customerNote}
                    </div>
                  )}

                  {/* Items List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2">الأصناف المطلوبة:</h4>
                    <div className="space-y-2">
                      {selectedTableModal.items?.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleItemDone(selectedTableModal.id, idx)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer ${
                            item.done
                              ? 'bg-slate-100 dark:bg-slate-800 opacity-40 line-through'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
                              {item.qty}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                          }`}>
                            {item.done && <Check size={11} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions in Modal */}
                  <div className="pt-2 flex flex-col gap-2">
                    {selectedTableModal.status === 'جديد' && (
                      <button
                        onClick={() => startCooking(selectedTableModal.id)}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <UtensilsCrossed size={14} />
                        <span>بدء تحضير الطلب في المطبخ 🔥</span>
                      </button>
                    )}

                    {selectedTableModal.status === 'قيد التحضير' && (
                      <button
                        onClick={() => markReady(selectedTableModal.id)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>جاهز للتقديم (نداء الويتر) ✅</span>
                      </button>
                    )}

                    {selectedTableModal.status === 'جاهز' && (
                      <button
                        onClick={() => completeAndDeliver(selectedTableModal.id)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>تسليم للويتر وأرشفة 🚀</span>
                      </button>
                    )}

                    <button
                      onClick={() => clearTable(selectedTableModal.id)}
                      className="w-full py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold text-xs"
                    >
                      تفريغ الطاولة وإنهاء الجلسة
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 5. Undo Floating Toast */}
      {undoToast.show && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in duration-200 max-w-md w-[92%] sm:w-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-bold truncate">{undoToast.message}</span>
          </div>

          <button
            onClick={handleUndo}
            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <Undo2 size={13} />
            <span>تراجع</span>
          </button>

          <button 
            onClick={() => setUndoToast(prev => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={13} />
          </button>
        </div>
      )}

    </div>
  );
}
