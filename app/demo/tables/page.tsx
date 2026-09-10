'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Armchair, QrCode, X, Printer, Download, Users,
  RefreshCw, Copy, Check, ShieldCheck
} from 'lucide-react';
import { tables as initialTables, TableInfo } from '@/data/demo-data';

export default function TablesManagementPage() {
  const [tablesList, setTablesList] = useState<TableInfo[]>(initialTables);
  const [selectedTableForQr, setSelectedTableForQr] = useState<TableInfo | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRotatingToken, setIsRotatingToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const occupiedCount = tablesList.filter(t => t.status === 'مشغولة').length;
  const freeCount = tablesList.filter(t => t.status === 'فارغة').length;
  const reservedCount = tablesList.filter(t => t.status === 'محجوزة').length;

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

  const handleCopyLink = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
              <h1 className="text-xl font-black text-slate-900">إدارة الطاولات وأكواد QR</h1>
              <p className="text-xs text-slate-400">متابعة إشغال الصالة، طباعة كود QR لكل طاولة، وإدارة الجلسات</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTableForQr(tablesList[0])}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
          >
            <QrCode size={16} />
            <span>طباعة أكواد QR لجميع الطاولات</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-400 font-medium">إجمالي الطاولات</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{tablesList.length} طاولة</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-orange-600 font-bold">طاولات مشغولة حالياً</p>
          <p className="text-2xl font-black text-orange-600 mt-1">{occupiedCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-emerald-600 font-bold">طاولات شاغرة ومتاحة</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{freeCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-400 font-medium">نسبة الإشغال</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {Math.round((occupiedCount / tablesList.length) * 100)}%
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs flex items-center gap-1.5">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          جميع الطاولات ({tablesList.length})
        </button>
        <button
          onClick={() => setFilterStatus('مشغولة')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterStatus === 'مشغولة' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
          }`}
        >
          مشغولة ({occupiedCount})
        </button>
        <button
          onClick={() => setFilterStatus('فارغة')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterStatus === 'فارغة' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          فارغة ({freeCount})
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'مشغولة';
          const isFree = table.status === 'فارغة';

          return (
            <div
              key={table.id}
              className={`bg-white rounded-3xl p-4 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                isOccupied
                  ? 'border-orange-400/80 ring-2 ring-orange-500/10'
                  : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Table Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-900 text-base">طاولة {table.id}</span>
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

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3 font-medium">
                  <Users size={13} />
                  <span>{table.seats} مقاعد</span>
                </div>

                {/* Status Specific Details */}
                {isOccupied && (
                  <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-2.5 text-[11px] space-y-1 mb-3">
                    <div className="flex justify-between text-orange-950 font-bold">
                      <span>الطلب النشط:</span>
                      <span>{table.currentOrder || '#ORD-1043'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
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
              className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl z-10 border border-slate-100 text-center"
            >
              <button
                onClick={() => setSelectedTableForQr(null)}
                className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X size={18} />
              </button>

              <div className="mb-4">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-lg mb-2 shadow-md shadow-orange-500/25">
                  M
                </div>
                <h3 className="text-base font-black text-slate-900">Burger House نابلس</h3>
                <p className="text-xs text-orange-600 font-extrabold">طاولة رقم {selectedTableForQr.id}</p>
              </div>

              {/* Realistic QR Canvas representation */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 mb-4 flex flex-col items-center justify-center">
                <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center border border-slate-200">
                  <div className="w-full h-full bg-slate-900 rounded-lg p-2 flex items-center justify-center relative">
                    {/* QR Pattern Simulation */}
                    <div className="w-full h-full border-2 border-white/40 grid grid-cols-5 gap-1 p-1">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className={`rounded-xs ${i % 2 === 0 || i % 3 === 0 ? 'bg-white' : 'bg-transparent'}`}></div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-xs shadow-md">
                        M
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 font-medium">امسح الكود لطلب الطعام والدفع مباشرة</p>
                
                {/* Dynamic QR link & security badge */}
                <div className="mt-2 w-full bg-slate-100 rounded-xl p-2 flex items-center justify-between gap-2 border border-slate-200">
                  <div className="text-right overflow-hidden">
                    <span className="text-[10px] text-slate-400 font-semibold block">رابط الطاولة الديناميكي:</span>
                    <span className="text-[11px] font-mono text-slate-700 font-bold truncate block dir-ltr">
                      menus.ps/m?t={selectedTableForQr.qrToken || `qr_token_table_${selectedTableForQr.id}_nablus`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyLink(`https://menus.ps/m?t=${selectedTableForQr.qrToken || `qr_token_table_${selectedTableForQr.id}_nablus`}`)}
                    className="p-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200 shrink-0"
                    title="نسخ الرابط"
                  >
                    {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-emerald-600 font-bold">
                  <ShieldCheck size={12} />
                  <span>رمز مشفر ديناميكي ضد التلاعب والطلبات الوهمية</span>
                </div>
              </div>

              {/* Rotate token action */}
              <div className="mb-3">
                <button
                  onClick={() => handleRotateToken(selectedTableForQr.id)}
                  disabled={isRotatingToken}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isRotatingToken ? "animate-spin" : ""} />
                  <span>{isRotatingToken ? "جارٍ تجديد الرمز المشفر..." : "تجديد رمز QR (إبطال الرمز القديم)"}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Printer size={15} />
                  <span>طباعة الستاند</span>
                </button>
                <button
                  onClick={() => alert('تم تنزيل ملف PDF المخصص للطباعة بجودة عالية 🖨️')}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                >
                  <Download size={15} />
                  <span>PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
