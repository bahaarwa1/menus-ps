'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, ShoppingBag, CreditCard,
  Copy, Check, ExternalLink,
  QrCode, ArrowUpRight,
  Users, Key, Sparkles, Utensils, ShieldCheck,
} from 'lucide-react';

export default function ProductionDashboardOverview() {
  const [createdSlug, setCreatedSlug] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrdersCount: 0,
    activeTablesCount: 0,
    totalTablesCount: 0,
    avgTicket: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let slug = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSlug = params.get('created') || params.get('restaurant');
      if (urlSlug) slug = urlSlug;
    }

    const fetchStats = (silent = false) => {
      if (!silent) setIsLoading(true);
      fetch(`/api/v1/dashboard/stats${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.stats) setStats(data.stats);
            if (Array.isArray(data.recentOrders)) setRecentOrders(data.recentOrders);
            if (data.restaurantSlug) setCreatedSlug(data.restaurantSlug);
          }
        })
        .catch((err) => console.error('Dashboard stats fetch error:', err))
        .finally(() => { if (!silent) setIsLoading(false); });
    };

    fetchStats(false);
    const interval = setInterval(() => fetchStats(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const liveUrl = typeof window !== 'undefined' && createdSlug
    ? `${window.location.origin}/r/${createdSlug}`
    : `https://menus-ps.vercel.app/r/${createdSlug || ''}`;
  const directMenuUrl = createdSlug ? `/r/${createdSlug}` : '#';

  const copyUrl = () => {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const kpis = [
    {
      title: 'مبيعات اليوم',
      value: `${stats.todaySales.toLocaleString()} ₪`,
      change: stats.todayOrdersCount > 0 ? `${stats.todayOrdersCount} طلبات` : 'لا توجد مبيعات',
      isUp: stats.todaySales > 0,
      icon: TrendingUp,
      accent: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-orange-500/10',
      textColor: 'text-orange-600',
    },
    {
      title: 'طلبات اليوم',
      value: `${stats.todayOrdersCount}`,
      change: stats.todayOrdersCount > 0 ? 'نشط الآن' : 'بانتظار أول طلب',
      isUp: stats.todayOrdersCount > 0,
      icon: ShoppingBag,
      accent: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10',
      textColor: 'text-emerald-600',
    },
    {
      title: 'إشغال الطاولات',
      value: `${stats.activeTablesCount} / ${stats.totalTablesCount || 10}`,
      change: stats.totalTablesCount > 0 ? `${Math.round((stats.activeTablesCount / stats.totalTablesCount) * 100)}% إشغال` : 'جاهزة للزبائن',
      isUp: stats.activeTablesCount > 0,
      icon: Users,
      accent: 'from-blue-500 to-indigo-600',
      bgGlow: 'bg-blue-500/10',
      textColor: 'text-blue-600',
    },
    {
      title: 'متوسط الفاتورة',
      value: `${stats.avgTicket} ₪`,
      change: stats.todayOrdersCount > 0 ? 'معدل الحساب' : '0 ₪',
      isUp: stats.avgTicket > 0,
      icon: CreditCard,
      accent: 'from-purple-500 to-violet-600',
      bgGlow: 'bg-purple-500/10',
      textColor: 'text-purple-600',
    },
  ];

  const statusBadges: Record<string, { bg: string; text: string }> = {
    'جديد': { bg: 'bg-rose-500/10 text-rose-600 border-rose-200', text: 'جديد' },
    'قيد التحضير': { bg: 'bg-amber-500/10 text-amber-600 border-amber-200', text: 'قيد التحضير' },
    'جاهز': { bg: 'bg-blue-500/10 text-blue-600 border-blue-200', text: 'جاهز للتقديم' },
    'تم التسليم': { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', text: 'مكتمل' },
    'completed': { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', text: 'مكتمل' },
  };

  const displayName = createdSlug ? createdSlug.replace(/-/g, ' ') : 'مطعمك';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-900" dir="rtl">
      
      {/* 1. Hero Hub — Eye-Friendly Soft Light Card */}
      <div className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs overflow-hidden">
        {/* Ambient Warm Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>النظام الإنتاجي متصل ويعمل لحظياً</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">الفرع الرئيسي • فلسطين</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black capitalize tracking-tight text-slate-900 flex items-center gap-2.5">
              <span>أهلاً بك، {displayName}</span>
              <ShieldCheck size={26} className="text-orange-500 shrink-0" />
            </h1>
            
            <p className="text-slate-600 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
              منيو مطعمك الحصري جاهز على الإنترنت لاستقبال مسح أكواد QR وتلقي الطلبات فوراً مع جرس تنبيه للمطبخ.
            </p>
          </div>

          {/* Live URL Pill & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-slate-400 block">رابط مطعمك الحصري:</span>
                <a href={directMenuUrl} target="_blank" className="font-mono text-xs font-bold text-slate-800 hover:text-orange-600 block truncate max-w-[200px]" dir="ltr">
                  {liveUrl}
                </a>
              </div>
              <button
                onClick={copyUrl}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border border-slate-200 shadow-2xs"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>

            <a
              href={directMenuUrl}
              target="_blank"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all text-center hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>فتح منيو الزبائن</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Sleek KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx} 
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500">{kpi.title}</span>
                <div className={`w-9 h-9 rounded-xl ${kpi.bgGlow} ${kpi.textColor} flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
                  {kpi.value}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <span className={`px-2 py-0.5 rounded-md ${kpi.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {kpi.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Modern Action Hub */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Sparkles size={16} className="text-orange-500" />
            <span>الوصول السريع والإدارة</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">كل ما تحتاجه لإدارة الصالة والمطبخ</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <Link
            href="/dashboard/menu"
            className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-500/40 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Utensils size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">قائمة الطعام</p>
                <p className="text-[11px] text-slate-400">إضافة أطباق وتعديل أسعار</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
          </Link>

          <Link
            href="/dashboard/tables"
            className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500/40 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <QrCode size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">أكواد الطاولات</p>
                <p className="text-[11px] text-slate-400">تنزيل وطباعة باركود QR</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>

          <Link
            href="/dashboard/orders"
            className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/40 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">متابعة الطلبات</p>
                <p className="text-[11px] text-slate-400">طلبات حية وتحديث فوري</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </Link>

          <Link
            href="/dashboard/staff/codes"
            className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-500/40 hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Key size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">رموز الموظفين</p>
                <p className="text-[11px] text-purple-600 font-semibold">كود 6 أرقام مؤقت</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
          </Link>

        </div>
      </div>

      {/* 4. Staff Access Code Feature Strip — Soft Comfort Theme */}
      <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Key size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-black text-slate-900">نظام رموز دخول الموظفين والشيفات (كود 6 أرقام)</h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">بدون بريد</span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl font-normal leading-relaxed">
              أنشئ كوداً مؤقتاً لكل موظف خدمة أو شيف مطبخ ليدخل مباشرة من شاشة المطبخ KDS بـ 6 أرقام فقط.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/staff/codes"
          className="relative z-10 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>توليد كود موظف</span>
          <ArrowLeftIcon />
        </Link>
      </div>

      {/* 5. Live Orders Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">أحدث طلبات الطاولات الحية</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">تحديث فوري تلقائي عند إرسال أي طلب من طاولات المطعم</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline"
            >
              <span>عرض شاشة الطلبات الكاملة</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-slate-400 font-medium">
            جاري فحص الطلبات الحية...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-10 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-xs">
              <ShoppingBag size={28} />
            </div>
            <h3 className="font-black text-slate-900 text-base mb-1.5">لا توجد طلبات واردة حتى الآن</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              بمجرد أن يجلس الزبون على طاولته ويمسح باركود الـ QR، سيصلك الطلب هنا ولشاشة المطبخ في أجزاء من الثانية مع صوت تنبيهي فوري.
            </p>

            {/* 3 Step Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mb-6">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">اطبع كود الطاولة</p>
                  <p className="text-[11px] text-slate-400">من صفحة الطاولات</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">يمسح الزبون الباركود</p>
                  <p className="text-[11px] text-slate-400">بكاميرا الهاتف مباشرة</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">يصلك إشعار فوري</p>
                  <p className="text-[11px] text-slate-400">مع صوت جرس الطلب</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard/tables"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
              >
                <QrCode size={14} />
                <span>عرض وطباعة أكواد الطاولات</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3 pr-3">رقم الطلب</th>
                  <th className="pb-3">الطاولة</th>
                  <th className="pb-3">الأطباق والوجبات</th>
                  <th className="pb-3">المجموع</th>
                  <th className="pb-3">الحالة</th>
                  <th className="pb-3">الوقت</th>
                  <th className="pb-3 pl-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const badge = statusBadges[order.status] || { bg: 'bg-slate-100 text-slate-600', text: order.status };
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pr-3 font-mono font-bold text-slate-900">
                        {order.id}
                        {order.isNew && (
                          <span className="mr-1.5 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-black">جديد</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                          طاولة {order.table}
                        </span>
                      </td>
                      <td className="py-3.5 font-medium text-slate-700 max-w-xs truncate">
                        {order.items}
                      </td>
                      <td className="py-3.5 font-black text-slate-900">
                        {order.total} ₪
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge.bg}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 font-medium">
                        {order.time}
                      </td>
                      <td className="py-3.5 pl-3 text-center">
                        <Link
                          href="/dashboard/orders"
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-orange-500 hover:text-white font-bold text-[11px] text-slate-600 transition-colors inline-block"
                        >
                          إدارة
                        </Link>
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

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}
