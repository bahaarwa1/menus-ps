'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Calendar, DollarSign, ShoppingBag,
  Clock, ArrowUpRight, ArrowDownRight, RefreshCw,
  Printer, Download, ChevronDown, Check, ChefHat,
  BarChart3, Users, Sparkles, Filter, Utensils,
  Search, Eye, AlertCircle, FileSpreadsheet, Layers
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

export default function ProductionAnalyticsPage() {
  const [preset, setPreset] = useState<TimeRangePreset>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [restaurantSlug, setRestaurantSlug] = useState('sh-manoosha');
  const [restaurantName, setRestaurantName] = useState('مطعم وكافيه شيشة ومنقوشة');
  const [branchId, setBranchId] = useState<string>('a84f5ec9-714f-44fe-980d-82a78eb4f9b9');
  const [allOrders, setAllOrders] = useState<AnalyticsOrder[]>([]);

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

  // 5. Zero-Demo Analytical Metrics Calculation
  const analytics = useMemo(() => {
    const orders = filteredOrders;
    const totalOrders = orders.length;

    // Financial Totals
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const avgTicket = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 10) / 10 : 0;

    // Items Breakdown
    let totalItemsSold = 0;
    const dishMap = new Map<string, { name: string; qty: number; revenue: number }>();
    const tableMap = new Map<number, { tableNumber: number; ordersCount: number; revenue: number }>();

    orders.forEach((order) => {
      // Tables
      const tNum = order.tableNumber || 0;
      const existingTable = tableMap.get(tNum) || { tableNumber: tNum, ordersCount: 0, revenue: 0 };
      existingTable.ordersCount += 1;
      existingTable.revenue += Number(order.totalAmount) || 0;
      tableMap.set(tNum, existingTable);

      // Dishes
      (order.items || []).forEach((it) => {
        const q = Number(it.quantity) || 1;
        const p = Number(it.price) || 0;
        const lineTotal = Number(it.total) || q * p;
        totalItemsSold += q;

        const key = it.name?.trim() || 'صنف بدون اسم';
        const curr = dishMap.get(key) || { name: key, qty: 0, revenue: 0 };
        curr.qty += q;
        curr.revenue += lineTotal;
        dishMap.set(key, curr);
      });
    });

    // Top Selling Dishes Array
    const topDishes = Array.from(dishMap.values())
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .map((d) => ({
        ...d,
        percent: totalItemsSold > 0 ? Math.round((d.qty / totalItemsSold) * 100) : 0,
      }));

    // Table Performance Array
    const tablePerformance = Array.from(tableMap.values())
      .sort((a, b) => b.revenue - a.revenue || b.ordersCount - a.ordersCount);

    // Status Counts & Completion Rate
    const completedCount = orders.filter((o) => 
      o.status === 'تم التسليم' || o.status === 'completed' || o.status === 'جاهز' || o.status === 'ready'
    ).length;
    const completionRate = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 100;

    // Hourly Distribution (0 to 23)
    const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
      hour24: i,
      hour: i === 0 ? '12 ص' : i < 12 ? `${i} ص` : i === 12 ? '12 م' : `${i - 12} م`,
      count: 0,
      sales: 0,
    }));

    orders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        const h = d.getHours();
        if (h >= 0 && h < 24) {
          hourlyCounts[h].count += 1;
          hourlyCounts[h].sales += Number(o.totalAmount) || 0;
        }
      }
    });

    // Filter hourly to active or typical dining hours (e.g. 10 ص to 2 ص) if sparse
    const activeHourly = hourlyCounts.filter((h) => h.count > 0 || (h.hour24 >= 10 && h.hour24 <= 23));

    // Trend Timeline Chart
    let trendChartData: Array<{ label: string; sales: number; orders: number }> = [];

    if (preset === 'today' || preset === 'yesterday') {
      // Group by 2-hour slots for clean readability
      trendChartData = hourlyCounts
        .filter((_, idx) => idx % 2 === 0 || hourlyCounts[idx].count > 0)
        .map((h) => ({
          label: h.hour,
          sales: h.sales,
          orders: h.count,
        }));
    } else {
      // Group by Day (YYYY-MM-DD)
      const dayMap = new Map<string, { label: string; sales: number; orders: number }>();
      
      // Sort orders chronologically for trend
      const chronoOrders = [...orders].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      chronoOrders.forEach((o) => {
        if (!o.createdAt) return;
        const d = new Date(o.createdAt);
        const dayKey = d.toISOString().slice(0, 10);
        const label = `${d.getDate()}/${d.getMonth() + 1}`;
        const existing = dayMap.get(dayKey) || { label, sales: 0, orders: 0 };
        existing.sales += Number(o.totalAmount) || 0;
        existing.orders += 1;
        dayMap.set(dayKey, existing);
      });

      trendChartData = Array.from(dayMap.values());

      // If only 1 or 0 points, add an initial baseline point for clean visual rendering
      if (trendChartData.length === 1) {
        trendChartData = [
          { label: 'البداية', sales: 0, orders: 0 },
          ...trendChartData,
        ];
      }
    }

    return {
      totalRevenue,
      totalOrders,
      avgTicket,
      totalItemsSold,
      completionRate,
      completedCount,
      topDishes,
      tablePerformance,
      hourlyBreakdown: activeHourly.length > 0 ? activeHourly : hourlyCounts.slice(10, 24),
      salesTrend: trendChartData,
    };
  }, [filteredOrders, preset]);

  // 6. Detailed Orders Search and Status Filter for Log Table
  const searchedOrders = useMemo(() => {
    let list = filteredOrders;
    if (statusFilter !== 'all') {
      list = list.filter((o) => {
        if (statusFilter === 'new') return o.status === 'جديد' || o.status === 'new';
        if (statusFilter === 'cooking') return o.status === 'قيد التحضير' || o.status === 'cooking';
        if (statusFilter === 'ready') return o.status === 'جاهز' || o.status === 'ready';
        if (statusFilter === 'completed') return o.status === 'تم التسليم' || o.status === 'completed';
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => 
        o.orderNumber?.toLowerCase().includes(q) ||
        String(o.tableNumber).includes(q) ||
        (o.customerNote && o.customerNote.toLowerCase().includes(q)) ||
        o.items.some((it) => it.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filteredOrders, statusFilter, searchQuery]);

  // 7. CSV Export Generator
  const exportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('لا توجد بيانات لتصديرها في هذه الفترة');
      return;
    }

    const headers = ['رقم الطلب', 'التاريخ والوقت', 'رقم الطاولة', 'الحالة', 'إجمالي الطلب (₪)', 'تفاصيل الأصناف', 'ملاحظات'];
    const rows = filteredOrders.map((o) => {
      const itemsStr = o.items.map((it) => `${it.quantity}x ${it.name}`).join(' | ');
      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('ar-SA') : '';
      return [
        `"${o.orderNumber}"`,
        `"${dateStr}"`,
        `"طاولة ${o.tableNumber}"`,
        `"${o.status}"`,
        `"${o.totalAmount}"`,
        `"${itemsStr}"`,
        `"${(o.customerNote || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_مبيعات_${restaurantSlug}_${preset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isManoosha = restaurantSlug === 'sh-manoosha';
  const brandPrimary = isManoosha ? '#7A1C30' : '#f97316';
  const brandGold = isManoosha ? '#C28B3E' : '#fb923c';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 print:space-y-4" dir="rtl">
      
      {/* 1. Header with Title & Action Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs print:border-none print:shadow-none">
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
                  التحليلات المالية والتقارير الفعلية
                </h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  بيانات حية 100% ومستخرجة مباشرة من قاعدة بيانات <strong className="text-slate-800">{restaurantName}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Live Indicator / Manual Refresh */}
            <button
              onClick={() => loadOrders(restaurantSlug, true)}
              disabled={isRefreshing || isLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-2xs"
              title="تحديث البيانات المباشرة الآن"
            >
              <RefreshCw size={14} className={isRefreshing || isLoading ? 'animate-spin text-orange-500' : 'text-slate-600'} />
              <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث مباشر'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={exportCSV}
              disabled={filteredOrders.length === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="تصدير تقرير الإكسل CSV"
            >
              <FileSpreadsheet size={15} />
              <span>تصدير Excel/CSV</span>
            </button>

            {/* Print Report */}
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <Printer size={15} />
              <span>طباعة التقرير</span>
            </button>
          </div>
        </div>

        {/* 2. Comprehensive Time Filters ("مش بس اخر يوم واخر 7 او 30 يوم") */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 hide-scrollbar">
            <span className="text-xs font-black text-slate-500 shrink-0 ml-1 flex items-center gap-1">
              <Calendar size={14} />
              الفترة:
            </span>
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'yesterday', label: 'أمس' },
              { id: 'last7', label: 'آخر 7 أيام' },
              { id: 'last30', label: 'آخر 30 يوماً' },
              { id: 'thisMonth', label: 'هذا الشهر' },
              { id: 'lastMonth', label: 'الشهر الماضي' },
              { id: 'all', label: 'كل الوقت' },
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

          {/* Custom Date Pickers when 'custom' is active */}
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

      {/* Current Range Label Banner */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-bold">
        <span>عرض النتائج الحالية لـ: <strong className="text-slate-800">{dateRangeBounds.label}</strong></span>
        <span>إجمالي السجلات المطابقة: <strong className="text-slate-800">{filteredOrders.length} طلب</strong></span>
      </div>

      {/* 3. Real KPI Cards (Zero Fake / Demo Numbers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Real Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
              style={{ background: isManoosha ? '#FBF2F4' : '#FFF7ED', color: brandPrimary }}
            >
              ₪
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              إيراد صافي
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {analytics.totalRevenue.toLocaleString('ar-SA')} ₪
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center justify-between">
            <span>إجمالي المبيعات المحققة</span>
            {analytics.totalOrders > 0 && (
              <span className="text-emerald-600 font-bold">فعلي ✓</span>
            )}
          </div>
        </div>

        {/* Total Orders Count */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg bg-blue-50 text-blue-600">
              📦
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {analytics.completionRate}% مكتمل
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {analytics.totalOrders.toLocaleString('ar-SA')}
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
            {analytics.avgTicket} ₪
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
              وجبات ومشروبات
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {analytics.totalItemsSold.toLocaleString('ar-SA')}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            إجمالي القطع والأصناف المباعة
          </div>
        </div>
      </div>

      {/* 4. Sales Curve & Peak Hours Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-base text-slate-900">
                منحنى الإيرادات الفعلية ({dateRangeBounds.label})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة حركة المبيعات وتدفق الطلبات حسب الوقت
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: brandPrimary }}></span>
              <span>المبيعات (₪)</span>
            </div>
          </div>

          {analytics.totalRevenue === 0 && analytics.totalOrders === 0 ? (
            <div className="h-[270px] flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <span className="text-3xl mb-2">📊</span>
              <p className="font-bold text-slate-700 text-xs">لا توجد مبيعات مسجلة في هذا النطاق الزمني</p>
              <p className="text-[11px] text-slate-400 mt-1">
                عند تسجيل طلبات جديدة من الزبائن أو اختيار فترة زمنية أخرى (مثل "كل الوقت")، سيظهر الرسم البياني هنا تلقائياً.
              </p>
            </div>
          ) : (
            <div className="h-[270px] w-full dir-ltr" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={brandPrimary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={brandPrimary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${val}₪`} />
                  <Tooltip
                    formatter={(val: any) => [`${val} ₪`, 'المبيعات']}
                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke={brandPrimary} strokeWidth={2.5} fillOpacity={1} fill="url(#salesGradReal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Peak Hours (1 col) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-black text-base text-slate-900">ساعات الضغط والذروة</h3>
              <Clock size={16} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-3">توزيع الطلبات الفعلي على ساعات اليوم</p>
          </div>

          {analytics.totalOrders === 0 ? (
            <div className="h-[210px] flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <span className="text-2xl mb-1">⏱️</span>
              <p className="text-xs font-bold text-slate-600">لا توجد طلبات لحساب الذروة</p>
            </div>
          ) : (
            <div className="h-[210px] w-full dir-ltr" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hourlyBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} طلب`, 'عدد الطلبات']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '10px', fontSize: '11px', border: 'none' }}
                  />
                  <Bar dataKey="count" fill={brandGold} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 mt-3 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-bold">حالة الصالة:</span>
            <span className="font-black" style={{ color: brandPrimary }}>
              {analytics.totalOrders > 0 ? `${analytics.totalOrders} طلب مسجل` : 'جاهز لاستقبال الطلبات'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Top Dishes & Table Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Top Selling Dishes (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-base text-slate-900">
                الأصناف الأكثر طلباً ومبيعاً (Star Dishes)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                قائمة حقيقية مبنية مباشرة على الأصناف المطلوبة في الفواتير
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {analytics.topDishes.length} أصناف مباعة
            </span>
          </div>

          {analytics.topDishes.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
              <span className="text-3xl block mb-2">🍽️</span>
              <p className="text-xs font-bold text-slate-700">لم يتم بيع أي أصناف في هذا النطاق الزمني بعد</p>
              <p className="text-[11px] text-slate-400 mt-1">ستظهر الأصناف الأكثر رواجاً ومردودها المالي هنا فور إتمام الطلبات.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {analytics.topDishes.map((item, idx) => (
                <div key={item.name} className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span 
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                      style={idx < 3 ? { backgroundColor: brandGold, color: '#fff' } : { backgroundColor: '#e2e8f0', color: '#334155' }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-black text-xs text-slate-900 truncate">{item.name}</h4>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        تم طلبها {item.qty} مرة • تمثل {item.percent}% من مبيعات الأصناف
                      </span>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="text-xs font-black text-slate-900">{item.revenue.toLocaleString('ar-SA')} ₪</div>
                    <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(item.percent, 100)}%`, backgroundColor: brandPrimary }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table Performance (1 col) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-black text-base text-slate-900">نشاط الطاولات والمبيعات</h3>
              <Users size={16} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">أكثر الطاولات استهلاكاً وتحقيقاً للإيرادات</p>

            {analytics.tablePerformance.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
                <span className="text-2xl block mb-1">🪑</span>
                <p className="text-xs font-bold text-slate-600">لا توجد طلبات طاولات في هذه الفترة</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                {analytics.tablePerformance.map((t) => (
                  <div key={t.tableNumber} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                        {t.tableNumber || '?'}
                      </span>
                      <div>
                        <div className="font-black text-xs text-slate-900">
                          {t.tableNumber ? `طاولة رقم ${t.tableNumber}` : 'طلب مباشر / بدون طاولة'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold">
                          {t.ordersCount} طلبات
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-orange-600">
                      {t.revenue.toLocaleString('ar-SA')} ₪
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-orange-50/70 border border-orange-200/60 text-xs text-orange-900 flex items-center gap-2">
            <span>✨</span>
            <span className="font-medium text-[11px]">
              يتم ربط كل طلب برقم الطاولة تلقائياً عبر مسح كود QR.
            </span>
          </div>
        </div>
      </div>

      {/* 6. Detailed Orders Audit Table ("سجل الطلبات المفصل") */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-black text-base text-slate-900">
              سجل تفاصيل الطلبات في هذه الفترة
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              بيانات كاملة لكل طلب: رقم الطلب، الوقت، الطاولة، الأصناف المطلوبة، والإجمالي
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: 'all', label: 'الكل' },
                { id: 'new', label: 'جديدة' },
                { id: 'cooking', label: 'بالمطبخ' },
                { id: 'ready', label: 'جاهزة' },
                { id: 'completed', label: 'مسلّمة' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    statusFilter === s.id ? 'bg-white shadow-2xs text-slate-900 font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <input
                type="text"
                placeholder="بحث برقم الطلب، الطاولة، أو الصنف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
              />
              <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {searchedOrders.length === 0 ? (
          <div className="py-14 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
            <span className="text-3xl block mb-2">📋</span>
            <h4 className="font-black text-slate-800 text-xs mb-1">
              {filteredOrders.length === 0 ? 'لا توجد طلبات في هذا النطاق الزمني' : 'لا توجد نتائج تطابق البحث أو التصنيف المحدد'}
            </h4>
            <p className="text-[11px] text-slate-400">
              قم باختيار فترة أخرى مثل "كل الوقت" أو إزالة كلمات البحث لعرض الطلبات.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-black">
                  <th className="py-3 px-3 rounded-r-xl">رقم الطلب</th>
                  <th className="py-3 px-3">التاريخ والوقت</th>
                  <th className="py-3 px-3">رقم الطاولة</th>
                  <th className="py-3 px-3">تفاصيل الأصناف المطلوبة</th>
                  <th className="py-3 px-3">ملاحظة الزبون</th>
                  <th className="py-3 px-3">الحالة</th>
                  <th className="py-3 px-3 rounded-l-xl text-left">إجمالي الفاتورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {searchedOrders.map((order) => {
                  const dateStr = order.createdAt 
                    ? new Date(order.createdAt).toLocaleString('ar-SA', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })
                    : 'الآن';

                  const isCompleted = order.status === 'تم التسليم' || order.status === 'completed';
                  const isCooking = order.status === 'قيد التحضير' || order.status === 'cooking';
                  const isReady = order.status === 'جاهز' || order.status === 'ready';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Number */}
                      <td className="py-3 px-3 font-mono font-black text-slate-900 whitespace-nowrap">
                        {order.orderNumber}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Table */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-black text-[11px]">
                          طاولة {order.tableNumber || '-'}
                        </span>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-3 min-w-[220px]">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                                <span className="text-orange-600 font-mono font-black">{it.quantity}x</span>
                                <span>{it.name}</span>
                                {it.price > 0 && (
                                  <span className="text-slate-400 font-normal">({it.price * it.quantity} ₪)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">لا توجد تفاصيل أصناف</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-3 px-3 max-w-[160px] truncate text-slate-500 font-medium">
                        {order.customerNote ? (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded text-[10px] font-bold">
                            📝 {order.customerNote}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isReady
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isCooking
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isCompleted ? '✓ تم التسليم' : isReady ? 'جاهز للتقديم' : isCooking ? 'قيد التحضير' : 'طلب جديد'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3 font-mono font-black text-sm text-left whitespace-nowrap" style={{ color: brandPrimary }}>
                        {order.totalAmount} ₪
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
