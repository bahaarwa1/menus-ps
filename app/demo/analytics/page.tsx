'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dailySales, bestSellers, busyHours, addonConversion, summaryStats } from '@/data/demo-data';

const statCards = [
  { label: 'إجمالي المبيعات (30 يوم)', value: '98,650₪', change: '+18.5%', positive: true, icon: '💰' },
  { label: 'إجمالي الطلبات', value: '1,284', change: '+12.3%', positive: true, icon: '📦' },
  { label: 'متوسط الطلب', value: '76.8₪', change: '+5.2%', positive: true, icon: '🧾' },
  { label: 'طلبات QR', value: '72%', change: '+8%', positive: true, icon: '📱' },
];

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fff7ed'];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10" dir="rtl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">📊 التحليلات المتقدمة</h1>
        <p className="text-slate-500 text-sm md:text-base mt-1">بيانات آخر 30 يوم — Burger House نابلس</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4"
      >
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            variants={item}
            className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xl sm:text-2xl">{stat.icon}</span>
              <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-black text-slate-900">{stat.value}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Sales Trend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm"
      >
        <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">📈 اتجاه المبيعات (30 يوم)</h2>
        {mounted && (
          <div className="h-60 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    color: '#0f172a',
                    direction: 'rtl',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: any) => [`${value.toLocaleString()}₪`, 'المبيعات']}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 6, fill: '#f97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">🏆 الأكثر مبيعًا</h2>
          {mounted && (
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 15, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={85}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      direction: 'rtl',
                    }}
                    formatter={(value: any) => [`${value}`, 'الكمية']}
                  />
                  <Bar dataKey="quantity" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Busy Hours */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">⏰ ساعات الذروة</h2>
          {mounted && (
            <div className="h-60 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={busyHours} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      direction: 'rtl',
                    }}
                    formatter={(value: any) => [`${value}`, 'طلبات']}
                  />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                    {busyHours.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.orders > 30 ? '#ef4444' : entry.orders > 20 ? '#f97316' : '#fb923c'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Orders Trend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">📦 عدد الطلبات اليومي</h2>
          {mounted && (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      direction: 'rtl',
                    }}
                    formatter={(value: any) => [`${value}`, 'طلب']}
                  />
                  <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* QR Orders Pie */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm"
        >
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">📱 نسبة طلبات QR</h2>
          {mounted && (
            <div className="h-56 sm:h-64 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'طلبات QR', value: 72 },
                      { name: 'طلبات تقليدية', value: 28 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#f97316" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                      direction: 'rtl',
                    }}
                    formatter={(value: any) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <div className="text-3xl font-bold text-orange-500">72%</div>
                <div className="text-xs text-slate-500 font-medium">طلبات QR</div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add-on Conversion */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-base font-bold text-slate-900 mb-4">✨ نسبة قبول الإضافات (Upselling)</h2>
        <div className="space-y-4">
          {addonConversion.map((addon) => (
            <div key={addon.name} className="flex items-center gap-4">
              <div className="w-28 text-sm text-slate-700 font-medium shrink-0">{addon.name}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${addon.rate}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className={`h-full rounded-full ${
                    addon.rate >= 60 ? 'bg-emerald-500' : addon.rate >= 50 ? 'bg-orange-500' : 'bg-amber-500'
                  }`}
                />
              </div>
              <div className="w-24 text-left">
                <span className={`text-sm font-bold ${
                  addon.rate >= 60 ? 'text-emerald-600' : addon.rate >= 50 ? 'text-orange-600' : 'text-amber-600'
                }`}>
                  {addon.rate}%
                </span>
                <span className="text-xs text-slate-400 mr-1 font-medium">({addon.accepted}/{addon.offered})</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Revenue by Best Sellers */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-base font-bold text-slate-900 mb-4">💰 إيرادات حسب الصنف</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="text-right py-3 px-2 font-semibold">#</th>
                <th className="text-right py-3 px-2 font-semibold">الصنف</th>
                <th className="text-right py-3 px-2 font-semibold">الكمية</th>
                <th className="text-right py-3 px-2 font-semibold">الإيراد</th>
                <th className="text-right py-3 px-2 font-semibold">النسبة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bestSellers.map((seller, i) => {
                const totalRevenue = bestSellers.reduce((sum, s) => sum + s.revenue, 0);
                const percentage = ((seller.revenue / totalRevenue) * 100).toFixed(1);
                return (
                  <tr key={seller.name} className="hover:bg-orange-50/40 transition-colors">
                    <td className="py-3 px-2 text-slate-400 font-medium">{i + 1}</td>
                    <td className="py-3 px-2 text-slate-800 font-bold">{seller.name}</td>
                    <td className="py-3 px-2 text-slate-600">{seller.quantity}</td>
                    <td className="py-3 px-2 text-orange-600 font-bold">{seller.revenue.toLocaleString()}₪</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-orange-500 h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
