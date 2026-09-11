'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, ShoppingBag, CreditCard,
  Copy, Check, ExternalLink,
  QrCode, ChefHat, ArrowUpRight,
  Plus, Users
} from 'lucide-react';

export default function ProductionDashboardOverview() {
  const [createdSlug, setCreatedSlug] = useState<string>('burger-house-nablus');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSlug = params.get('created');
      if (urlSlug) {
        setCreatedSlug(urlSlug);
      } else {
        fetch('/api/auth/session')
          .then((res) => res.json())
          .then((data) => {
            if (data.authenticated && data.user?.restaurantSlug) {
              setCreatedSlug(data.user.restaurantSlug);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  const liveUrl = `https://menus-ps.vercel.app/r/${createdSlug}`;
  const directMenuUrl = `/r/${createdSlug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const kpis = [
    { title: 'مبيعات اليوم', value: '1,420₪', change: '+12%', isUp: true, icon: TrendingUp },
    { title: 'طلبات اليوم', value: '28 طلب', change: '+8%', isUp: true, icon: ShoppingBag },
    { title: 'طاولات نشطة الآن', value: '6 / 15', change: '40% إشغال', isUp: true, icon: Users },
    { title: 'متوسط الفاتورة', value: '50.7₪', change: '+4.2%', isUp: true, icon: CreditCard },
  ];

  const recentOrders = [
    { id: 'ORD-104', table: 3, items: '2x برجر كلاسيك، 1x بطاطا مقلية، 2x كولا', total: 98, status: 'جديد', time: 'منذ دقيقة', isNew: true },
    { id: 'ORD-103', table: 7, items: '1x بيتزا مارجريتا، 1x بطاطا ودجز', total: 65, status: 'قيد التحضير', time: 'منذ 6 دقائق', isNew: false },
    { id: 'ORD-102', table: 1, items: '3x ساندويش شاورما، 3x عصير برتقال', total: 84, status: 'جاهز', time: 'منذ 14 دقيقة', isNew: false },
    { id: 'ORD-101', table: 10, items: '1x باستا ألفريدو دجاج', total: 42, status: 'تم التسليم', time: 'منذ 25 دقيقة', isNew: false },
  ];

  const statusBadges: Record<string, { bg: string; text: string }> = {
    'جديد': { bg: 'bg-rose-500/10 text-rose-600 border-rose-200', text: 'جديد' },
    'قيد التحضير': { bg: 'bg-amber-500/10 text-amber-600 border-amber-200', text: 'قيد التحضير' },
    'جاهز': { bg: 'bg-blue-500/10 text-blue-600 border-blue-200', text: 'جاهز للتقديم' },
    'تم التسليم': { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', text: 'مكتمل' },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900" dir="rtl">
      
      {/* 1. Header Banner & Live Link Alert */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-l from-orange-500 via-orange-600 to-amber-500 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-black backdrop-blur-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>النظام الإنتاجي فعال 100%</span>
              </span>
              <span className="text-white/80 text-xs font-medium">الفرع الرئيسي</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black capitalize">
              مرحباً بك في لوحة تحكم {createdSlug.replace(/-/g, ' ')}
            </h1>
            
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-2xl font-medium leading-relaxed">
              رابط موقع مطعمك ومنيو الزبائن الحصري متاح على الإنترنت وجاهز لمسح أكواد الطاولات واستقبال الطلبات فوراً.
            </p>
          </div>

          {/* Quick Action Button Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between gap-3 border border-white/20">
              <div className="min-w-0 pr-1">
                <span className="text-[10px] text-white/70 font-bold block">رابط مطعمك الحصري:</span>
                <a href={directMenuUrl} target="_blank" className="font-mono text-xs font-bold text-white hover:underline block truncate max-w-[190px]" dir="ltr">
                  {liveUrl}
                </a>
              </div>
              <button
                onClick={copyUrl}
                className="px-3 py-1.5 rounded-xl bg-white text-orange-600 hover:bg-orange-50 font-black text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer shrink-0"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>

            <a
              href={directMenuUrl}
              target="_blank"
              className="px-4 py-3 rounded-2xl bg-white text-slate-900 hover:bg-orange-50 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all text-center"
            >
              <span>فتح المنيو</span>
              <ExternalLink size={14} className="text-orange-500" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Fast KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">{kpi.title}</span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Icon size={16} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg sm:text-2xl font-black text-slate-900">{kpi.value}</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Quick Action Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/dashboard/menu"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-500/50 hover:bg-orange-50/20 shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Plus size={20} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black text-slate-900">إضافة طبق جديد</p>
            <p className="text-[11px] text-slate-400">تعديل المنيو والأسعار</p>
          </div>
        </Link>

        <Link
          href="/dashboard/tables"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-500/50 hover:bg-orange-50/20 shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <QrCode size={20} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black text-slate-900">طباعة بطاقات QR</p>
            <p className="text-[11px] text-slate-400">تنزيل باركود الطاولات</p>
          </div>
        </Link>

        <Link
          href="/dashboard/orders"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-orange-500/50 hover:bg-orange-50/20 shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black text-slate-900">متابعة الطلبات</p>
            <p className="text-[11px] text-slate-400">طلبات المطبخ اللحظية</p>
          </div>
        </Link>

        <Link
          href="/staff"
          target="_blank"
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ChefHat size={20} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black text-white">شاشة المطبخ KDS</p>
            <p className="text-[11px] text-slate-300">لشاشات التابلت والجدار</p>
          </div>
        </Link>
      </div>

      {/* 4. Live Orders Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">آخر طلبات الطاولات الحية</h2>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">تحديث تلقائي وفوري للطلبات الواردة عبر مسح الـ QR</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/orders"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline"
            >
              <span>عرض كل الطلبات الحية</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                <th className="pb-3 pr-2">رقم الطلب</th>
                <th className="pb-3">الطاولة</th>
                <th className="pb-3">الأطباق والوجبات</th>
                <th className="pb-3">المجموع</th>
                <th className="pb-3">الحالة</th>
                <th className="pb-3">الوقت</th>
                <th className="pb-3 pl-2 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => {
                const badge = statusBadges[order.status] || { bg: 'bg-slate-100 text-slate-600', text: order.status };
                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pr-2 font-mono font-bold text-slate-900">
                      {order.id}
                      {order.isNew && (
                        <span className="mr-1.5 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-black">جديد</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <span className="font-extrabold bg-slate-100 text-slate-800 px-2 py-1 rounded-lg">
                        طاولة {order.table}
                      </span>
                    </td>
                    <td className="py-3.5 font-medium text-slate-700 max-w-xs truncate">
                      {order.items}
                    </td>
                    <td className="py-3.5 font-extrabold text-slate-900">
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
                    <td className="py-3.5 pl-2 text-center">
                      <Link
                        href="/dashboard/orders"
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-500 hover:text-white font-bold text-[11px] text-slate-600 transition-colors inline-block"
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
      </div>

    </div>
  );
}
