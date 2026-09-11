'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  TrendingUp, ShoppingBag, Armchair, QrCode, 
  ClipboardList, UtensilsCrossed, Smartphone, BarChart3, Gift,
  Clock, ExternalLink, ChevronLeft
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function DemoHubPage() {
  const { language, direction } = useLanguage();
  const isAr = language === 'ar';

  const kpis = [
    { title: isAr ? 'إجمالي مبيعات اليوم' : 'Today\'s Total Sales', value: '3,350 ₪', change: '+12.5%', isUp: true, icon: TrendingUp },
    { title: isAr ? 'الطلبات المكتملة' : 'Completed Orders', value: isAr ? '43 طلب' : '43 Orders', change: '+5.2%', isUp: true, icon: ShoppingBag },
    { title: isAr ? 'إشغال الطاولات' : 'Table Occupancy', value: '9 / 15', change: isAr ? '60% إشغال' : '60% Occupied', isUp: true, icon: Armchair },
    { title: isAr ? 'نسبة طلبات كود QR' : 'QR Order Ratio', value: '72%', change: '+8.1%', isUp: true, icon: QrCode },
  ];

  const quickActions = [
    { 
      title: isAr ? 'إدارة الطلبات الحية' : 'Live Orders Management', 
      desc: isAr ? 'متابعة الطلبات وتحديث حالتها خطوة بخطوة' : 'Track and update live table orders in real-time', 
      icon: ClipboardList, 
      href: '/demo/orders', 
      badge: isAr ? '3 جديدة' : '3 New',
      color: 'text-rose-700', 
      bg: 'bg-rose-100' 
    },
    { 
      title: isAr ? 'تعديل قائمة الطعام' : 'Menu Management', 
      desc: isAr ? 'إضافة أطباق جديدة وتعديل الأسعار وحالات التوفر' : 'Add new items, adjust prices, and manage availability', 
      icon: UtensilsCrossed, 
      href: '/demo/menu-editor', 
      color: 'text-orange-700', 
      bg: 'bg-orange-100' 
    },
    { 
      title: isAr ? 'إدارة الطاولات وQR' : 'Tables & QR Management', 
      desc: isAr ? 'متابعة إشغال الصالة وطباعة وتنزيل أكواد الطاولات' : 'Floor plan status, table QR generation and printing', 
      icon: Armchair, 
      href: '/demo/tables', 
      color: 'text-amber-700', 
      bg: 'bg-amber-100' 
    },
    { 
      title: isAr ? 'منيو العميل للجوال' : 'Customer Mobile Menu', 
      desc: isAr ? 'معاينة تجربة الزبون المباشرة عند مسح الكود' : 'Preview exact customer ordering experience upon scanning', 
      icon: Smartphone, 
      href: '/m', 
      targetBlank: true,
      color: 'text-blue-700', 
      bg: 'bg-blue-100' 
    },
    { 
      title: isAr ? 'التقارير والتحليلات' : 'Analytics & Financials', 
      desc: isAr ? 'إحصائيات المبيعات، أكثر الأطباق طلباً، وساعات الذروة' : 'Revenue growth, top selling dishes, and peak hours', 
      icon: BarChart3, 
      href: '/demo/dashboard', 
      color: 'text-emerald-700', 
      bg: 'bg-emerald-100' 
    },
    { 
      title: isAr ? 'العروض والخصومات' : 'Deals & Discounts', 
      desc: isAr ? 'إنشاء كوبونات الخصم والعروض الترويجية للزبائن' : 'Create promo codes and seasonal special offers', 
      icon: Gift, 
      href: '/demo/offers', 
      color: 'text-purple-700', 
      bg: 'bg-purple-100' 
    },
  ];

  const mockRecentOrders = [
    { id: '#ORD-1045', table: isAr ? 'طاولة 4' : 'Table 4', items: isAr ? '2× دبل سماش، 1× تشيز فرايز' : '2× Double Smash, 1× Cheese Fries', total: '150 ₪', status: isAr ? 'مكتمل' : 'Completed', color: 'bg-slate-800 text-white', time: isAr ? 'منذ 5 دقائق' : '5m ago' },
    { id: '#ORD-1044', table: isAr ? 'طاولة 12' : 'Table 12', items: isAr ? '1× كلاسيك برغر، 1× كولا' : '1× Classic Burger, 1× Cola', total: '85 ₪', status: isAr ? 'قيد التحضير' : 'Preparing', color: 'bg-amber-500 text-white', time: isAr ? 'منذ 12 دقيقة' : '12m ago' },
    { id: '#ORD-1043', table: isAr ? 'طاولة 8' : 'Table 8', items: isAr ? '3× راب دجاج، 2× مياه' : '3× Chicken Wrap, 2× Water', total: '110 ₪', status: isAr ? 'بانتظار التأكيد' : 'Pending', color: 'bg-rose-500 text-white', time: isAr ? 'منذ 18 دقيقة' : '18m ago' },
    { id: '#ORD-1042', table: isAr ? 'طاولة 2' : 'Table 2', items: isAr ? '1× تشيكن برغر، 1× ودجز' : '1× Chicken Burger, 1× Wedges', total: '45 ₪', status: isAr ? 'مكتمل' : 'Completed', color: 'bg-slate-800 text-white', time: isAr ? 'منذ 35 دقيقة' : '35m ago' },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10 font-sans text-slate-800" dir={direction}>
      
      {/* 1. Header Card - Balanced typography */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              {isAr ? 'مرحباً بك في Burger House نابلس 👋' : 'Welcome to Burger House Nablus 👋'}
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {isAr ? 'المطعم مفتوح الآن' : 'Open Now'}
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm font-normal">
            {isAr 
              ? `نظرة عامة حية ومباشرة على نشاط المطعم — ${new Date().toLocaleDateString('ar-EG')}` 
              : `Live real-time operational overview — ${new Date().toLocaleDateString('en-US')}`}
          </p>
        </div>

        <Link
          href="/m"
          target="_blank"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-600/20 transition-all shrink-0"
        >
          <span>{isAr ? '📱 فتح منيو الزبون المباشر للجوال' : '📱 Open Customer QR Menu'}</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* 2. KDS Kitchen Banner */}
      <div className="bg-orange-50/70 border border-orange-200/80 text-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xl shrink-0 shadow-xs font-bold">
            👨‍🍳
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {isAr ? 'شاشة موظفي المطبخ والتجهيز (KDS)' : 'Kitchen Display Screen (KDS)'}
              </h3>
              <span className="bg-orange-100 text-orange-900 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-200">
                {isAr ? 'مستقلة وخالية من الأسعار' : 'Dedicated · No Pricing'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-normal mt-0.5 line-clamp-1 sm:line-clamp-none">
              {isAr 
                ? 'فصل العمليات التشغيلية عن الإدارة — يرى طاقم المطبخ فقط تفاصيل الأطباق وأرقام الطاولات.'
                : 'Decoupled operations: kitchen staff view table numbers and dishes without financial data.'}
            </p>
          </div>
        </div>
        <Link
          href="/staff"
          target="_blank"
          className="w-full md:w-auto text-center justify-center px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 active:scale-95 rounded-xl font-bold text-xs shadow-xs transition-all shrink-0 flex items-center gap-1.5"
        >
          <span>{isAr ? 'فتح شاشة الموظفين' : 'Open Staff Screen'}</span>
          <ExternalLink size={14} />
        </Link>
      </div>

      {/* 3. 4 KPIs Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.isUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {kpi.change}
              </span>
            </div>
            <div>
              <h3 className="text-slate-500 text-xs sm:text-sm font-medium mb-1 truncate">{kpi.title}</h3>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 4. Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {isAr ? 'أقسام لوحة التحكم الرئيسية' : 'Main Dashboard Sections'}
          </h2>
          <span className="text-xs sm:text-sm text-slate-500 font-normal">
            {isAr ? 'الوصول السريع لجميع الأدوات' : 'Quick access to all tools'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {quickActions.map((action, idx) => (
            <Link 
              href={action.href} 
              key={idx}
              target={action.targetBlank ? '_blank' : undefined}
            >
              <div className="bg-white border border-slate-200/80 hover:border-orange-400 rounded-2xl p-4 transition-all group cursor-pointer h-full shadow-xs hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className={`p-2.5 rounded-xl ${action.bg} ${action.color} shrink-0`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    {action.badge && (
                      <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-md shadow-xs">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors mb-1 truncate">
                      {action.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed line-clamp-2">
                      {action.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
                  <span>{isAr ? 'فتح القسم' : 'Open'}</span>
                  <ChevronLeft size={15} className={`transition-transform ${isAr ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1 rotate-180'}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Recent Orders Live Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {isAr ? 'أحدث الطلبات النشطة' : 'Latest Live Orders'}
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <Link href="/demo/orders" className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700">
            {isAr ? 'عرض كل الطلبات في شاشة الطلبات ←' : 'View all orders →'}
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-3.5">{isAr ? 'رقم الطلب' : 'Order ID'}</th>
                <th className="p-3.5">{isAr ? 'الموقع / الطاولة' : 'Table'}</th>
                <th className="p-3.5">{isAr ? 'الأصناف' : 'Items'}</th>
                <th className="p-3.5">{isAr ? 'المبلغ' : 'Amount'}</th>
                <th className="p-3.5">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5">{isAr ? 'الوقت' : 'Time'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockRecentOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{order.id}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{order.table}</td>
                  <td className="p-3.5 text-slate-600 font-normal truncate max-w-xs">{order.items}</td>
                  <td className="p-3.5 font-bold text-orange-600 text-sm sm:text-base">{order.total}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-2xs ${order.color}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400 font-normal flex items-center gap-1 mt-1">
                    <Clock size={13} className="text-slate-400" />
                    <span>{order.time}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-2.5">
          {mockRecentOrders.map((order, idx) => (
            <div key={idx} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">{order.id}</span>
                  <span className="bg-slate-900 text-white font-medium text-xs px-2 py-0.5 rounded-md">
                    {order.table}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${order.color}`}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-normal">{order.items}</p>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <span className="font-bold text-orange-600">{order.total}</span>
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Clock size={11} />
                  {order.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
