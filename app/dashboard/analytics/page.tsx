'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Calendar, DollarSign, ShoppingBag,
  Clock, ArrowUpRight, ArrowDownRight, RefreshCw,
  Printer, Download, ChevronDown, ChevronUp, Check, ChefHat,
  BarChart3, Users, Sparkles, Filter, Utensils,
  Search, Eye, AlertCircle, FileSpreadsheet, Layers, ListFilter
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export type TimeRangePreset = 
  | 'today' 
  | 'yesterday' 
  | 'last7' 
  | 'last30' 
  | 'thisMonth' 
  | 'lastMonth' 
  | 'all' 
  | 'custom';

interface OrderItemSummary {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  extras?: string[];
  notes?: string;
}

interface AnalyticsOrder {
  id: string;
  orderNumber: string;
  tableNumber: number;
  status: string;
  totalAmount: number;
  customerNote?: string;
  createdAt: string;
  items: OrderItemSummary[];
}

export interface DayAnalysis {
  dateKey: string; // YYYY-MM-DD
  dayName: string; // e.g. الجمعة
  formattedDate: string; // e.g. 25 سبتمبر 2026
  totalSales: number;
  ordersCount: number;
  avgTicket: number;
  totalItems: number;
  topDish: string;
  orders: AnalyticsOrder[];
  itemsMap: { name: string; qty: number; revenue: number }[];
}

export default function ProductionAnalyticsPage() {
  const [preset, setPreset] = useState<TimeRangePreset>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [restaurantSlug, setRestaurantSlug] = useState('sh-manoosha');
  const [restaurantName, setRestaurantName] = useState('مطعم وكافيه شيشة ومنقوشة');
  const [branchId, setBranchId] = useState<string>('a84f5ec9-714f-44fe-980d-82a78eb4f9b9');
  const [allOrders, setAllOrders] = useState<AnalyticsOrder[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'charts'>('cards');

  // 1. Initial Load & Session Identification
  useEffect(() => {
    let slug = 'sh-manoosha';
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const s = p.get('created') || p.get('slug') || p.get('restaurant');
      if (s) slug = s;
    }
    setRestaurantSlug(slug);

    // Fetch session
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.restaurantSlug) setRestaurantSlug(data.user.restaurantSlug);
        if (data.user?.restaurantName) setRestaurantName(data.user.restaurantName);
        if (data.user?.branchId) setBranchId(data.user.branchId);
      })
      .catch(() => {});

    loadOrders(slug);
  }, []);

  // 2. Fetch real orders from database API
  const loadOrders = async (slugToUse?: string, isBackground = false) => {
    if (isBackground) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const slug = slugToUse || restaurantSlug;
      const res = await fetch(`/api/v1/analytics?slug=${encodeURIComponent(slug)}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setAllOrders(data.orders);
        if (data.branchId) setBranchId(data.branchId);
      }
    } catch (err) {
      console.error('Failed to load real analytics orders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 3. Compute Date Filter Boundaries
  const dateRangeBounds = useMemo(() => {
    const now = new Date();

    if (preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end, label: 'اليوم' };
    }

    if (preset === 'yesterday') {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      return { start, end, label: 'أمس' };
    }

    if (preset === 'last7') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      return { start, end, label: 'آخر 7 أيام' };
    }

    if (preset === 'last30') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      return { start, end, label: 'آخر 30 يوماً' };
    }

    if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, label: 'هذا الشهر' };
    }

    if (preset === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, label: 'الشهر الماضي' };
    }

    if (preset === 'custom') {
      const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
      const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : new Date();
      return { start, end, label: `من ${customStart || 'البداية'} إلى ${customEnd || 'الآن'}` };
    }

    // all time
    return { start: new Date(0), end: new Date(8640000000000000), label: 'كل الوقت' };
  }, [preset, customStart, customEnd]);

  // 4. Filter Orders strictly by selected Date Range
  const filteredOrders = useMemo(() => {
    const { start, end } = dateRangeBounds;
    return allOrders.filter((order) => {
      if (!order.createdAt) return true;
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });
  }, [allOrders, dateRangeBounds]);

  // 5. Build Day-by-Day Breakdown (تحليلات يوم بيوم تحت بعض كقائمة)
  const dailyBreakdown: DayAnalysis[] = useMemo(() => {
    const dayMap = new Map<string, {
      dateKey: string;
      dateObj: Date;
      orders: AnalyticsOrder[];
    }>();

    filteredOrders.forEach((o) => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      // Group by local calendar date (YYYY-MM-DD)
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;

      const existing = dayMap.get(key) || { dateKey: key, dateObj: d, orders: [] };
      existing.orders.push(o);
      dayMap.set(key, existing);
    });

    // Sort days descending (newest day first)
    const sortedDays = Array.from(dayMap.values()).sort(
      (a, b) => b.dateObj.getTime() - a.dateObj.getTime()
    );

    return sortedDays.map((entry) => {
      const d = entry.dateObj;
      const dayName = d.toLocaleDateString('ar-SA', { weekday: 'long' });
      const formattedDate = d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
      const orders = entry.orders;
      const ordersCount = orders.length;
      const totalSales = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const avgTicket = ordersCount > 0 ? Math.round((totalSales / ordersCount) * 10) / 10 : 0;

      let totalItems = 0;
      const dishCounts = new Map<string, { name: string; qty: number; revenue: number }>();
      orders.forEach((o) => {
        (o.items || []).forEach((it) => {
          const q = Number(it.quantity) || 1;
          const p = Number(it.price) || 0;
          totalItems += q;
          const curr = dishCounts.get(it.name) || { name: it.name, qty: 0, revenue: 0 };
          curr.qty += q;
          curr.revenue += (it.total || q * p);
          dishCounts.set(it.name, curr);
        });
      });

      const itemsMap = Array.from(dishCounts.values()).sort((a, b) => b.qty - a.qty);
      const topDish = itemsMap[0]?.name || '-';

      return {
        dateKey: entry.dateKey,
        dayName,
        formattedDate,
        totalSales,
        ordersCount,
        avgTicket,
        totalItems,
        topDish,
        orders: orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        itemsMap,
      };
    });
  }, [filteredOrders]);

  // Set default expanded state for the first 2 days
  useEffect(() => {
    if (dailyBreakdown.length > 0 && Object.keys(expandedDays).length === 0) {
      const initial: Record<string, boolean> = {};
      dailyBreakdown.forEach((d, idx) => {
        initial[d.dateKey] = idx < 2; // Expand the first 2 days by default
      });
      setExpandedDays(initial);
    }
  }, [dailyBreakdown, expandedDays]);

  const toggleDayExpand = (dateKey: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const expandAllDays = () => {
    const allExp: Record<string, boolean> = {};
    dailyBreakdown.forEach((d) => {
      allExp[d.dateKey] = true;
    });
    setExpandedDays(allExp);
  };

  const collapseAllDays = () => {
    const allColl: Record<string, boolean> = {};
    dailyBreakdown.forEach((d) => {
      allColl[d.dateKey] = false;
    });
    setExpandedDays(allColl);
  };

  // 6. Overall Totals
  const overallTotals = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const avgTicket = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 10) / 10 : 0;
    
    let totalItems = 0;
    filteredOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        totalItems += Number(it.quantity) || 1;
      });
    });

    const activeDaysCount = dailyBreakdown.length;
    const avgDailyRevenue = activeDaysCount > 0 ? Math.round(totalRevenue / activeDaysCount) : 0;

    return {
      totalOrders,
      totalRevenue,
      avgTicket,
      totalItems,
      activeDaysCount,
      avgDailyRevenue,
    };
  }, [filteredOrders, dailyBreakdown]);

  // 7. Rich Excel / CSV Export (المبيعات اليومية + تفاصيل الطلبات)
  const exportExcel = () => {
    if (filteredOrders.length === 0) {
      alert('لا توجد بيانات لتصديرها في هذه الفترة');
      return;
    }

    const lines: string[] = [];

    // Header Meta
    lines.push(`"تقرير المبيعات والتحليلات اليومية المفصلة - ${restaurantName}"`);
    lines.push(`"الفترة المحددة: ${dateRangeBounds.label}","تاريخ استخراج التقرير: ${new Date().toLocaleString('ar-SA')}"`);
    lines.push(`"إجمالي المبيعات المحققة: ${overallTotals.totalRevenue} ₪","إجمالي عدد الطلبات: ${overallTotals.totalOrders}","متوسط الفاتورة: ${overallTotals.avgTicket} ₪","الأيام النشطة: ${overallTotals.activeDaysCount} يوم"`);
    lines.push('');

    // SECTION 1: Day by Day Summary (ملخص يوم بيوم)
    lines.push('--- [1] جدول ملخص المبيعات اليومية (يوم بيوم) ---');
    lines.push('التاريخ,اليوم,إجمالي المبيعات (₪),عدد الطلبات,متوسط الفاتورة (₪),عدد الأصناف المباعة,أكثر صنف مبيعاً في هذا اليوم');
    dailyBreakdown.forEach((day) => {
      lines.push(
        `"${day.dateKey}","${day.dayName}","${day.totalSales}","${day.ordersCount}","${day.avgTicket}","${day.totalItems}","${(day.topDish || '-').replace(/"/g, '""')}"`
      );
    });
    lines.push('');

    // SECTION 2: All Detailed Orders (سجل تفاصيل جميع الفواتير والطلبات)
    lines.push('--- [2] سجل تفاصيل جميع الطلبات والوجبات ---');
    lines.push('رقم الطلب,التاريخ والوقت,اليوم,رقم الطاولة,الحالة,إجمالي الفاتورة (₪),الأصناف المطلوبة والكميات,ملاحظات الزبون');
    filteredOrders.forEach((o) => {
      const d = o.createdAt ? new Date(o.createdAt) : null;
      const dateStr = d ? d.toLocaleDateString('ar-SA') : '';
      const timeStr = d ? d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '';
      const dayName = d ? d.toLocaleDateString('ar-SA', { weekday: 'long' }) : '';
      const itemsStr = o.items.map((it) => `${it.quantity}x ${it.name} (${it.total}₪)`).join(' | ');

      lines.push(
        `"${o.orderNumber}","${dateStr} ${timeStr}","${dayName}","طاولة ${o.tableNumber}","${o.status}","${o.totalAmount}","${itemsStr.replace(/"/g, '""')}","${(o.customerNote || '').replace(/"/g, '""')}"`
      );
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_المبيعات_اليومي_${restaurantSlug}_${preset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isManoosha = restaurantSlug === 'sh-manoosha';
  const brandPrimary = isManoosha ? '#7A1C30' : '#f97316';
  const brandGold = isManoosha ? '#C28B3E' : '#fb923c';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 print:p-0 print:space-y-4 print:max-w-none" dir="rtl">
      
      {/* ─── PRINT-ONLY OFFICIAL HEADER ─── */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{restaurantName}</h1>
            <h2 className="text-base font-bold text-slate-700 mt-1">تقرير المبيعات والتحليلات اليومية المفصلة (يوم بيوم)</h2>
          </div>
          <div className="text-left text-xs font-bold text-slate-700 space-y-0.5">
            <div>تاريخ إصدار التقرير: {new Date().toLocaleDateString('ar-SA')} - {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>الفترة المشمولة: {dateRangeBounds.label}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4 pt-3 border-t border-slate-300 text-xs">
          <div className="p-2 border rounded bg-slate-50">إجمالي المبيعات: <strong className="text-base font-black block text-slate-900">{overallTotals.totalRevenue} ₪</strong></div>
          <div className="p-2 border rounded bg-slate-50">عدد الطلبات: <strong className="text-base font-black block text-slate-900">{overallTotals.totalOrders} طلب</strong></div>
          <div className="p-2 border rounded bg-slate-50">متوسط الفاتورة: <strong className="text-base font-black block text-slate-900">{overallTotals.avgTicket} ₪</strong></div>
          <div className="p-2 border rounded bg-slate-50">الأصناف المباعة: <strong className="text-base font-black block text-slate-900">{overallTotals.totalItems} صنف</strong></div>
        </div>
      </div>

      {/* ─── 1. TOP HEADER & CONTROLS (SCREEN ONLY) ─── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span 
                className="w-10 h-10 rounded-xl text-white shadow-xs flex items-center justify-center shrink-0" 
                style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandGold})` }}
              >
                <BarChart3 size={22} />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  التحليلات والمبيعات اليومية المفصلة
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  عرض تحليلات الإيرادات يوم بيوم ومتابعة الأرباح مباشرة — <strong className="text-slate-800">{restaurantName}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Refresh */}
            <button
              onClick={() => loadOrders(restaurantSlug, true)}
              disabled={isRefreshing || isLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs"
              title="تحديث البيانات المباشرة الآن"
            >
              <RefreshCw size={14} className={isRefreshing || isLoading ? 'animate-spin text-orange-500' : 'text-slate-600'} />
              <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث مباشر'}</span>
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={exportExcel}
              disabled={filteredOrders.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              title="تصدير تقرير الإكسل المفصل بترميز UTF-8 سليم"
            >
              <FileSpreadsheet size={15} />
              <span>تصدير Excel / CSV</span>
            </button>

            {/* Print Report */}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer shadow-sm"
              title="طباعة التقرير بصيغة ورقية أو حفظ PDF"
            >
              <Printer size={15} />
              <span>طباعة التقرير (Print / PDF)</span>
            </button>
          </div>
        </div>

        {/* Time Filters Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            <span className="text-xs font-black text-slate-500 shrink-0 ml-1 flex items-center gap-1">
              <Calendar size={14} />
              الفترة:
            </span>
            {[
              { id: 'all', label: 'كل الوقت (سجل كامل)' },
              { id: 'today', label: 'اليوم' },
              { id: 'yesterday', label: 'أمس' },
              { id: 'last7', label: 'آخر 7 أيام' },
              { id: 'last30', label: 'آخر 30 يوماً' },
              { id: 'thisMonth', label: 'هذا الشهر' },
              { id: 'lastMonth', label: 'الشهر الماضي' },
              { id: 'custom', label: 'فترة مخصصة 📅' },
            ].map((tab) => {
              const active = preset === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPreset(tab.id as TimeRangePreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'text-white shadow-xs'
                      : 'bg-slate-100/90 hover:bg-slate-200 text-slate-700'
                  }`}
                  style={active ? { backgroundColor: brandPrimary } : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Pickers */}
          {preset === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/90"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">من:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold">إلى:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── 2. OVERALL PERIOD METRICS CARDS (SCREEN ONLY) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
        {/* Total Real Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
              style={{ background: isManoosha ? '#FBF2F4' : '#FFF7ED', color: brandPrimary }}
            >
              ₪
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              إجمالي الفترة
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {overallTotals.totalRevenue.toLocaleString('ar-SA')} ₪
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            إجمالي المبيعات المحققة
          </div>
        </div>

        {/* Total Orders Count */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg bg-blue-50 text-blue-600">
              📦
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {overallTotals.activeDaysCount} أيام مبيعات
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {overallTotals.totalOrders.toLocaleString('ar-SA')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            إجمالي عدد الطلبات المسجلة
          </div>
        </div>

        {/* Average Ticket Value */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg bg-amber-50 text-amber-600">
              🧾
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              لكل طلب
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {overallTotals.avgTicket} ₪
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            متوسط قيمة الفاتورة
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg bg-emerald-50 text-emerald-600">
              🍽️
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              وجبات وأصناف
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {overallTotals.totalItems.toLocaleString('ar-SA')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            إجمالي القطع والأصناف المباعة
          </div>
        </div>
      </div>

      {/* ─── 3. VIEW MODE SWITCHER & EXPAND CONTROLS (SCREEN ONLY) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
        <div>
          <h2 className="font-black text-base text-slate-900 flex items-center gap-2">
            <span>📋</span>
            <span>التحليلات والمبيعات المفصلة (يوم بيوم تحت بعض)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            عرض كل يوم بشكل مستقل مع تفاصيل إيراداته، عدد طلباته، والأصناف المباعة فيه
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white shadow-2xs text-slate-900 font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              قائمة الأيام (كروت تفصيلية)
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-slate-900 font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جدول ملخص الأيام
            </button>
          </div>

          {/* Expand / Collapse All */}
          {viewMode === 'cards' && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={expandAllDays}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition-colors cursor-pointer"
                title="فتح تفاصيل كل الأيام"
              >
                توسيع الكل
              </button>
              <button
                onClick={collapseAllDays}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 transition-colors cursor-pointer"
                title="طي تفاصيل كل الأيام"
              >
                طي الكل
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── 4. DAY-BY-DAY DETAILED LIST (CARDS VIEW) ─── */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400 font-bold">
              جاري تحميل وتجميع التحليلات اليومية...
            </div>
          ) : dailyBreakdown.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-xs">
              <span className="text-4xl block mb-2">📅</span>
              <h3 className="font-black text-slate-800 text-sm mb-1">
                لا توجد طلبات مسجلة في هذا النطاق الزمني
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                اختر فترة زمنية أخرى مثل "كل الوقت" لعرض الأيام التي تمت فيها مبيعات سابقة.
              </p>
            </div>
          ) : (
            dailyBreakdown.map((day, idx) => {
              const isExpanded = expandedDays[day.dateKey] ?? false;

              return (
                <div
                  key={day.dateKey}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all print:border print:border-slate-300 print:shadow-none print:break-inside-avoid print:mb-4"
                >
                  {/* Day Card Header */}
                  <div 
                    onClick={() => toggleDayExpand(day.dateKey)}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors border-b border-slate-100"
                  >
                    {/* Date info */}
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0"
                        style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandGold})` }}
                      >
                        {day.dayName.slice(0, 3)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-slate-900">
                            {day.dayName}، {day.formattedDate}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                            {day.dateKey}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          أعلى صنف طلباً في هذا اليوم: <strong className="text-slate-800">{day.topDish}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Day Financial & Metrics Badges */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Revenue Badge */}
                      <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                        <span className="text-emerald-600 font-bold">💰 المبيعات:</span>
                        <span className="text-sm font-black text-emerald-900">{day.totalSales.toLocaleString('ar-SA')} ₪</span>
                      </div>

                      {/* Orders Count Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-black flex items-center gap-1.5">
                        <span className="text-blue-600 font-bold">📦 الطلبات:</span>
                        <span className="font-black text-blue-900">{day.ordersCount}</span>
                      </div>

                      {/* Avg Ticket Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">🧾 متوسط الفاتورة:</span>
                        <span className="font-black text-amber-900">{day.avgTicket} ₪</span>
                      </div>

                      {/* Items Count Badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-800 text-xs font-black flex items-center gap-1.5">
                        <span className="text-purple-600 font-bold">🍽️ القطع المباعة:</span>
                        <span className="font-black text-purple-900">{day.totalItems}</span>
                      </div>

                      {/* Expand / Collapse Icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDayExpand(day.dateKey);
                        }}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors print:hidden"
                        title={isExpanded ? 'طي التفاصيل' : 'عرض التفاصيل'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Day Expanded Content (Visible on Screen if open, ALWAYS VISIBLE on Print) */}
                  <div className={`${isExpanded ? 'block' : 'hidden'} print:block bg-slate-50/50 p-4 sm:p-5 border-t border-slate-100`}>
                    
                    {/* Top Dishes of the Day */}
                    {day.itemsMap.length > 0 && (
                      <div className="mb-4 bg-white p-3 rounded-xl border border-slate-200/70">
                        <span className="text-[11px] font-black text-slate-500 block mb-2">الأصناف المباعة خلال هذا اليوم:</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {day.itemsMap.map((it) => (
                            <span 
                              key={it.name}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1.5"
                            >
                              <span className="text-orange-600 font-black">{it.qty}x</span>
                              <span>{it.name}</span>
                              <span className="text-slate-400 font-semibold text-[10px]">({it.revenue} ₪)</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Table of Orders of this Day */}
                    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                      <div className="p-3 bg-slate-100/70 border-b border-slate-200/80 font-black text-xs text-slate-700 flex items-center justify-between">
                        <span>سجل طلبات وفواتير {day.dayName} ({day.orders.length} طلبات)</span>
                        <span className="text-[11px] text-slate-500">إجمالي اليوم: <strong>{day.totalSales} ₪</strong></span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-black">
                              <th className="py-2.5 px-3">رقم الطلب</th>
                              <th className="py-2.5 px-3">الوقت</th>
                              <th className="py-2.5 px-3">الطاولة</th>
                              <th className="py-2.5 px-3">الأصناف والكميات المطلوبة</th>
                              <th className="py-2.5 px-3">ملاحظات</th>
                              <th className="py-2.5 px-3">الحالة</th>
                              <th className="py-2.5 px-3 text-left">قيمة الفاتورة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {day.orders.map((ord) => {
                              const timeStr = ord.createdAt 
                                ? new Date(ord.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
                                : 'الآن';

                              const isCompleted = ord.status === 'تم التسليم' || ord.status === 'completed';

                              return (
                                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-black text-slate-900 whitespace-nowrap">
                                    {ord.orderNumber}
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-600 whitespace-nowrap">
                                    {timeStr}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-bold text-[11px]">
                                      طاولة {ord.tableNumber || '-'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 min-w-[200px]">
                                    {ord.items && ord.items.length > 0 ? (
                                      <div className="space-y-0.5">
                                        {ord.items.map((it, i) => (
                                          <div key={i} className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                            <span className="text-orange-600 font-black">{it.quantity}x</span>
                                            <span>{it.name}</span>
                                            {it.price > 0 && (
                                              <span className="text-slate-400 font-normal">({it.price * it.quantity} ₪)</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">لا توجد تفاصيل أصناف</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 max-w-[140px] truncate">
                                    {ord.customerNote || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                      isCompleted 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {ord.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-black text-sm text-left whitespace-nowrap text-slate-900">
                                    {ord.totalAmount} ₪
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── 5. DAY-BY-DAY SUMMARY TABLE VIEW (ALTERNATIVE VIEW) ─── */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs print:border print:border-slate-300">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900">جدول مقارنة الأيام والمبيعات اليومية</h3>
            <span className="text-xs font-bold text-slate-500">مجموع الأيام: {dailyBreakdown.length} يوم</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-black">
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">اليوم</th>
                  <th className="py-3 px-4">إجمالي المبيعات</th>
                  <th className="py-3 px-4">عدد الطلبات</th>
                  <th className="py-3 px-4">متوسط الفاتورة</th>
                  <th className="py-3 px-4">الأصناف المباعة</th>
                  <th className="py-3 px-4">أكثر صنف مبيعاً</th>
                  <th className="py-3 px-4 text-left print:hidden">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyBreakdown.map((day) => (
                  <tr key={day.dateKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {day.dateKey}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {day.dayName}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-emerald-700 whitespace-nowrap text-sm">
                      {day.totalSales.toLocaleString('ar-SA')} ₪
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {day.ordersCount} طلب
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {day.avgTicket} ₪
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">
                      {day.totalItems} صنف
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 min-w-[140px]">
                      {day.topDish}
                    </td>
                    <td className="py-3 px-4 text-left print:hidden">
                      <button
                        onClick={() => {
                          setViewMode('cards');
                          setExpandedDays({ [day.dateKey]: true });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PRINT CSS RULES ─── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 10pt !important;
          }
          nav, aside, header, button, input, .print\\:hidden, #sidebar, .sidebar {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 5px 8px !important;
          }
        }
      `}</style>

    </div>
  );
}
