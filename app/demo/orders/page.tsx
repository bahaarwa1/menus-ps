'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, CheckCircle2, Clock, PlusCircle, RotateCcw, 
  Search, Printer, ChevronRight, Check, ExternalLink, X, Flame
} from 'lucide-react';
import { orders as initialOrders } from '@/data/demo-data';
import { printThermalReceipt } from '@/lib/print-utils';
import { useLanguage } from '@/context/LanguageContext';

// Mock images for demonstration
const mockImages: Record<string, string> = {
  'دبل سماش برغر': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
  'تشيز بيكون فرايز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
  'تشيز فرايز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
  'كوكا كولا مثلجة': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80',
  'كولا': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80',
  'كلاسيك برغر فاخر': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80',
  'وجبة أطفال': 'https://images.unsplash.com/photo-1625937759403-1c39050d276c?w=500&q=80',
  'بيتزا مارغريتا': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80',
  'عصير برتقال': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80',
  'تشيكن كريسبي': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80',
  'بطاطا ودجز': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80',
};

export default function OrdersManagementPage() {
  const [ordersList, setOrdersList] = useState<any[]>(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrders[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  const { language, direction } = useLanguage();

  const selectedOrder = ordersList.find(o => o.id === selectedOrderId) || ordersList[0];

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const addNewSimulatedOrder = () => {
    const newId = `ORD-0${Math.floor(Math.random() * 900 + 100)}`;
    const randomTable = Math.floor(Math.random() * 14 + 1);
    const newOrder = {
      id: newId,
      table: randomTable,
      items: [
        { name: 'دبل سماش برغر', quantity: 2, price: 42, extras: ['جبنة شيدر'], customization: 'ميديوم' },
        { name: 'تشيز بيكون فرايز', quantity: 1, price: 22 },
        { name: 'كوكا كولا مثلجة', quantity: 2, price: 7 }
      ],
      total: 120,
      status: 'جديد',
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      customerName: `زبون طاولة ${randomTable}`,
      notes: 'بدون بصل في أحد البرغرين، صوص خارجي'
    };
    setOrdersList(prev => [newOrder, ...prev]);
    setSelectedOrderId(newId);
  };

  const resetOrders = () => {
    setOrdersList(initialOrders);
    setSelectedOrderId(initialOrders[0]?.id || '');
  };

  const handlePrintReceipt = (order: any) => {
    if (!order) return;
    printThermalReceipt({
      id: order.id,
      table: order.table,
      time: order.time,
      total: order.total,
      items: order.items || [],
      notes: order.notes,
      restaurantName: 'Burger House نابلس'
    });
  };

  // Filter orders
  const filteredOrders = ordersList.filter(o => {
    const matchesFilter = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `طاولة ${o.table}`.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  // Solid, high-contrast, saturated badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'جديد':
        return (
          <span className="bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>بانتظار التأكيد</span>
          </span>
        );
      case 'قيد التحضير':
        return (
          <span className="bg-amber-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-spin" />
            <span>قيد التحضير</span>
          </span>
        );
      case 'جاهز':
        return (
          <span className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <Check size={12} strokeWidth={3} />
            <span>جاهز للتسليم</span>
          </span>
        );
      case 'تم التسليم':
        return (
          <span className="bg-slate-800 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-2xs">
            مكتمل
          </span>
        );
      default:
        return null;
    }
  };

  const newOrdersCount = ordersList.filter(o => o.status === 'جديد').length;
  const preparingCount = ordersList.filter(o => o.status === 'قيد التحضير').length;
  const readyCount = ordersList.filter(o => o.status === 'جاهز').length;

  const renderInspectorContent = (order: any, isMobileModal: boolean = false) => {
    if (!order) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500 text-xs">
          اختر طلباً من القائمة لعرض تفاصيله
        </div>
      );
    }

    return (
      <div className={`space-y-3 ${isMobileModal ? '' : 'bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 max-h-[calc(100vh-170px)] overflow-y-auto'}`}>
        {/* Header */}
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">{order.id}</h3>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              طلب طاولة <span className="text-orange-600 font-bold">{order.table}</span> — {order.time}
            </p>
          </div>

          <button
            onClick={() => handlePrintReceipt(order)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
            title="طباعة بون المطبخ"
          >
            <Printer size={14} />
            <span>طباعة</span>
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <p className="text-xs font-bold text-slate-700">محتويات الطلب ({order.items.length} أصناف)</p>
          {order.items.map((item: any, iIdx: number) => {
            const img = mockImages[item.name];
            return (
              <div key={iIdx} className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {item.quantity}×
                  </span>
                  {img && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200/70">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm truncate text-slate-800">{item.name}</p>
                    {item.customization && (
                      <span className="text-[11px] text-orange-600 font-medium block">• {item.customization}</span>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <span className="text-[11px] text-slate-500 font-normal block">• + {item.extras.join('، ')}</span>
                    )}
                  </div>
                </div>
                <span className="font-bold text-xs sm:text-sm text-slate-800 shrink-0">{item.price * item.quantity} ₪</span>
              </div>
            );
          })}
        </div>

        {/* Customer Notes */}
        {order.notes && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 shadow-2xs">
            <span className="block mb-1 font-bold text-amber-800">⚠️ ملاحظات الزبون الخاصة:</span>
            <p className="leading-relaxed text-slate-700">{order.notes}</p>
          </div>
        )}

        {/* Bill Details */}
        <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>المجموع الفرعي:</span>
            <span className="font-semibold text-slate-700">{order.total} ₪</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>الضريبة والخدمة:</span>
            <span className="font-semibold text-emerald-600">مشمولة (0 ₪)</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-200/70">
            <span>الإجمالي المطلوب:</span>
            <span className="text-orange-600 font-extrabold text-base">{order.total} ₪</span>
          </div>
        </div>

        {/* Action Buttons Based on Status */}
        <div className="pt-1">
          {order.status === 'جديد' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'قيد التحضير')}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Flame size={16} />
              <span>قبول الطلب وبدء التحضير فوراً 🔥</span>
            </button>
          )}

          {order.status === 'قيد التحضير' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'جاهز')}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>الطلب جاهز للتسليم (طاولة {order.table}) ✅</span>
            </button>
          )}

          {order.status === 'جاهز' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'تم التسليم')}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} />
              <span>تم التسليم بنجاح وإغلاق الطلب 🚀</span>
            </button>
          )}

          {order.status === 'تم التسليم' && (
            <div className="text-center py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold">
              ✓ تم تسليم هذا الطلب بنجاح
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 max-w-7xl mx-auto font-sans text-slate-800 text-xs sm:text-sm" dir={direction}>
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold shadow-xs">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">إدارة الطلبات الحية</h1>
            <p className="text-xs text-slate-500 font-normal">متابعة وتحديث طلبات الطاولات لحظة بلحظة</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={addNewSimulatedOrder}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all"
          >
            <PlusCircle size={14} />
            <span>+ محاكاة طلب QR جديد</span>
          </button>

          <button
            onClick={resetOrders}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            title="إعادة تعيين البيانات"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Quick Summary Strip & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0 hide-scrollbar text-xs font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            الكل ({ordersList.length})
          </button>

          <button
            onClick={() => setStatusFilter('جديد')}
            className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'جديد'
                ? 'bg-rose-500 text-white shadow-xs font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>بانتظار التأكيد ({newOrdersCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('قيد التحضير')}
            className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'قيد التحضير'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>قيد التحضير ({preparingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('جاهز')}
            className={`px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'جاهز'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>جاهز للتسليم ({readyCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('تم التسليم')}
            className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
              statusFilter === 'تم التسليم'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            مكتمل ({ordersList.filter(o => o.status === 'تم التسليم').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="بحث برقم الطلب أو الطاولة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-normal focus:outline-none focus:bg-white focus:border-orange-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Split Interface - Master/Detail (2 Columns for cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* Orders Cards Grid (2 COLUMNS PER ROW) */}
        <div className="w-full lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[calc(100vh-170px)] overflow-y-auto pr-0.5 content-start">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-500">
              <ClipboardList size={36} className="mx-auto mb-2 text-orange-500 opacity-40" />
              <p className="text-sm font-bold text-slate-800">لا توجد طلبات مطابقة</p>
              <p className="text-xs text-slate-400 mt-1">جرّب تغيير حالة الفلتر أو محاكاة طلب جديد</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setIsMobileDetailOpen(true);
                  }}
                  className={`bg-white rounded-2xl p-3 border transition-all cursor-pointer relative shadow-xs hover:shadow-md flex flex-col justify-between ${
                    isSelected
                      ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20'
                      : 'border-slate-200/80 hover:border-orange-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{order.id}</span>
                        <span className="bg-slate-900 text-amber-300 font-semibold text-[11px] px-2 py-0.5 rounded-md">
                          طاولة {order.table}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {order.time}
                      </span>
                    </div>

                    <div className="mb-2">
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Items preview */}
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                      {order.items.map((i: any) => `${i.quantity}× ${i.name}`).join('، ')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-bold text-orange-600 text-sm sm:text-base">{order.total} ₪</span>
                    <div className="flex items-center gap-0.5 text-xs text-slate-400">
                      <span className="text-orange-600 font-semibold">معاينة</span>
                      <ChevronRight size={14} className="rtl:rotate-180 text-orange-600" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Order Inspector (5 Cols on Desktop) */}
        <div className="hidden lg:block lg:col-span-5 sticky top-2">
          {renderInspectorContent(selectedOrder, false)}
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileDetailOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDetailOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-h-[85vh] rounded-t-3xl bg-white p-4 shadow-2xl z-10 overflow-y-auto"
            >
              <div 
                className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 cursor-pointer"
                onClick={() => setIsMobileDetailOpen(false)}
              />
              {renderInspectorContent(selectedOrder, true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
