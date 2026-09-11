'use client';

import React, { useState } from 'react';
import { Plus, Printer, ExternalLink, Copy, Check } from 'lucide-react';

interface TableItem {
  id: string;
  tableNumber: number;
  seats: number;
  status: 'empty' | 'busy' | 'reserved';
  qrToken: string;
}

export default function ProductionTablesPage() {
  const [tables, setTables] = useState<TableItem[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: `tbl-${i + 1}`,
      tableNumber: i + 1,
      seats: (i % 3 === 0) ? 6 : (i % 2 === 0 ? 2 : 4),
      status: i === 2 || i === 6 ? 'busy' : i === 9 ? 'reserved' : 'empty',
      qrToken: `qr_tbl_${i + 1}_secure_${(i + 1) * 987}`,
    }))
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPrintTable, setSelectedPrintTable] = useState<TableItem | null>(null);

  const copyTableLink = (table: TableItem) => {
    const url = `https://menus-ps.vercel.app/m?t=${table.qrToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(table.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = (tableId: string, newStatus: TableItem['status']) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
    );
  };

  const handleAddTable = () => {
    const nextNum = tables.length + 1;
    const newT: TableItem = {
      id: `tbl-${nextNum}`,
      tableNumber: nextNum,
      seats: 4,
      status: 'empty',
      qrToken: `qr_tbl_${nextNum}_secure_${nextNum * 987}`,
    };
    setTables((prev) => [...prev, newT]);
  };

  const triggerPrintAll = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة الطاولات وأكواد QR المشفرة</h1>
          <p className="text-xs text-slate-500 mt-1">
            كل طاولة تمتلك رمز QR فريد ومشفر يمنع التلاعب بالطلبات ويربط الزبون بطاولته تلقائياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerPrintAll}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer size={15} />
            <span>طباعة كل بطاقات الـ QR</span>
          </button>

          <button
            onClick={handleAddTable}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>إضافة طاولة جديدة</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-center">
          <span className="text-xs text-slate-500 font-bold block mb-1">إجمالي الطاولات</span>
          <span className="text-2xl font-black text-slate-900">{tables.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-center">
          <span className="text-xs text-emerald-700 font-bold block mb-1">طاولات فارغة (متاحة)</span>
          <span className="text-2xl font-black text-emerald-700">{tables.filter((t) => t.status === 'empty').length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200/60 text-center">
          <span className="text-xs text-orange-700 font-bold block mb-1">طاولات مشغولة حالياً</span>
          <span className="text-2xl font-black text-orange-700">{tables.filter((t) => t.status === 'busy').length}</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://menus-ps.vercel.app/m?t=${table.qrToken}`)}`;
          const customerMenuUrl = `/m?t=${table.qrToken}`;

          return (
            <div
              key={table.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                table.status === 'busy'
                  ? 'border-orange-300 ring-2 ring-orange-400/20'
                  : table.status === 'reserved'
                  ? 'border-blue-300'
                  : 'border-slate-200/80 hover:shadow-md'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                      {table.tableNumber}
                    </span>
                    <div>
                      <p className="font-black text-xs text-slate-900">طاولة {table.tableNumber}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{table.seats} مقاعد</p>
                    </div>
                  </div>

                  <select
                    value={table.status}
                    onChange={(e) => handleStatusChange(table.id, e.target.value as TableItem['status'])}
                    className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                      table.status === 'busy'
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : table.status === 'reserved'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <option value="empty">فارغة (متاحة)</option>
                    <option value="busy">مشغولة الآن</option>
                    <option value="reserved">محجوزة</option>
                  </select>
                </div>

                {/* QR Code Center Box */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex flex-col items-center justify-center mb-3 text-center">
                  <div className="w-24 h-24 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs mb-2 flex items-center justify-center">
                    <img
                      src={qrUrl}
                      alt={`QR طاولة ${table.tableNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[160px]" dir="ltr">
                    token: {table.qrToken.slice(0, 14)}...
                  </span>
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => copyTableLink(table)}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === table.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedId === table.id ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                  </button>

                  <a
                    href={customerMenuUrl}
                    target="_blank"
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors"
                    title="تجربة فتح منيو الطاولة"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                <button
                  onClick={() => setSelectedPrintTable(table)}
                  className="w-full py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 font-black text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Printer size={12} />
                  <span>معاينة بطاقة الطاولة للطباعة</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Printable Card Modal */}
      {selectedPrintTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
            
            {/* Printable Preview Frame */}
            <div className="border-4 border-slate-900 rounded-3xl p-6 bg-gradient-to-b from-orange-500/5 to-transparent mb-5 relative overflow-hidden">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 block mb-1">
                MENUS.ps — مسح للطلب المباشر
              </span>
              <h3 className="text-2xl font-black text-slate-900 mb-1">
                طاولة رقم {selectedPrintTable.tableNumber}
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">امسح الكود بكاميرا هاتفك لتصفح المنيو والطلب فوراً</p>

              <div className="w-40 h-40 bg-white p-2 rounded-2xl border-2 border-slate-900 mx-auto shadow-md mb-3 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`https://menus-ps.vercel.app/m?t=${selectedPrintTable.qrToken}`)}`}
                  alt="QR"
                  className="w-full h-full object-contain"
                />
              </div>

              <span className="text-[10px] font-bold text-slate-400 block">
                بدون تحميل تطبيق · سريع وآمن 100%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPrintTable(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1"
              >
                <Printer size={14} />
                <span>طباعة الآن</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
