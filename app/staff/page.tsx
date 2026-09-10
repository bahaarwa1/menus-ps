'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, CheckCircle2, UtensilsCrossed, 
  Bell, BellOff, Check, RotateCcw, LogOut, ChefHat,
  Undo2, X, Armchair, LayoutGrid,
  Sun, Moon
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

  // Windows taskbar state
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login?role=staff');
      router.refresh();
    } catch {
      router.push('/login?role=staff');
    }
  };

  const toggleFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const showUndo = (tableId: number, prevStatus: TableItem['status'], message: string) => {
    setUndoToast({ show: true, message, tableId, prevStatus });
    setTimeout(() => setUndoToast(prev => ({ ...prev, show: false })), 7000);
  };

  const handleUndo = () => {
    if (!undoToast.tableId) return;
    setTables(prev => prev.map(t => t.id === undoToast.tableId ? { ...t, status: undoToast.prevStatus } : t));
    setUndoToast(prev => ({ ...prev, show: false }));
  };

  // Status transitions
  const startCooking = (tableId: number) => {
    const t = tables.find(item => item.id === tableId);
    if (!t) return;
    setTables(prev => prev.map(item => item.id === tableId ? { ...item, status: 'قيد التحضير' } : item));
    showUndo(tableId, t.status, `تم بدء تحضير طلب طاولة ${tableId}`);
    if (selectedTableModal?.id === tableId) {
      setSelectedTableModal(prev => prev ? { ...prev, status: 'قيد التحضير' } : null);
    }
  };

  const markReady = (tableId: number) => {
    const t = tables.find(item => item.id === tableId);
    if (!t) return;
    setTables(prev => prev.map(item => item.id === tableId ? { ...item, status: 'جاهز' } : item));
    showUndo(tableId, t.status, `تم تجهيز طلب طاولة ${tableId} (نداء الويتر)`);
    if (selectedTableModal?.id === tableId) {
      setSelectedTableModal(prev => prev ? { ...prev, status: 'جاهز' } : null);
    }
  };

  const completeAndDeliver = (tableId: number) => {
    const t = tables.find(item => item.id === tableId);
    if (!t) return;
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setTables(prev => prev.map(item => item.id === tableId ? { ...item, status: 'تم التسليم', completedAt: nowTime } : item));
    showUndo(tableId, t.status, `تم تسليم طلب طاولة ${tableId} للويتر`);
    if (selectedTableModal?.id === tableId) {
      setSelectedTableModal(prev => prev ? { ...prev, status: 'تم التسليم' } : null);
    }
  };

  const clearTable = (tableId: number) => {
    const t = tables.find(item => item.id === tableId);
    if (!t) return;
    setTables(prev => prev.map(item => item.id === tableId ? { ...item, status: 'فارغة', items: [], orderId: undefined } : item));
    showUndo(tableId, t.status, `تم تفريغ طاولة ${tableId}`);
    if (selectedTableModal?.id === tableId) {
      setSelectedTableModal(null);
    }
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
        return { bg: 'bg-rose-500 text-white', border: 'border-rose-300 ring-rose-400', label: 'طلب جديد', dot: 'bg-rose-500 animate-pulse' };
      case 'قيد التحضير':
        return { bg: 'bg-amber-500 text-slate-950', border: 'border-amber-300 ring-amber-400', label: 'قيد التحضير', dot: 'bg-amber-500 animate-spin' };
      case 'جاهز':
        return { bg: 'bg-emerald-500 text-white', border: 'border-emerald-300 ring-emerald-400', label: 'جاهز للتقديم', dot: 'bg-emerald-400' };
      case 'محجوزة':
        return { bg: 'bg-sky-500 text-white', border: 'border-sky-300 ring-sky-400', label: 'محجوزة', dot: 'bg-sky-400' };
      case 'تم التسليم':
        return { bg: 'bg-indigo-600 text-white', border: 'border-indigo-300 ring-indigo-400', label: 'تم التسليم', dot: 'bg-indigo-400' };
      case 'فارغة':
      default:
        return { bg: 'bg-slate-200 text-slate-700', border: 'border-slate-200 ring-slate-300', label: 'فارغة', dot: 'bg-slate-400' };
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col selection:bg-orange-500 selection:text-white transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`} dir="rtl">
      
      {/* 1. Ultra-Clean Top Bar */}
      <header className={`sticky top-0 z-30 border-b shadow-xs transition-colors ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200/90'
      } backdrop-blur-md`}>
        
        {/* Mica Bar for Desktop */}
        <div className={`hidden md:flex px-4 py-1.5 border-b items-center justify-between text-xs select-none ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">🪟</span>
            <span className="font-extrabold text-xs">Menus.ps POS Pro — إدارة الصالة وشاشة المطبخ (15 طاولة)</span>
            <span className={`font-bold text-[11px] flex items-center gap-1 ${isRealtimeConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isRealtimeConnected ? 'مباشر سحابياً' : 'إعادة اتصال...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>فرع نابلس الرئيسي</span>
            <span>•</span>
            <span>15 طاولة</span>
            <button
              onClick={toggleFullscreen}
              className="px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] font-bold"
              title="ملء الشاشة"
            >
              ملء الشاشة ⛶
            </button>
          </div>
        </div>

        {/* Primary Header Strip */}
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 flex items-center justify-between gap-1.5">
          
          {/* Logo & Quick Stats */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
              👨‍🍳
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-black truncate">
                  شاشة الطاولات والمطبخ
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
                {tables.length} طاولات • {occupiedTables.length} مشغولة • {readyCount} جاهزة
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* View Mode Toggle: All Tables vs Kitchen Cards */}
            <div className={`p-0.5 rounded-xl border flex items-center ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setViewMode('all_tables')}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                  viewMode === 'all_tables'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-orange-500'
                }`}
                title="عرض جميع الـ 15 طاولة في الصالة"
              >
                <LayoutGrid size={13} />
                <span className="hidden xs:inline sm:inline">كل الطاولات ({tables.length})</span>
                <span className="xs:hidden sm:hidden">الطاولات</span>
              </button>

              <button
                onClick={() => setViewMode('kitchen_cards')}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                  viewMode === 'kitchen_cards'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-orange-500'
                }`}
                title="عرض طلبات المطبخ النشطة"
              >
                <ChefHat size={13} />
                <span className="hidden xs:inline sm:inline">المطبخ ({activeOrdersForKitchen.length})</span>
                <span className="xs:hidden sm:hidden">المطبخ</span>
              </button>
            </div>

            {/* Sound alert */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all ${
                soundEnabled
                  ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/40'
                  : 'bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
              title="تفعيل/كتم الصوت"
            >
              {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all ${
                isDarkMode
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title="تبديل المظهر النهاري/الليلي"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="تسجيل خروج"
            >
              <LogOut size={15} />
            </button>
          </div>

        </div>

        {/* 2. Quick Status Filters Strip */}
        <div className={`px-2.5 sm:px-4 py-1.5 border-t flex items-center justify-between gap-1 overflow-x-auto scrollbar-none text-xs font-black ${
          isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200/70'
        }`}>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              الكل ({tables.length})
            </button>

            <button
              onClick={() => setStatusFilter('new')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'new'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>جديد ({newCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('cooking')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'cooking'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>بالطهي ({cookingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'ready'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>جاهز ({readyCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('empty')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                statusFilter === 'empty'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300'
              }`}
            >
              <span>فارغة ({emptyCount})</span>
            </button>
          </div>

          <button
            onClick={() => setTables(initialTablesData)}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-0.5 shrink-0 px-1"
            title="إعادة تعيين الطاولات"
          >
            <RotateCcw size={11} />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
        </div>

      </header>

      {/* 3. MAIN CONTENT: ALL TABLES MATRIX (15 TABLES) OR 2-COLUMN KITCHEN CARDS */}
      <main className="max-w-7xl mx-auto p-2 sm:p-4 w-full flex-1 pb-16">
        
        {/* =========================================================================
            MODE 1: ALL 15 TABLES FLOOR MATRIX (شبكة جميع طاولات المطعم الـ 15 معاً)
        ========================================================================= */}
        {viewMode === 'all_tables' && (
          <div>
            {/* Quick Helper Subtitle */}
            <div className="flex items-center justify-between mb-2 px-1 text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300">
                جميع طاولات الصالة الـ 15 (اضغط أي طاولة لعرض تفاصيلها):
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {filteredTables.length} طاولة معروضة
              </span>
            </div>

            {/* Responsive Multi-Column Matrix: 3 cols on mobile, 5 cols on tablet/desktop */}
            {/* IN 3 to 5 COLUMNS, ALL 15 TABLES FIT RIGHT ON YOUR SCREEN! */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
              {filteredTables.map((table) => {
                const badge = getStatusBadge(table.status);
                const isOccupied = table.status !== 'فارغة';
                const itemsCount = table.items?.reduce((sum, i) => sum + i.qty, 0) || 0;

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTableModal(table)}
                    className={`rounded-xl sm:rounded-2xl p-2 sm:p-3 border transition-all cursor-pointer flex flex-col justify-between relative shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                      isDarkMode ? 'bg-slate-900 hover:border-orange-500/70' : 'bg-white hover:border-orange-400'
                    } ${
                      table.status === 'جديد'
                        ? 'border-rose-400/80 ring-2 ring-rose-400/20'
                        : table.status === 'قيد التحضير'
                        ? 'border-amber-400/80 ring-2 ring-amber-400/20'
                        : table.status === 'جاهز'
                        ? 'border-emerald-400/80 ring-2 ring-emerald-400/20'
                        : isDarkMode ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    {/* Table Header: Number & Seats */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs sm:text-sm flex items-center justify-center">
                          {table.id}
                        </span>
                        <span className="font-black text-xs sm:text-sm leading-none">
                          طاولة {table.id}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-0.5 text-[10px] text-slate-400 font-bold">
                        <Armchair size={11} />
                        <span>{table.seats}</span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="my-1">
                      <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black w-full justify-center ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span className="truncate">{badge.label}</span>
                      </span>
                    </div>

                    {/* Quick Info & Items Count */}
                    <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px]">
                      {isOccupied ? (
                        <div className="space-y-0.5">
                          <div className="flex justify-between font-bold text-slate-600 dark:text-slate-300">
                            <span className="truncate">{table.orderId || 'طلب نشط'}</span>
                            <span className="text-orange-500 font-black">{itemsCount} أصناف</span>
                          </div>
                          {table.time && (
                            <div className="flex items-center gap-0.5 text-slate-400">
                              <Clock size={9} />
                              <span>{table.time} ({table.elapsedMinutes || 1}د)</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 py-1 font-bold">
                          جاهزة للاستقبال
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 2: KITCHEN ORDER CARDS (عالية الكثافة - عمودين على الموبايل 2-Columns)
        ========================================================================= */}
        {viewMode === 'kitchen_cards' && (
          <div>
            {/* Quick Strip for All 15 Tables at Top of Kitchen View */}
            <div className={`p-2 rounded-xl mb-3 border flex items-center justify-between gap-1 overflow-x-auto scrollbar-none ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-black text-slate-500 shrink-0 ml-1">كل الطاولات (15):</span>
              <div className="flex items-center gap-1 shrink-0">
                {tables.map(t => {
                  const b = getStatusBadge(t.status);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTableModal(t)}
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
                        t.status === 'جديد'
                          ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                          : t.status === 'قيد التحضير'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : t.status === 'جاهز'
                          ? 'bg-emerald-500 text-white'
                          : isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}
                      title={`طاولة ${t.id}: ${b.label}`}
                    >
                      {t.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kitchen Orders Grid: 2 COLUMNS ON MOBILE (GRID-COLS-2) */}
            {activeOrdersForKitchen.length === 0 ? (
              <div className={`border rounded-2xl p-8 text-center max-w-sm mx-auto my-8 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <ChefHat size={40} className="mx-auto mb-2 text-orange-500 opacity-60" />
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1">
                  لا توجد طلبات معلقة في المطبخ الآن 🎉
                </h3>
                <p className="text-xs text-slate-400">
                  جميع الطلبات تم تجهيزها وتسليمها بالكامل
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 items-start">
                {activeOrdersForKitchen.map((order) => {
                  const isNew = order.status === 'جديد';
                  const isCooking = order.status === 'قيد التحضير';
                  const isReady = order.status === 'جاهز';

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl sm:rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden relative ${
                        isDarkMode ? 'bg-slate-900' : 'bg-white'
                      } ${
                        isNew
                          ? 'border-rose-400 shadow-rose-500/10'
                          : isCooking
                          ? 'border-amber-400 shadow-amber-500/10'
                          : 'border-emerald-400 shadow-emerald-500/10'
                      }`}
                    >
                      {/* Ticket Header: Table Number & Status */}
                      <div className={`px-2 py-1.5 sm:px-2.5 sm:py-2 border-b flex items-center justify-between ${
                        isNew
                          ? 'bg-rose-500 text-white border-rose-600'
                          : isCooking
                          ? 'bg-amber-400 text-slate-950 border-amber-500'
                          : 'bg-emerald-500 text-white border-emerald-600'
                      }`}>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-black text-xs sm:text-sm truncate">
                            طاولة {order.id}
                          </span>
                          <span className="text-[10px] opacity-90 font-mono hidden sm:inline">
                            {order.orderId}
                          </span>
                        </div>
                        
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-black/20 shrink-0">
                          {isNew ? 'جديد' : isCooking ? 'طهي' : 'جاهز'}
                        </span>
                      </div>

                      {/* Ticket Time & Note */}
                      <div className="px-2 py-1 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-0.5">
                          <Clock size={9} />
                          <span>{order.time} ({order.elapsedMinutes || 1}د)</span>
                        </span>
                        <span className="font-mono text-[9px] sm:hidden">{order.orderId}</span>
                      </div>

                      {/* Items List - Touch to Strike Checkmarks */}
                      <div className="p-2 space-y-1 flex-1">
                        {order.items?.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => toggleItemDone(order.id, idx)}
                            className={`p-1.5 rounded-lg border text-[11px] transition-all flex items-center justify-between gap-1 cursor-pointer ${
                              item.done
                                ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-40 line-through'
                                : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-orange-400'
                            }`}
                            title="اضغط للشطب"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-4 h-4 rounded bg-orange-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                {item.qty}
                              </span>
                              <span className="font-bold leading-tight truncate text-slate-800 dark:text-slate-200">
                                {item.name}
                              </span>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                              item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {item.done && <Check size={9} strokeWidth={3} />}
                            </div>
                          </div>
                        ))}

                        {/* Customer note if any */}
                        {order.customerNote && (
                          <div className="p-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded text-[9px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-300 leading-tight">
                            <span className="text-amber-600 dark:text-amber-400 font-black">ملاحظة: </span>
                            {order.customerNote}
                          </div>
                        )}
                      </div>

                      {/* 1-Tap Action Button */}
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800">
                        {isNew && (
                          <button
                            onClick={() => startCooking(order.id)}
                            className="w-full py-1.5 px-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                          >
                            <UtensilsCrossed size={12} />
                            <span>بدء الطهي 🔥</span>
                          </button>
                        )}

                        {isCooking && (
                          <button
                            onClick={() => markReady(order.id)}
                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={12} />
                            <span>جاهز للتقديم ✅</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => completeAndDeliver(order.id)}
                            className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                          >
                            <Check size={12} />
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
          4. TABLE DETAILS MODAL / BOTTOM SHEET (نافذة تفاصيل الطاولة السريعة)
      ========================================================================= */}
      {selectedTableModal && (
        <div 
          onClick={() => setSelectedTableModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl border transition-all animate-in slide-in-from-bottom-5 duration-200 ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black text-sm flex items-center justify-center">
                  {selectedTableModal.id}
                </span>
                <div>
                  <h3 className="font-black text-base leading-none">
                    تفاصيل طاولة {selectedTableModal.id}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
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
            <div className="py-3 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedTableModal.status === 'فارغة' ? (
                <div className="text-center py-6 text-slate-400">
                  <Armchair size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-sm">هذه الطاولة فارغة حالياً</p>
                  <p className="text-xs mt-1">يمكن للزبون مسح كود QR والطلب مباشرة</p>
                  <button
                    onClick={() => {
                      setTables(prev => prev.map(t => t.id === selectedTableModal.id ? { ...t, status: 'جديد', orderId: '#ORD-NEW', time: 'الآن', items: [{ name: 'دبل سماش برغر', qty: 1 }, { name: 'كولا', qty: 1 }] } : t));
                      setSelectedTableModal(null);
                    }}
                    className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black"
                  >
                    + فتح طلب جديد للطاولة
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400">رقم الطلب: </span>
                      <span className="font-mono font-bold text-orange-500">{selectedTableModal.orderId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">وقت الطلب: </span>
                      <span className="font-bold">{selectedTableModal.time}</span>
                    </div>
                  </div>

                  {/* Customer note if any */}
                  {selectedTableModal.customerNote && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300">
                      <span className="font-black text-amber-600 dark:text-amber-400">ملاحظة الزبون: </span>
                      {selectedTableModal.customerNote}
                    </div>
                  )}

                  {/* Items List */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 mb-1.5">الأصناف المطلوبة:</h4>
                    <div className="space-y-1.5">
                      {selectedTableModal.items?.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleItemDone(selectedTableModal.id, idx)}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer ${
                            item.done
                              ? 'bg-slate-100 dark:bg-slate-800 opacity-40 line-through'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-orange-500 text-white font-black text-xs flex items-center justify-center">
                              {item.qty}
                            </span>
                            <span className="font-bold">{item.name}</span>
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
                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <UtensilsCrossed size={14} />
                        <span>بدء تحضير الطلب في المطبخ 🔥</span>
                      </button>
                    )}

                    {selectedTableModal.status === 'قيد التحضير' && (
                      <button
                        onClick={() => markReady(selectedTableModal.id)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>جاهز للتقديم (نداء الويتر) ✅</span>
                      </button>
                    )}

                    {selectedTableModal.status === 'جاهز' && (
                      <button
                        onClick={() => completeAndDeliver(selectedTableModal.id)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>تسليم للويتر وأرشفة 🚀</span>
                      </button>
                    )}

                    <button
                      onClick={() => clearTable(selectedTableModal.id)}
                      className="w-full py-2 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold text-xs"
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
        <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-3 sm:px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in duration-200 max-w-lg w-[94%] sm:w-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-black truncate">{undoToast.message}</span>
          </div>

          <button
            onClick={handleUndo}
            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg text-xs font-black flex items-center gap-1 shrink-0"
          >
            <Undo2 size={12} />
            <span>تراجع</span>
          </button>

          <button 
            onClick={() => setUndoToast(prev => ({ ...prev, show: false }))}
            className="text-slate-400 hover:text-white p-1"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 6. Windows Taskbar for Desktop */}
      <footer className="hidden md:flex fixed bottom-0 inset-x-0 z-40 h-11 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-4 items-center justify-between text-white shadow-2xl select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className="px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs font-black bg-sky-600 hover:bg-sky-500 text-white"
          >
            <span>🪟</span>
            <span>ابدأ</span>
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white font-bold text-xs flex items-center gap-1.5">
            <span>👨‍🍳</span>
            <span>الصالة والمطبخ (15 طاولة)</span>
          </span>
          <Link href="/demo" className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs">
            <span>🏠 لوحة الإدارة</span>
          </Link>
          <Link href="/m" target="_blank" className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white font-bold text-xs">
            <span>📱 منيو الزبون</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-emerald-400 font-bold">🟢 سحابي نشط</span>
          <div className="text-left font-mono text-xs text-white font-bold px-1">
            {liveTime || '12:00:00 م'}
          </div>
        </div>
      </footer>

    </div>
  );
}
