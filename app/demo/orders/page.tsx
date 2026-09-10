'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, CheckCircle2, Clock, PlusCircle, RotateCcw, 
  Search, Printer, ChevronRight, Check, ExternalLink
} from 'lucide-react';
import { orders as initialOrders } from '@/data/demo-data';

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

  // Filter orders
  const filteredOrders = ordersList.filter(o => {
    const matchesFilter = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `طاولة ${o.table}`.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'جديد':
        return <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">بانتظار التأكيد</span>;
      case 'قيد التحضير':
        return <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">قيد التحضير</span>;
      case 'جاهز':
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">جاهز للتسليم</span>;
      case 'تم التسليم':
        return <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full">مكتمل</span>;
      default:
        return null;
    }
  };

  const newOrdersCount = ordersList.filter(o => o.status === 'جديد').length;
  const preparingCount = ordersList.filter(o => o.status === 'قيد التحضير').length;
  const readyCount = ordersList.filter(o => o.status === 'جاهز').length;

  return (
    <div className="space-y-2.5 max-w-7xl mx-auto font-sans text-slate-800 text-xs sm:text-sm" dir="rtl">
      
      {/* Header Bar - Slim & High Density */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-bold">
            <ClipboardList size={18} />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">إدارة الطلبات الحية</h1>
            <p className="text-[11px] text-slate-400">متابعة وتحديث طلبات الطاولات لحظة بلحظة</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={addNewSimulatedOrder}
            className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
          >
            <PlusCircle size={13} />
            <span>+ محاكاة طلب QR</span>
          </button>

          <button
            onClick={resetOrders}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
            title="إعادة تعيين البيانات"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Quick Summary Strip & Filter - Slim */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
        {/* Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({ordersList.length})
          </button>
          <button
            onClick={() => setStatusFilter('جديد')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 flex items-center gap-1 ${
              statusFilter === 'جديد'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>بانتظار التأكيد ({newOrdersCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('قيد التحضير')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'قيد التحضير'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            قيد التحضير ({preparingCount})
          </button>
          <button
            onClick={() => setStatusFilter('جاهز')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'جاهز'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            جاهز للتسليم ({readyCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الطلب أو الطاولة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Main Split Interface - Master/Detail (Strictly Viewport-Fitted) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
        
        {/* Orders List (Right Column - 7 Cols) */}
        <div className="lg:col-span-7 space-y-2 max-h-[calc(100vh-170px)] overflow-y-auto pr-0.5">
          {filteredOrders.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-400">
              <ClipboardList size={32} className="mx-auto mb-1.5 opacity-40" />
              <p className="text-xs font-bold text-slate-700">لا توجد طلبات مطابقة</p>
              <p className="text-[10px] text-slate-400 mt-0.5">جرّب تغيير حالة الفلتر أو محاكاة طلب جديد</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`bg-white rounded-xl p-2.5 border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-orange-500 shadow-sm ring-2 ring-orange-500/20 bg-orange-50/10'
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{order.id}</span>
                      <span className="bg-slate-900 text-white font-black text-xs px-2.5 py-0.5 rounded-md">
                        طاولة {order.table}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-bold">
                        <Clock size={12} />
                        {order.time}
                      </span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <p className="text-xs text-slate-700 line-clamp-1 mb-1.5 font-bold">
                    {order.items.map((i: any) => `${i.name} (${i.quantity})`).join('، ')}
                  </p>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span className="font-black text-orange-600 text-sm sm:text-base">{order.total} ₪</span>
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                      <span>عرض التفاصيل</span>
                      <ChevronRight size={14} className="rtl:rotate-180" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Order Inspector / Action Pane (Left Column - 5 Cols) */}
        <div className="lg:col-span-5 sticky top-1">
          {selectedOrder ? (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 space-y-2.5 max-h-[calc(100vh-170px)] overflow-y-auto">
              
              {/* Header */}
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">{selectedOrder.id}</h3>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">طلب طاولة {selectedOrder.table} — {selectedOrder.time}</p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="طباعة بون الطلب"
                >
                  <Printer size={16} />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                <p className="text-xs font-black text-slate-500">محتويات الطلب ({selectedOrder.items.length} أصناف)</p>
                {selectedOrder.items.map((item: any, iIdx: number) => {
                   const img = mockImages[item.name];
                   return (
                  <div key={iIdx} className="bg-slate-50 p-2 rounded-xl flex items-center justify-between gap-2 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center shrink-0 border border-orange-200">
                        {item.quantity}×
                      </span>
                      {img && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                          <img src={img} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="font-black text-sm text-slate-900">{item.name}</p>
                        {item.customization && (
                          <span className="text-[10px] text-orange-700 font-bold block">• {item.customization}</span>
                        )}
                        {item.extras && item.extras.length > 0 && (
                          <span className="text-[10px] text-slate-600 font-bold block">• + {item.extras.join('، ')}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-sm text-slate-900 shrink-0">{item.price * item.quantity} ₪</span>
                  </div>
                )})}
              </div>

              {/* Customer Notes */}
              {selectedOrder.notes && (
                <div className="bg-amber-100/90 border border-amber-300 rounded-xl p-2.5 text-xs font-black text-amber-950">
                  <span className="block mb-0.5">⚠️ ملاحظات الزبون:</span>
                  <p className="font-bold">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Bill Details */}
              <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>المجموع الفرعي:</span>
                  <span className="font-black text-slate-800">{selectedOrder.total} ₪</span>
                </div>
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>الضريبة والخدمة:</span>
                  <span className="font-black text-emerald-600">مشمولة (0 ₪)</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>الإجمالي المطلوب:</span>
                  <span className="text-orange-600">{selectedOrder.total} ₪</span>
                </div>
              </div>

              {/* Action Buttons Based on Status */}
              <div className="pt-1">
                {selectedOrder.status === 'جديد' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'قيد التحضير')}
                    className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>قبول الطلب وبدء التحضير</span>
                    <Check size={16} />
                  </button>
                )}

                {selectedOrder.status === 'قيد التحضير' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'جاهز')}
                    className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>الطلب جاهز للتسليم (طاولة {selectedOrder.table})</span>
                    <CheckCircle2 size={16} />
                  </button>
                )}

                {selectedOrder.status === 'جاهز' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'تم التسليم')}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>تم التسليم بنجاح وإغلاق الطلب</span>
                    <Check size={16} />
                  </button>
                )}

                {selectedOrder.status === 'تم التسليم' && (
                  <div className="text-center py-2 bg-slate-100 rounded-xl text-xs sm:text-sm font-black text-slate-500">
                    تم تسليم هذا الطلب بنجاح ✓
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 text-center text-slate-400 text-xs">
              اختر طلباً من القائمة لعرض تفاصيله
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
