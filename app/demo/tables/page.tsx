'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Armchair, QrCode, X, Users, RefreshCw, ShieldCheck
} from 'lucide-react';
import { tables as initialTables, TableInfo } from '@/data/demo-data';
import RealQRCode from '@/components/common/RealQRCode';

export default function TablesManagementPage() {
  const [tablesList, setTablesList] = useState<TableInfo[]>(initialTables);
  const [selectedTableForQr, setSelectedTableForQr] = useState<TableInfo | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRotatingToken, setIsRotatingToken] = useState(false);

  const occupiedCount = tablesList.filter(t => t.status === 'مشغولة').length;
  const freeCount = tablesList.filter(t => t.status === 'فارغة').length;

  const handleRotateToken = async (tableId: number) => {
    setIsRotatingToken(true);
    try {
      const res = await fetch('/api/v1/tables/regenerate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, branchId: 'branch_nablus_01' })
      });
      const data = await res.json();
      if (data.success && data.token) {
        const newToken = data.token;
        setSelectedTableForQr(prev => prev ? { ...prev, qrToken: newToken } : null);
        setTablesList(prev => prev.map(t => t.id === tableId ? { ...t, qrToken: newToken } : t));
      }
    } catch {
      const fallbackToken = `qr_nablus_t${tableId}_` + Math.random().toString(36).substring(2, 8);
      setSelectedTableForQr(prev => prev ? { ...prev, qrToken: fallbackToken } : null);
      setTablesList(prev => prev.map(t => t.id === tableId ? { ...t, qrToken: fallbackToken } : t));
    } finally {
      setIsRotatingToken(false);
    }
  };

  const toggleTableStatus = (tableId: number) => {
    setTablesList(prev => prev.map(t => {
      if (t.id === tableId) {
        let nextStatus: 'فارغة' | 'مشغولة' | 'محجوزة' = 'فارغة';
        if (t.status === 'فارغة') nextStatus = 'مشغولة';
        else if (t.status === 'مشغولة') nextStatus = 'فارغة';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const filteredTables = tablesList.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10 font-sans text-slate-800" dir="rtl">
      
      {/* Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
              <Armchair size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">إدارة الطاولات وأكواد QR</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">متابعة إشغال الصالة، طباعة كود QR لكل طاولة، وإدارة الجلسات</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTableForQr(tablesList[0])}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-600/20 transition-all"
          >
            <QrCode size={15} />
            <span>طباعة أكواد QR لجميع الطاولات</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">إجمالي الطاولات</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{tablesList.length} طاولة</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs sm:text-sm text-orange-600 font-medium">مشغولة حالياً</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-1">{occupiedCount}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs sm:text-sm text-emerald-700 font-medium">شاغرة ومتاحة</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">{freeCount}</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs sm:text-sm text-slate-500 font-medium">نسبة الإشغال</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {Math.round((occupiedCount / tablesList.length) * 100)}%
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
            filterStatus === 'all' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          جميع الطاولات ({tablesList.length})
        </button>
        <button
          onClick={() => setFilterStatus('مشغولة')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
            filterStatus === 'مشغولة' ? 'bg-orange-500 text-white font-bold' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          مشغولة ({occupiedCount})
        </button>
        <button
          onClick={() => setFilterStatus('فارغة')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
            filterStatus === 'فارغة' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          فارغة ({freeCount})
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'مشغولة';
          const isFree = table.status === 'فارغة';

          return (
            <div
              key={table.id}
              className={`bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                isOccupied
                  ? 'border-orange-400/80 ring-2 ring-orange-500/10'
                  : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Table Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-900 text-sm sm:text-base">طاولة {table.id}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isOccupied
                        ? 'bg-orange-500 text-white'
                        : isFree
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-700 mb-3 font-bold">
                  <Users size={14} className="text-slate-500" />
                  <span>{table.seats} مقاعد</span>
                </div>

                {/* Status Specific Details */}
                {isOccupied && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 text-xs space-y-1 mb-3">
                    <div className="flex justify-between text-orange-950 font-black">
                      <span>الطلب النشط:</span>
                      <span>{table.currentOrder || '#ORD-1043'}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 font-bold">
                      <span>المدة:</span>
                      <span>22 دقيقة</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                  onClick={() => setSelectedTableForQr(table)}
                  className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  title="كود QR"
                >
                  <QrCode size={16} />
                  <span className="text-[10px]">QR</span>
                </button>

                <button
                  onClick={() => toggleTableStatus(table.id)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                    isOccupied
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                  }`}
                >
                  {isOccupied ? 'تفريغ الطاولة' : 'حجز/إشغال'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Preview & Print Modal */}
      <AnimatePresence>
        {selectedTableForQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTableForQr(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl p-4 sm:p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl z-10 border border-slate-100 text-center"
            >
              <button
                onClick={() => setSelectedTableForQr(null)}
                className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X size={18} />
              </button>

              <div className="mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-lg mb-2 shadow-md shadow-orange-500/25">
                  M
                </div>
                <h3 className="text-base font-black text-slate-900">Burger House نابلس</h3>
                <p className="text-xs text-orange-600 font-extrabold">طاولة رقم {selectedTableForQr.id}</p>
              </div>

              {/* Real Standard QR Code with Mascot Character & 1-Page Print */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 sm:p-5 mb-3 flex flex-col items-center justify-center">
                <RealQRCode
                  value={`https://menus-ps.vercel.app/m?table=${selectedTableForQr.id}&t=${selectedTableForQr.qrToken || `qr_token_table_${selectedTableForQr.id}_nablus`}`}
                  size={200}
                  tableNumber={selectedTableForQr.id}
                  restaurantName="Burger House نابلس"
                  showActions={true}
                />

                <div className="flex items-center justify-center gap-1 mt-3 text-[11px] text-emerald-600 font-extrabold">
                  <ShieldCheck size={14} />
                  <span>كود QR مشفر متوافق مع كافة كاميرات الهواتف</span>
                </div>
              </div>

              {/* Rotate token action */}
              <div className="mb-2">
                <button
                  onClick={() => handleRotateToken(selectedTableForQr.id)}
                  disabled={isRotatingToken}
                  className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isRotatingToken ? "animate-spin" : ""} />
                  <span>{isRotatingToken ? "جارٍ تجديد الرمز المشفر..." : "تجديد رمز QR (إبطال الرمز القديم)"}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedTableForQr(null)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
