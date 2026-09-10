'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  TrendingUp, ShoppingBag, Armchair, QrCode, 
  ClipboardList, UtensilsCrossed, Smartphone, BarChart3, Gift,
  Clock, ExternalLink, ChevronLeft
} from 'lucide-react';

export default function DemoHubPage() {
  const kpis = [
    { title: 'إجمالي مبيعات اليوم', value: '3,350 ₪', change: '+12.5%', isUp: true, icon: TrendingUp },
    { title: 'الطلبات المكتملة', value: '43 طلب', change: '+5.2%', isUp: true, icon: ShoppingBag },
    { title: 'إشغال الطاولات', value: '9 / 15', change: '60% إشغال', isUp: true, icon: Armchair },
    { title: 'نسبة طلبات كود QR', value: '72%', change: '+8.1%', isUp: true, icon: QrCode },
  ];

  const quickActions = [
    { 
      title: 'إدارة الطلبات الحية', 
      desc: 'متابعة الطلبات وتحديث حالتها خطوة بخطوة', 
      icon: ClipboardList, 
      href: '/demo/orders', 
      badge: '3 جديدة',
      color: 'text-rose-600', 
      bg: 'bg-rose-50' 
    },
    { 
      title: 'تعديل قائمة الطعام', 
      desc: 'إضافة أطباق جديدة وتعديل الأسعار وحالات التوفر', 
      icon: UtensilsCrossed, 
      href: '/demo/menu-editor', 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
    { 
      title: 'إدارة الطاولات وQR', 
      desc: 'متابعة إشغال الصالة وطباعة وتنزيل أكواد الطاولات', 
      icon: Armchair, 
      href: '/demo/tables', 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    },
    { 
      title: 'منيو العميل للجوال', 
      desc: 'معاينة تجربة الزبون المباشرة عند مسح الكود', 
      icon: Smartphone, 
      href: '/m', 
      targetBlank: true,
      color: 'text-blue-600', 
      bg: 'bg-blue-50' 
    },
    { 
      title: 'التقارير والتحليلات', 
      desc: 'إحصائيات المبيعات، أكثر الأطباق طلباً، وساعات الذروة', 
      icon: BarChart3, 
      href: '/demo/dashboard', 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      title: 'العروض والخصومات', 
      desc: 'إنشاء كوبونات الخصم والعروض الترويجية للزبائن', 
      icon: Gift, 
      href: '/demo/offers', 
      color: 'text-purple-600', 
      bg: 'bg-purple-50' 
    },
  ];

  const mockRecentOrders = [
    { id: '#ORD-1045', table: 'طاولة 4', items: '2× دبل سماش، 1× تشيز فرايز', total: '150 ₪', status: 'مكتمل', color: 'bg-slate-100 text-slate-700', time: 'منذ 5 دقائق' },
    { id: '#ORD-1044', table: 'طاولة 12', items: '1× كلاسيك برغر، 1× كولا', total: '85 ₪', status: 'قيد التحضير', color: 'bg-amber-50 text-amber-700 border border-amber-200', time: 'منذ 12 دقيقة' },
    { id: '#ORD-1043', table: 'طاولة 8', items: '3× راب دجاج، 2× مياه', total: '110 ₪', status: 'بانتظار التأكيد', color: 'bg-rose-50 text-rose-700 border border-rose-200', time: 'منذ 18 دقيقة' },
    { id: '#ORD-1042', table: 'طاولة 2', items: '1× تشيكن برغر، 1× ودجز', total: '45 ₪', status: 'مكتمل', color: 'bg-slate-100 text-slate-700', time: 'منذ 35 دقيقة' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans text-slate-800" dir="rtl">
      
      {/* Clean Balanced Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg md:text-2xl font-black text-slate-900">مرحباً بك في Burger House نابلس 👋</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              المطعم مفتوح الآن
            </span>
          </div>
          <p className="text-slate-400 text-xs">نظرة عامة حية ومباشرة على نشاط المطعم — {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        <Link
          href="/m"
          target="_blank"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all shrink-0"
        >
          <span>📱 فتح منيو الزبون المباشر للجوال</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* Separation Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg sm:text-xl shrink-0">
            👨‍🍳
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-black">شاشة موظفي المطبخ والتجهيز (KDS)</h3>
              <span className="bg-white/25 text-white text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                مستقلة وبدون أسعار
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/90 mt-0.5 line-clamp-1 sm:line-clamp-none">
              فصل العمليات التشغيلية عن الإدارة — يرى الموظف تفاصيل الأصناف والطاولات فقط.
            </p>
          </div>
        </div>
        <Link
          href="/staff"
          target="_blank"
          className="w-full md:w-auto text-center justify-center px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-50 active:scale-95 rounded-xl font-black text-xs shadow-sm transition-all shrink-0 flex items-center gap-1.5"
        >
          <span>فتح شاشة الموظفين</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {/* 4 KPIs Cards - 2 Columns on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        {kpis.map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-2.5 rounded-xl bg-orange-50 text-orange-600">
                <kpi.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full ${kpi.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {kpi.change}
              </span>
            </div>
            <div>
              <h3 className="text-slate-400 text-[11px] sm:text-xs font-medium mb-0.5 truncate">{kpi.title}</h3>
              <p className="text-lg sm:text-2xl font-black text-slate-900">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 6 Perfectly Balanced Quick Actions (2 col mobile, 3 col desktop) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm sm:text-base font-black text-slate-900">أقسام لوحة التحكم</h2>
          <span className="text-[11px] sm:text-xs text-slate-400">الوصول السريع لجميع الأدوات</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3.5">
          {quickActions.map((action, idx) => (
            <Link 
              href={action.href} 
              key={idx}
              target={action.targetBlank ? '_blank' : undefined}
            >
              <div className="bg-white border border-slate-200/80 hover:border-orange-500 rounded-2xl p-3 sm:p-4 transition-all group cursor-pointer h-full shadow-xs hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className={`p-2 sm:p-2.5 rounded-xl ${action.bg} ${action.color} shrink-0`}>
                      <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    {action.badge && (
                      <span className="text-[9px] sm:text-[10px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-md animate-pulse">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors mb-0.5 truncate">
                      {action.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-tight line-clamp-2">{action.desc}</p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-bold text-orange-600">
                  <span>فتح</span>
                  <ChevronLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders Live Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-slate-900">أحدث الطلبات النشطة</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <Link href="/demo/orders" className="text-xs font-bold text-orange-600 hover:text-orange-700">
            عرض كل الطلبات في لوحة الطلبات ←
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
              <tr>
                <th className="p-3">رقم الطلب</th>
                <th className="p-3">الموقع / الطاولة</th>
                <th className="p-3">الأصناف</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockRecentOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-black text-slate-900">{order.id}</td>
                  <td className="p-3 font-bold text-slate-700">{order.table}</td>
                  <td className="p-3 text-slate-500 truncate max-w-xs">{order.items}</td>
                  <td className="p-3 font-black text-orange-600">{order.total}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${order.color}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    <span>{order.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
