'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { 
  TrendingUp, ShoppingBag, CreditCard, Activity,
  Utensils, Store
} from 'lucide-react';
import { 
  bestSellers, busyHours, dailySales, tables, branches, summaryStats, addonConversion 
} from '@/data/demo-data';

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const kpis = [
    { title: 'المبيعات (30 يوم)', value: `${summaryStats.totalSales30Days.toLocaleString()}₪`, change: `+${summaryStats.revenueGrowth}%`, isUp: true, icon: TrendingUp },
    { title: 'الطلبات', value: summaryStats.totalOrders30Days.toLocaleString(), change: `+${summaryStats.ordersGrowth}%`, isUp: true, icon: ShoppingBag },
    { title: 'متوسط الطلب', value: `${summaryStats.averageOrderValue}₪`, change: '+5.2%', isUp: true, icon: CreditCard },
    { title: 'نسبة النمو', value: `${summaryStats.revenueGrowth}%`, change: '+4.3%', isUp: true, icon: Activity },
  ];

  const tableStatusColors = {
    'فارغة': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20',
    'مشغولة': 'bg-orange-500/20 text-orange-500 border-orange-500/20',
    'محجوزة': 'bg-blue-500/20 text-blue-500 border-blue-500/20',
  };

  const getTableColor = (status: string) => {
    return tableStatusColors[status as keyof typeof tableStatusColors] || 'bg-slate-500/20 text-slate-500 border-slate-500/20';
  };

  const safeAddonConversion = addonConversion || [
    { name: 'بطاطا مقلية', rate: 45 },
    { name: 'مشروب غازي', rate: 62 },
    { name: 'صوص إضافي', rate: 38 },
    { name: 'سلطة جانبية', rate: 15 }
  ];

  const safeTables = tables || Array(15).fill(0).map((_, i) => ({ 
    id: `T${i+1}`, 
    status: i % 3 === 0 ? 'مشغولة' : i % 5 === 0 ? 'محجوزة' : 'فارغة', 
    capacity: 4 
  }));

  const safeBranches = branches || [
    { name: 'الفرع الرئيسي - نابلس', sales: '85,000₪', orders: '1,200', status: 'مفتوح' },
    { name: 'فرع رام الله', sales: '60,200₪', orders: '845', status: 'مفتوح' },
    { name: 'فرع طولكرم (قريباً)', sales: '0₪', orders: '0', status: 'مغلق' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-1">التقارير والتحليلات المالية — Burger House نابلس</h1>
        <p className="text-slate-500 text-xs md:text-sm">إحصائيات نمو الإيرادات، ساعات الذروة، ونسب زيادة المبيعات (Upselling)</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                <kpi.icon size={24} />
              </div>
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${kpi.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`} dir="ltr">
                {kpi.change}
              </div>
            </div>
            <h3 className="text-slate-500 text-xs font-medium mb-1">{kpi.title}</h3>
            <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {isClient && (
        <>
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-6">اتجاه المبيعات (أسبوعي)</h3>
              <div className="h-[300px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySales} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94a3b8" tick={{ fill: '#64748b' }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} tickFormatter={(val) => `₪${val}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                      itemStyle={{ color: '#f97316' }}
                    />
                    <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Best Sellers */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-6">الأصناف الأكثر مبيعاً</h3>
              <div className="h-[300px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bestSellers?.slice(0, 8) || []} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                      cursor={{ fill: '#fff7ed' }}
                    />
                    <Bar dataKey="sales" name="الكمية المباعة" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2 & Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Busy Hours */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:col-span-2 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-6">أوقات الذروة</h3>
              <div className="h-[300px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={busyHours || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#64748b' }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                      cursor={{ fill: '#fff7ed' }}
                    />
                    <Bar dataKey="orders" name="عدد الطلبات" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Addon Conversion */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-6">معدل تحويل الإضافات</h3>
              <div className="space-y-4">
                {safeAddonConversion.map((addon, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 font-medium">{addon.name}</span>
                      <span className="text-orange-600 font-bold">{addon.rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${addon.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tables Overview */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-base font-bold text-slate-900">حالة الطاولات (الصالة الرئيسية)</h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> فارغة</span>
            <span className="flex items-center gap-1.5 text-orange-600"><div className="w-2 h-2 rounded-full bg-orange-500"></div> مشغولة</span>
            <span className="flex items-center gap-1.5 text-blue-600"><div className="w-2 h-2 rounded-full bg-blue-500"></div> محجوزة</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {safeTables.map((table, idx) => (
            <div 
              key={idx} 
              className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform hover:scale-105 ${getTableColor(table.status)}`}
            >
              <Utensils size={24} />
              <div className="font-bold text-sm">{table.id}</div>
              <div className="text-xs opacity-90">{table.seats} أشخاص</div>
            </div>
          ))}
        </div>
      </div>

      {/* Branches */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">الفروع</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeBranches.map((branch, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600">
                  <Store size={20} />
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-sm">{branch.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                    {branch.city}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs pt-3 border-t border-slate-100 mt-2">
                <div className="text-slate-500 font-medium">المبيعات: <span className="text-slate-900 font-bold">{branch.todaySales.toLocaleString()}₪</span></div>
                <div className="text-slate-500 font-medium">الطلبات: <span className="text-slate-900 font-bold">{branch.todayOrders}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
