'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Users, Utensils, DollarSign, TrendingUp, Search,
  ExternalLink, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  ShieldCheck, ArrowUpRight, Filter, ChevronRight, Eye, Phone, MapPin,
  Calendar, Layers, Clock
} from 'lucide-react';
import Link from 'next/link';

interface RestaurantItem {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string;
  currency: string;
  createdAt: string;
  subdomainUrl: string;
  branchId: string;
  tablesCount: number;
  isActive: boolean;
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

interface RecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function SuperAdminMasterDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
      setRecentOrders(data.recentOrders || []);
    } catch (err) {
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
        setRestaurants((prev) =>
          prev.map((r) => (r.id === restaurantId ? { ...r, isActive: !currentActive } : r))
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
    return restaurants.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery) ||
        r.city.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? r.isActive
          : !r.isActive;

      return matchesSearch && matchesStatus;
    });
  }, [restaurants, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-500 selection:text-white pb-20" dir="rtl">
      
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
                  لوحة التحكم العامة (Master Admin)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">إدارة شبكة المطاعم الشريكة وكافة الطلبات المركزية</p>
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
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5"
            >
              <span>لوحة المطعم</span>
              <ArrowUpRight size={13} />
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

        {/* 1. Global Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-750 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">إجمالي المطاعم</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                <Store size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : stats?.totalRestaurants || 0}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>موزعة في محافظات فلسطين</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-750 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">إجمالي الطاولات</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Utensils size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : stats?.totalTables || 0}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Layers size={11} className="text-blue-400" />
              <span>طاولة نشطة مجهزة بـ QR</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-750 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">إجمالي الطلبات</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : stats?.totalOrders || 0}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={11} className="text-emerald-400" />
              <span>طلب مباشر من الزبائن</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-750 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400">حجم المبيعات</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white">
              {loading ? '...' : `${(stats?.totalRevenue || 0).toLocaleString()} ₪`}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck size={11} className="text-amber-400" />
              <span>إجمالي قيمة الطلبات المحسوبة</span>
            </p>
          </div>
        </div>

        {/* 2. Restaurant Directory & Management */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          
          {/* Table Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-white">سجل المطاعم الشريكة</h2>
              <p className="text-xs text-slate-400">إجمالي {filteredRestaurants.length} مطعم مسجل على المنصة</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="بحث باسم المطعم، المدينة، الدومين..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-750 text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'all' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  نشط
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'inactive' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  متوقف
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">المطعم والدومين</th>
                  <th className="py-3.5 px-4">المدينة والهاتف</th>
                  <th className="py-3.5 px-4 text-center">الطاولات</th>
                  <th className="py-3.5 px-4 text-center">الطلبات</th>
                  <th className="py-3.5 px-4 text-center">إجمالي المبيعات</th>
                  <th className="py-3.5 px-4 text-center">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      {loading ? 'جارٍ تحميل قائمة المطاعم...' : 'لا توجد مطاعم مطابقة لبحثك'}
                    </td>
                  </tr>
                ) : (
                  filteredRestaurants.map((restaurant) => (
                    <tr key={restaurant.id} className="hover:bg-slate-800/40 transition-colors group">
                      
                      {/* Name & Subdomain */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-black text-orange-400 text-xs">
                            {restaurant.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-white text-xs sm:text-sm">{restaurant.name}</p>
                            <a
                              href={restaurant.subdomainUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <span>{restaurant.slug}.menus.cool</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* City & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-300 font-bold flex items-center gap-1">
                            <MapPin size={11} className="text-slate-500" />
                            <span>{restaurant.city || 'نابلس'}</span>
                          </p>
                          <p className="text-slate-500 text-[11px] flex items-center gap-1" dir="ltr">
                            <Phone size={10} className="text-slate-600" />
                            <span>{restaurant.phone || '—'}</span>
                          </p>
                        </div>
                      </td>

                      {/* Tables */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs">
                          {restaurant.tablesCount} طاولة
                        </span>
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
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                            restaurant.isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${restaurant.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{restaurant.isActive ? 'نشط' : 'متوقف'}</span>
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

        {/* 3. Recent Platform Orders Feed */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>أحدث الطلبات المباشرة عبر المنصة</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h3>
              <p className="text-[11px] text-slate-400">تحديث فوري لجميع الطلبات الصادرة من كافة المطاعم</p>
            </div>
            <span className="text-[10px] font-bold text-slate-500">آخر {recentOrders.length} طلبات</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-3 rounded-xl bg-slate-900 border border-slate-750 flex items-center justify-between">
                <div>
                  <p className="font-black text-xs text-white">{order.orderNumber}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-xs text-emerald-400">{order.totalAmount} ₪</p>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
