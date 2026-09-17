'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Users, Utensils, DollarSign, TrendingUp, Search,
  ExternalLink, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  ShieldCheck, ArrowUpRight, Filter, Eye, Phone, MapPin,
  Calendar, Layers, Clock, Settings, Crown, Zap, Star,
  X, Save, PlusCircle, CalendarCheck, ToggleLeft, ToggleRight, LogIn
} from 'lucide-react';
import Link from 'next/link';

interface SubscriptionInfo {
  plan: 'trial' | 'basic' | 'pro';
  planNameAr: string;
  expiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  status: 'active' | 'trial' | 'expired';
}

interface RestaurantItem {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string;
  address: string;
  currency: string;
  createdAt: string;
  subdomainUrl: string;
  branchId: string;
  tablesCount: number;
  isActive: boolean;
  subscription?: SubscriptionInfo;
  totalOrders: number;
  totalRevenue: number;
}

interface AdminStats {
  totalRestaurants: number;
  totalTables: number;
  totalOrders: number;
  totalRevenue: number;
  currency: string;
}

const PLAN_CONFIG = {
  trial: { icon: Zap, label: 'تجريبي (14 يوم)', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  basic: { icon: Star, label: 'أساسي', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  pro: { icon: Crown, label: 'احترافي VIP', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
};

function SubscriptionBadge({ sub }: { sub?: SubscriptionInfo }) {
  if (!sub) return null;
  const cfg = PLAN_CONFIG[sub.plan];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      <Icon size={9} />
      {cfg.label}
      {sub.daysRemaining > 0 && <span className="opacity-70">· {sub.daysRemaining}ي</span>}
    </span>
  );
}

function ManageModal({ restaurant, onClose, onSaved }: {
  restaurant: RestaurantItem;
  onClose: () => void;
  onSaved: (updated: Partial<RestaurantItem>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState(restaurant.name);
  const [phone, setPhone] = useState(restaurant.phone);
  const [city, setCity] = useState(restaurant.city);
  const [tablesCount, setTablesCount] = useState(restaurant.tablesCount);
  const [isActive, setIsActive] = useState(restaurant.isActive);
  const [plan, setPlan] = useState<'trial' | 'basic' | 'pro'>(restaurant.subscription?.plan || 'trial');

  const currentExpiry = restaurant.subscription?.expiresAt
    ? new Date(restaurant.subscription.expiresAt).toISOString().split('T')[0]
    : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const [expiryDate, setExpiryDate] = useState(currentExpiry);

  const addDays = (days: number) => {
    const base = expiryDate ? new Date(expiryDate) : new Date();
    if (base < new Date()) base.setTime(new Date().getTime());
    base.setDate(base.getDate() + days);
    setExpiryDate(base.toISOString().split('T')[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/restaurants/${restaurant.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, city, tablesCount, isActive, plan,
          expiresAt: new Date(expiryDate + 'T23:59:59Z').toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'فشل الحفظ'); return; }
      setSuccess('تم الحفظ بنجاح ✓');
      onSaved({ name, phone, city, tablesCount, isActive, subscription: {
        plan, planNameAr: PLAN_CONFIG[plan].label,
        expiresAt: new Date(expiryDate + 'T23:59:59Z').toISOString(),
        daysRemaining: Math.max(0, Math.ceil((new Date(expiryDate + 'T23:59:59Z').getTime() - Date.now()) / 86400000)),
        isExpired: new Date(expiryDate + 'T23:59:59Z') < new Date(),
        status: plan === 'trial' ? 'trial' : 'active',
      } });
      setTimeout(onClose, 1200);
    } catch { setError('خطأ في الاتصال بالسيرفر'); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Settings size={16} className="text-orange-400" />
                إدارة المطعم والاشتراك
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{restaurant.slug}.menus.cool</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Alerts */}
            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">{error}</div>}
            {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">{success}</div>}

            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">معلومات المطعم</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">اسم المطعم</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">رقم الهاتف</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">المدينة</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">عدد الطاولات</label>
                  <input type="number" min={1} max={200} value={tablesCount} onChange={e => setTablesCount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
                </div>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white">حالة المطعم</p>
                <p className="text-[11px] text-slate-400">إيقاف المطعم يحجب منيو الزبائن فوراً</p>
              </div>
              <button
                onClick={() => setIsActive(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {isActive ? 'نشط' : 'متوقف'}
              </button>
            </div>

            {/* Subscription */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">إعدادات الاشتراك</h3>
              
              <div className="grid grid-cols-3 gap-2">
                {(['trial', 'basic', 'pro'] as const).map(p => {
                  const cfg = PLAN_CONFIG[p];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={p}
                      onClick={() => setPlan(p)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        plan === p
                          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Icon size={20} className="mx-auto mb-1" />
                      <p className="text-[10px] font-black">{cfg.label}</p>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">تاريخ انتهاء الاشتراك</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[{label: '+30 يوم', days: 30}, {label: '+3 أشهر', days: 90}, {label: '+سنة', days: 365}].map(b => (
                    <button
                      key={b.days}
                      onClick={() => addDays(b.days)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-800 hover:bg-orange-500/20 text-slate-400 hover:text-orange-300 border border-slate-700 hover:border-orange-500/40 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <PlusCircle size={11} />
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer">
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function SuperAdminMasterDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [managingRestaurant, setManagingRestaurant] = useState<RestaurantItem | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/admin/overview');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'تعذر تحميل بيانات لوحة التحكم الرئيسية');
        setLoading(false);
        return;
      }
      setStats(data.stats);
      setRestaurants(data.restaurants || []);
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleToggleStatus = async (restaurantId: string, currentActive: boolean) => {
    setTogglingId(restaurantId);
    try {
      const res = await fetch(`/api/v1/admin/restaurants/${restaurantId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setRestaurants(prev =>
          prev.map(r => (r.id === restaurantId ? { ...r, isActive: !currentActive } : r))
        );
      } else {
        alert(data.error || 'فشل تعديل حالة المطعم');
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const matchesSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery) ||
        r.city.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'all' ? true : statusFilter === 'active' ? r.isActive : !r.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [restaurants, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-500 selection:text-white pb-20" dir="rtl">
      
      {/* Manage Modal */}
      {managingRestaurant && (
        <ManageModal
          restaurant={managingRestaurant}
          onClose={() => setManagingRestaurant(null)}
          onSaved={(updated) => {
            setRestaurants(prev =>
              prev.map(r => r.id === managingRestaurant.id ? { ...r, ...updated } : r)
            );
          }}
        />
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-base">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">Menus.cool</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Master Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">إدارة شبكة المطاعم الشريكة والاشتراكات</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer border border-slate-700"
              title="تحديث البيانات"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5"
            >
              <LogIn size={13} />
              <span>تسجيل الخروج</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'إجمالي المطاعم', value: loading ? '...' : stats?.totalRestaurants || 0, sub: 'مطعم على المنصة', Icon: Store, color: 'text-orange-400', bg: 'bg-orange-500/15' },
            { label: 'إجمالي الطاولات', value: loading ? '...' : stats?.totalTables || 0, sub: 'طاولة بـ QR', Icon: Utensils, color: 'text-blue-400', bg: 'bg-blue-500/15' },
            { label: 'إجمالي الطلبات', value: loading ? '...' : stats?.totalOrders || 0, sub: 'طلب مباشر', Icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
            { label: 'حجم المبيعات', value: loading ? '...' : `${(stats?.totalRevenue || 0).toLocaleString()} ₪`, sub: 'إجمالي المبيعات', Icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          ].map(card => (
            <div key={card.label} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-750 backdrop-blur-sm hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">{card.label}</span>
                <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                  <card.Icon size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{card.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Restaurant Directory */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          
          {/* Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white">سجل المطاعم الشريكة</h2>
              <p className="text-xs text-slate-400">إجمالي {filteredRestaurants.length} مطعم</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="بحث باسم المطعم، الرابط، الهاتف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>

              <div className="flex gap-1.5">
                {(['all', 'active', 'inactive'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      statusFilter === f
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-750'
                    }`}
                  >
                    {f === 'all' ? 'الكل' : f === 'active' ? 'نشط' : 'متوقف'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs" dir="rtl">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr className="text-right text-[11px] text-slate-500 font-bold">
                  <th className="py-3.5 px-4">المطعم</th>
                  <th className="py-3.5 px-4">المدينة والهاتف</th>
                  <th className="py-3.5 px-4 text-center">الطاولات</th>
                  <th className="py-3.5 px-4 text-center">الاشتراك</th>
                  <th className="py-3.5 px-4 text-center">الطلبات</th>
                  <th className="py-3.5 px-4 text-center">المبيعات</th>
                  <th className="py-3.5 px-4 text-center">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      {loading ? 'جارٍ تحميل قائمة المطاعم...' : 'لا توجد مطاعم مطابقة لبحثك'}
                    </td>
                  </tr>
                ) : (
                  filteredRestaurants.map(restaurant => (
                    <tr key={restaurant.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Name & Subdomain */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-black text-orange-400 text-xs shrink-0">
                            {restaurant.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-white text-xs truncate max-w-[140px]">{restaurant.name}</p>
                            <a
                              href={restaurant.subdomainUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <span className="truncate max-w-[120px]">{restaurant.slug}.menus.cool</span>
                              <ExternalLink size={9} />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* City & Phone */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-300 font-bold flex items-center gap-1">
                          <MapPin size={10} className="text-slate-500 shrink-0" />
                          <span>{restaurant.city || 'نابلس'}</span>
                        </p>
                        <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5" dir="ltr">
                          <Phone size={9} className="text-slate-600 shrink-0" />
                          <span>{restaurant.phone || '—'}</span>
                        </p>
                      </td>

                      {/* Tables */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs">
                          {restaurant.tablesCount} طاولة
                        </span>
                      </td>

                      {/* Subscription */}
                      <td className="py-3.5 px-4 text-center">
                        <SubscriptionBadge sub={restaurant.subscription} />
                        {restaurant.subscription?.isExpired && (
                          <p className="text-[9px] text-rose-400 font-bold mt-0.5">منتهي الصلاحية</p>
                        )}
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-200">
                        {restaurant.totalOrders}
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 px-4 text-center font-black text-emerald-400">
                        {restaurant.totalRevenue.toLocaleString()} ₪
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                          restaurant.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${restaurant.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {restaurant.isActive ? 'نشط' : 'متوقف'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={restaurant.subdomainUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-400 transition-all"
                            title="معاينة منيو الزبون"
                          >
                            <Eye size={13} />
                          </a>

                          <button
                            onClick={() => setManagingRestaurant(restaurant)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-slate-750 transition-all cursor-pointer"
                            title="إدارة المطعم والاشتراك"
                          >
                            <Settings size={13} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(restaurant.id, restaurant.isActive)}
                            disabled={togglingId === restaurant.id}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                              restaurant.isActive
                                ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-750'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/40'
                            }`}
                          >
                            {togglingId === restaurant.id ? '...' : restaurant.isActive ? 'إيقاف' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
