'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, ExternalLink, Copy, Check, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { printTableStand, printAllTableStands } from '@/lib/print-utils';

interface TableItem {
  id: string;
  tableNumber: number;
  seats: number;
  status: 'empty' | 'busy' | 'reserved';
  qrToken: string;
  qrDataUrl?: string;
}

export default function ProductionTablesPage() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPrintTable, setSelectedPrintTable] = useState<TableItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  useEffect(() => {
    let slug = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSlug = params.get('created') || params.get('restaurant');
      if (urlSlug) slug = urlSlug;
    }

    // Direct tables fetch immediately on mount
    fetch(`/api/v1/tables/list${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`)
      .then((r) => r.json())
      .then(async (res) => {
        if (res.success && Array.isArray(res.tables)) {
          if (res.restaurantSlug && !slug) {
            slug = res.restaurantSlug;
            setCurrentSlug(slug);
          }
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://menus-ps.vercel.app';
          // Load tables and generate QR codes in parallel
          const loadedTables: TableItem[] = await Promise.all(
            res.tables.map(async (t: any) => {
              const tableNumber = t.id;
              const qrToken = t.qrToken;
              const targetUrl = `${origin}/r/${slug}?table=${tableNumber}&token=${qrToken}`;
              let qrDataUrl = '';
              try {
                qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 280, margin: 1 });
              } catch {}
              return {
                id: t.dbId || `tbl-${t.id}`,
                tableNumber,
                seats: t.seats || 4,
                status: t.status === 'مشغولة' ? 'busy' : t.status === 'محجوزة' ? 'reserved' : 'empty',
                qrToken,
                qrDataUrl,
              } as TableItem;
            })
          );
          setTables(loadedTables);
        }
      })
      .catch((err) => console.error('Error fetching tables:', err))
      .finally(() => setIsLoading(false));

    // Concurrently fetch session info
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          if (data.user?.restaurantSlug) setCurrentSlug(data.user.restaurantSlug);
          if (data.user?.name) setRestaurantName(data.user.name);
        }
      })
      .catch(() => {});
  }, []);

  const getTableUrl = (table: TableItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://menus-ps.vercel.app';
    return `${origin}/r/${currentSlug}?table=${table.tableNumber}&token=${table.qrToken}`;
  };

  const copyTableLink = (table: TableItem) => {
    const url = getTableUrl(table);
    navigator.clipboard.writeText(url);
    setCopiedId(table.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = (tableId: string, newStatus: TableItem['status']) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
    );
  };

  const handleAddTable = async () => {
    if (isAdding) return;
    setIsAdding(true);

    try {
      const res = await fetch('/api/v1/tables/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: currentSlug, seats: 4 }),
      });

      const data = await res.json();
      if (data.success && data.table) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://menus-ps.vercel.app';
        const targetUrl = `${origin}/r/${currentSlug}?table=${data.table.id}&token=${data.table.qrToken}`;
        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 1 });
        } catch {}

        setTables((prev) => [
          ...prev,
          {
            id: data.table.dbId || `tbl-${data.table.id}`,
            tableNumber: data.table.id,
            seats: data.table.seats,
            status: 'empty',
            qrToken: data.table.qrToken,
            qrDataUrl,
          },
        ]);
      }
    } catch (err) {
      console.error('Error creating table:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handlePrintSingle = async (table: TableItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://menus-ps.vercel.app';
    const targetUrl = `${origin}/r/${currentSlug}?table=${table.tableNumber}&token=${table.qrToken}`;
    const qrDataUrl = table.qrDataUrl || (await QRCode.toDataURL(targetUrl, { width: 500, margin: 1 }));

    printTableStand({
      tableNumber: table.tableNumber,
      restaurantName: restaurantName || currentSlug,
      targetUrl,
      qrDataUrl,
    });
  };

  const triggerPrintAll = async () => {
    if (tables.length === 0 || isPrintingAll) return;
    setIsPrintingAll(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://menus-ps.vercel.app';
      const stands = await Promise.all(
        tables.map(async (table) => {
          const targetUrl = `${origin}/r/${currentSlug}?table=${table.tableNumber}&token=${table.qrToken}`;
          const qrDataUrl = table.qrDataUrl || (await QRCode.toDataURL(targetUrl, { width: 500, margin: 1 }));
          return {
            tableNumber: table.tableNumber,
            restaurantName: restaurantName || currentSlug,
            targetUrl,
            qrDataUrl,
          };
        })
      );
      printAllTableStands(stands);
    } catch (err) {
      console.error('Print all error:', err);
    } finally {
      setIsPrintingAll(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">إدارة الطاولات وأكواد QR المشفرة</h1>
          <p className="text-xs text-slate-500 mt-1">
            كل طاولة تمتلك رمز QR فريد ومشفر يربط الزبون بطاولته تلقائياً ويطبع بدقة عالية وبدون أي تشويش
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tables.length > 0 && (
            <button
              onClick={triggerPrintAll}
              disabled={isPrintingAll}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={15} />
              <span>{isPrintingAll ? 'جاري التجهيز...' : 'طباعة كل بطاقات الـ QR'}</span>
            </button>
          )}

          <button
            onClick={handleAddTable}
            disabled={isAdding}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>{isAdding ? 'جاري الإضافة...' : 'إضافة طاولة جديدة'}</span>
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

      {/* Tables Grid or Empty State */}
      {isLoading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-400 font-medium">
          جاري تحميل بيانات الطاولات وأكواد الـ QR...
        </div>
      ) : tables.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
            <QrCode size={32} />
          </div>
          <h3 className="font-black text-slate-900 text-base mb-1">لا توجد طاولات مضافة بعد</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            أنشئ طاولات مطعمك الآن لتوليد أكواد باركود مشفرة لكل طاولة، تمكّن الزبائن من مسح الكود وطلب الطعام مباشرة.
          </p>
          <button
            onClick={handleAddTable}
            disabled={isAdding}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>{isAdding ? 'جاري الإضافة...' : 'إضافة أول طاولة الآن'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => {
            const directTableUrl = getTableUrl(table);

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
                    <div className="w-28 h-28 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs mb-2 flex items-center justify-center">
                      {table.qrDataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={table.qrDataUrl}
                          alt={`QR طاولة ${table.tableNumber}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode size={40} className="text-slate-300" />
                      )}
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
                      href={directTableUrl}
                      target="_blank"
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors"
                      title="فتح منيو الطاولة"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <button
                    onClick={() => handlePrintSingle(table)}
                    className="w-full py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 font-black text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Printer size={12} />
                    <span>طباعة بطاقة الاستاند للطلب</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Printable Card Modal (if user wants a preview modal first) */}
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

              <div className="w-44 h-44 bg-white p-2 rounded-2xl border-2 border-slate-900 mx-auto shadow-md mb-3 flex items-center justify-center">
                {selectedPrintTable.qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedPrintTable.qrDataUrl}
                    alt="QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode size={60} className="text-slate-300" />
                )}
              </div>

              <span className="text-[10px] font-bold text-slate-400 block">
                بدون تحميل تطبيق · سريع وآمن 100%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPrintTable(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  handlePrintSingle(selectedPrintTable);
                  setSelectedPrintTable(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer size={14} />
                <span>طباعة الستاند الآن</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
