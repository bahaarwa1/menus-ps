'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, ExternalLink, Copy, Check, QrCode, Palette, Download, Eye, Sparkles } from 'lucide-react';
import { printTableStand, printAllTableStands } from '@/lib/print-utils';
import { generateBrandedQRCode, QR_COLOR_PRESETS } from '@/lib/qr-generator';

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
  const [restaurantLogo, setRestaurantLogo] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPrintTable, setSelectedPrintTable] = useState<TableItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  // QR Customization Studio States
  const [qrColor, setQrColor] = useState<string>('#0f172a');
  const [qrStyle, setQrStyle] = useState<'artistic' | 'photo_watermark' | 'image_fill' | 'center_badge' | 'solid'>('artistic');
  const [reduceGaps, setReduceGaps] = useState<boolean>(true);
  const [isUploadingQrImage, setIsUploadingQrImage] = useState<boolean>(false);
  const fileInputQrRef = React.useRef<HTMLInputElement>(null);

  // Helper to generate branded QR code
  const makeBrandedQr = async (
    targetUrl: string,
    color = qrColor,
    style: 'artistic' | 'photo_watermark' | 'image_fill' | 'center_badge' | 'solid' = qrStyle,
    logo = restaurantLogo,
    name = restaurantName,
    tNum?: number,
    withReduceGaps = reduceGaps
  ) => {
    try {
      return await generateBrandedQRCode({
        text: targetUrl,
        size: 550,
        color,
        logoUrl: style !== 'solid' ? logo : undefined,
        style,
        restaurantName: name,
        tableNumber: tNum,
        reduceGaps: withReduceGaps,
      });
    } catch (e) {
      console.error('Error generating branded QR:', e);
      return '';
    }
  };

  useEffect(() => {
    let slug = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSlug = params.get('created') || params.get('restaurant');
      if (urlSlug) slug = urlSlug;

      try {
        const savedColor = localStorage.getItem('qr_brand_color');
        if (savedColor) setQrColor(savedColor);
        const savedStyle = localStorage.getItem('qr_style') as any;
        if (savedStyle) setQrStyle(savedStyle);
        const savedGaps = localStorage.getItem('qr_reduce_gaps');
        if (savedGaps !== null) setReduceGaps(savedGaps === '1');
      } catch {}
    }

    const savedColor = typeof window !== 'undefined' ? localStorage.getItem('qr_brand_color') || '#0f172a' : '#0f172a';
    const savedStyle = ((typeof window !== 'undefined' ? localStorage.getItem('qr_style') : null) as any) || 'photo_watermark';
    const savedReduceGaps = typeof window !== 'undefined' ? localStorage.getItem('qr_reduce_gaps') !== '0' : true;

    // Direct tables fetch immediately on mount
    fetch(`/api/v1/tables/list${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`)
      .then((r) => r.json())
      .then(async (res) => {
        if (res.success && Array.isArray(res.tables)) {
          const effectiveSlug = slug || res.restaurantSlug || '';
          if (effectiveSlug) {
            setCurrentSlug(effectiveSlug);
          }
          let activeName = res.restaurantName || '';
          if (activeName) {
            setRestaurantName(activeName);
          }
          let activeLogo = '';

          // Fetch restaurant settings for logo and name
          if (effectiveSlug) {
            try {
              const sRes = await fetch(`/api/v1/restaurant/settings?slug=${encodeURIComponent(effectiveSlug)}`);
              const sData = await sRes.json();
              if (sData.success && sData.settings) {
                if (sData.settings.name) {
                  activeName = sData.settings.name;
                  setRestaurantName(activeName);
                }
                if (sData.settings.logoUrl) {
                  activeLogo = sData.settings.logoUrl;
                  setRestaurantLogo(activeLogo);
                }
              }
            } catch {}
          }

          // Load tables and generate branded QR codes in parallel
          const loadedTables: TableItem[] = await Promise.all(
            res.tables.map(async (t: any) => {
              const tableNumber = t.id;
              const qrToken = t.qrToken;
              const targetSlug = effectiveSlug || slug || 'burger-house-nablus';
              const targetUrl = `https://${targetSlug}.menus.cool/?table=${tableNumber}&token=${qrToken}`;
              const qrDataUrl = await makeBrandedQr(
                targetUrl,
                savedColor,
                savedStyle,
                activeLogo,
                activeName,
                tableNumber,
                savedReduceGaps
              );
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

    // Also fetch authoritative settings if no slug in url
    if (!slug) {
      fetch('/api/v1/restaurant/settings')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.settings) {
            if (data.settings.name) setRestaurantName(data.settings.name);
            if (data.settings.logoUrl) setRestaurantLogo(data.settings.logoUrl);
            if (data.settings.slug) setCurrentSlug(data.settings.slug);
          }
        })
        .catch(() => {});
    }
  }, []);

  const getTableUrl = (table: TableItem) => {
    const active = currentSlug || 'burger-house-nablus';
    return `https://${active}.menus.cool/?table=${table.tableNumber}&token=${table.qrToken}`;
  };

  // Handle live color change for all table QR codes
  const handleColorChange = async (newColor: string) => {
    setQrColor(newColor);
    try {
      localStorage.setItem('qr_brand_color', newColor);
    } catch {}

    const updated = await Promise.all(
      tables.map(async (t) => {
        const targetUrl = getTableUrl(t);
        const qrDataUrl = await makeBrandedQr(targetUrl, newColor, qrStyle, restaurantLogo, restaurantName, t.tableNumber);
        return { ...t, qrDataUrl };
      })
    );
    setTables(updated);
    if (selectedPrintTable) {
      const cur = updated.find((u) => u.id === selectedPrintTable.id);
      if (cur) setSelectedPrintTable(cur);
    }
  };

  // Handle QR style switch (artistic vs photo_watermark vs image_fill vs center_badge vs solid)
  const handleStyleChange = async (newStyle: 'artistic' | 'photo_watermark' | 'image_fill' | 'center_badge' | 'solid') => {
    setQrStyle(newStyle);
    try {
      localStorage.setItem('qr_style', newStyle);
    } catch {}

    const updated = await Promise.all(
      tables.map(async (t) => {
        const targetUrl = getTableUrl(t);
        const qrDataUrl = await makeBrandedQr(targetUrl, qrColor, newStyle, restaurantLogo, restaurantName, t.tableNumber);
        return { ...t, qrDataUrl };
      })
    );
    setTables(updated);
    if (selectedPrintTable) {
      const cur = updated.find((u) => u.id === selectedPrintTable.id);
      if (cur) setSelectedPrintTable(cur);
    }
  };

  // Toggle reduced gaps
  const handleToggleReduceGaps = async (newVal: boolean) => {
    setReduceGaps(newVal);
    try {
      localStorage.setItem('qr_reduce_gaps', newVal ? '1' : '0');
    } catch {}

    const updated = await Promise.all(
      tables.map(async (t) => {
        const targetUrl = getTableUrl(t);
        const qrDataUrl = await makeBrandedQr(targetUrl, qrColor, qrStyle, restaurantLogo, restaurantName, t.tableNumber, newVal);
        return { ...t, qrDataUrl };
      })
    );
    setTables(updated);
    if (selectedPrintTable) {
      const cur = updated.find((u) => u.id === selectedPrintTable.id);
      if (cur) setSelectedPrintTable(cur);
    }
  };

  // Upload custom photo for the QR fill / watermark
  const handleUploadQrImage = async (file: File) => {
    setIsUploadingQrImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setRestaurantLogo(data.url);
        setQrStyle('photo_watermark');
        const updated = await Promise.all(
          tables.map(async (t) => {
            const targetUrl = getTableUrl(t);
            const qrDataUrl = await makeBrandedQr(targetUrl, qrColor, 'photo_watermark', data.url, restaurantName, t.tableNumber, reduceGaps);
            return { ...t, qrDataUrl };
          })
        );
        setTables(updated);
        if (selectedPrintTable) {
          const cur = updated.find((u) => u.id === selectedPrintTable.id);
          if (cur) setSelectedPrintTable(cur);
        }
      } else {
        alert(data.error || 'فشل رفع الصورة');
      }
    } catch (err) {
      console.error('QR image upload error:', err);
      alert('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploadingQrImage(false);
    }
  };

  const copyTableLink = (table: TableItem) => {
    const url = getTableUrl(table);
    navigator.clipboard.writeText(url);
    setCopiedId(table.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadTableQr = (table: TableItem) => {
    if (!table.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = table.qrDataUrl;
    a.download = `table-${table.tableNumber}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        const active = currentSlug || 'burger-house-nablus';
        const targetUrl = `https://${active}.menus.cool/?table=${data.table.id}&token=${data.table.qrToken}`;
        const qrDataUrl = await makeBrandedQr(
          targetUrl,
          qrColor,
          qrStyle,
          restaurantLogo,
          restaurantName,
          data.table.id,
          reduceGaps
        );

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
    let activeName = restaurantName;
    const activeSlug = currentSlug || 'burger-house-nablus';

    if (!activeName) {
      try {
        const res = await fetch(`/api/v1/restaurant/settings?slug=${encodeURIComponent(activeSlug)}`);
        const data = await res.json();
        if (data.success && data.settings?.name) {
          activeName = data.settings.name;
          setRestaurantName(activeName);
        }
      } catch {}
    }

    const targetUrl = `https://${activeSlug}.menus.cool/?table=${table.tableNumber}&token=${table.qrToken}`;
    const qrDataUrl =
      table.qrDataUrl ||
      (await makeBrandedQr(targetUrl, qrColor, qrStyle, restaurantLogo, activeName, table.tableNumber, reduceGaps));

    printTableStand({
      tableNumber: table.tableNumber,
      restaurantName: activeName || 'أهلاً وسهلاً بكم',
      targetUrl,
      qrDataUrl,
      logoUrl: qrStyle !== 'solid' ? restaurantLogo : undefined,
    });
  };

  const triggerPrintAll = async () => {
    if (tables.length === 0 || isPrintingAll) return;
    setIsPrintingAll(true);
    try {
      let activeName = restaurantName;
      const activeSlug = currentSlug || 'burger-house-nablus';

      if (!activeName) {
        try {
          const res = await fetch(`/api/v1/restaurant/settings?slug=${encodeURIComponent(activeSlug)}`);
          const data = await res.json();
          if (data.success && data.settings?.name) {
            activeName = data.settings.name;
            setRestaurantName(activeName);
          }
        } catch {}
      }

      const stands = await Promise.all(
        tables.map(async (table) => {
          const targetUrl = `https://${activeSlug}.menus.cool/?table=${table.tableNumber}&token=${table.qrToken}`;
          const qrDataUrl =
            table.qrDataUrl ||
            (await makeBrandedQr(targetUrl, qrColor, qrStyle, restaurantLogo, activeName, table.tableNumber));
          return {
            tableNumber: table.tableNumber,
            restaurantName: activeName || 'أهلاً وسهلاً بكم',
            targetUrl,
            qrDataUrl,
            logoUrl: qrStyle !== 'solid' ? restaurantLogo : undefined,
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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>إدارة الطاولات وأكواد QR المشفرة</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-black">
              ألوان وشعار المطعم
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            كل طاولة تمتلك رمز QR فريد ومشفر باللون وهوية المطعم يربط الزبون بطاولته تلقائياً ويطبع بدقة فائقة
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

      {/* ============================================================
          QR BRANDING & COLOR CUSTOMIZATION STUDIO PANEL
      ============================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
              <Palette size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  استوديو ألوان وتصميم باركود الـ QR
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>تحديث فوري</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                اختر لون الهوية الخاص بمطعمك وفعّل لوجو المطعم داخل قلب الرمز لتصميم احترافي يطبع بدقة
              </p>
            </div>
          </div>

          {/* QR Design Modes */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleStyleChange('artistic')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  qrStyle === 'artistic'
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md shadow-red-500/20 ring-2 ring-red-500/30'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>🎨</span>
                <span>فني (دوائر + صورة) ✨</span>
              </button>

              <button
                type="button"
                onClick={() => handleStyleChange('photo_watermark')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  qrStyle === 'photo_watermark'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 ring-2 ring-orange-500/30'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <Sparkles size={14} />
                <span>خلفية صورة كاملة</span>
              </button>

              <button
                type="button"
                onClick={() => handleStyleChange('center_badge')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  qrStyle === 'center_badge'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>شعار كبير بالمنتصف</span>
              </button>

              <button
                type="button"
                onClick={() => handleStyleChange('image_fill')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  qrStyle === 'image_fill'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>نقش على نقاط الرمز</span>
              </button>

              <button
                type="button"
                onClick={() => handleStyleChange('solid')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  qrStyle === 'solid'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                <span>لون موحد</span>
              </button>
            </div>

            {/* Image Thumbnail & Upload */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
              {restaurantLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={restaurantLogo}
                  alt="QR Image"
                  className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 font-black text-xs flex items-center justify-center border border-orange-200">
                  {restaurantName ? restaurantName.trim().charAt(0) : '🍽️'}
                </div>
              )}
              <input
                type="file"
                ref={fileInputQrRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadQrImage(file);
                }}
              />
              <button
                type="button"
                disabled={isUploadingQrImage}
                onClick={() => fileInputQrRef.current?.click()}
                className="text-xs text-orange-600 hover:text-orange-700 font-black hover:underline cursor-pointer flex items-center gap-1"
              >
                {isUploadingQrImage ? 'جاري الرفع...' : 'تغيير صورة الـ QR'}
              </button>
            </div>

            {/* Reduce Gaps / Maximize Photo Clarity Toggle */}
            <button
              type="button"
              onClick={() => handleToggleReduceGaps(!reduceGaps)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border transition-all cursor-pointer shadow-2xs ${
                reduceGaps
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-2 ring-emerald-400/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="تقليل الفراغات البيضاء وإبراز صورة المطعم داخل الرمز لأقصى درجة وضوح"
            >
              <Sparkles size={14} className={reduceGaps ? 'text-emerald-600' : 'text-slate-400'} />
              <span>{reduceGaps ? 'تقليل الفراغات وإبراز الصورة: مفعّل ✨' : 'تقليل الفراغات وإبراز الصورة'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  reduceGaps ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Explain notice based on active style */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-2 text-xs text-amber-900 font-medium">
          <span className="text-base">
            {qrStyle === 'photo_watermark' ? '🖼️' : qrStyle === 'center_badge' ? '🏷️' : qrStyle === 'image_fill' ? '✨' : '🎨'}
          </span>
          <span>
            {qrStyle === 'photo_watermark' && (
              <>
                <strong>صورة المطعم كاملة بالخلفية:</strong> صورة وهوية مطعمك واضحة تماماً وبدقة عالية كخلفية فاخرة للـ QR، مع {reduceGaps ? 'تقليل الفراغات البيضاء وإبراز معالم الصورة' : 'فراغات قياسية'} ودقة مسح فورية بنسبة 100% بكافة الهواتف 📲
              </>
            )}
            {qrStyle === 'center_badge' && (
              <>
                <strong>شعار المنتصف مفعّل:</strong> تظهر صورة وشعار المطعم كبيرة وواضحة جداً في قلب الرمز داخل إطار ذهبي راقي.
              </>
            )}
            {qrStyle === 'image_fill' && (
              <>
                <strong>النقش الحي مفعّل:</strong> تتشكل نقاط الرمز من ألوان صورة المطعم مع خلفية متناسقة وتباين مريح للمسح.
              </>
            )}
            {qrStyle === 'solid' && (
              <>
                <strong>اللون الموحد مفعّل:</strong> تصميم كلاسيكي نظيف بلون الهوية المختار.
              </>
            )}
          </span>
        </div>

        {/* Color Presets & Custom Picker */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-black text-slate-700 ml-1">ألوان الـ QR المقترحة:</span>
          {QR_COLOR_PRESETS.map((preset) => {
            const isSelected = qrColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.id}
                onClick={() => handleColorChange(preset.hex)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/30'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs shrink-0"
                  style={{ backgroundColor: preset.hex }}
                />
                <span>{preset.name}</span>
              </button>
            );
          })}

          {/* Custom Color Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80">
            <input
              type="color"
              value={qrColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
              title="اختر لوناً مخصصاً"
            />
            <span className="text-[11px] font-mono text-slate-600 font-bold uppercase">{qrColor}</span>
          </div>
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
                      <span
                        className="w-8 h-8 rounded-xl text-white font-black text-sm flex items-center justify-center"
                        style={{ backgroundColor: qrColor }}
                      >
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
                  <div
                    onClick={() => setSelectedPrintTable(table)}
                    className="group relative bg-slate-50 border border-slate-200/70 hover:border-orange-300 rounded-2xl p-3 flex flex-col items-center justify-center mb-3 text-center cursor-pointer transition-all hover:shadow-sm"
                    title="انقر للمعاينة والتحميل بدقة عالية"
                  >
                    <div className="relative w-32 h-32 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs mb-2 flex items-center justify-center overflow-hidden group-hover:scale-102 transition-transform">
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
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl text-white text-xs font-bold gap-1">
                        <Eye size={14} />
                        <span>معاينة</span>
                      </div>
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

                    <button
                      onClick={() => downloadTableQr(table)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="تحميل كود QR بدقة عالية PNG"
                    >
                      <Download size={14} />
                    </button>

                    <a
                      href={directTableUrl}
                      target="_blank"
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors"
                      title="فتح منيو الطاولة في نافذة جديدة"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <button
                    onClick={() => handlePrintSingle(table)}
                    className="w-full py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 font-black text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>طباعة ستاند طاولة {table.tableNumber}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Printable / Preview Card Modal */}
      {selectedPrintTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-150">
            
            {/* Printable Preview Frame */}
            <div className="border-2 border-amber-400 rounded-3xl p-5 bg-gradient-to-b from-amber-50/50 via-white to-white mb-4 relative shadow-lg text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-600 text-xs font-black mb-1">
                {restaurantLogo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={restaurantLogo}
                    alt="Logo"
                    className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-xs mb-1"
                  />
                ) : (
                  <>
                    <span>✦</span>
                    <span className="text-base">🍽️</span>
                    <span>✦</span>
                  </>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-0.5">
                {restaurantName || 'أهلاً وسهلاً بكم'}
              </h3>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2.5">
                قائمة الطعام الرقمية والطلب المباشر
              </p>

              <div
                className="inline-flex items-center justify-center gap-2 px-4 py-1 rounded-full text-white text-xs font-black border border-amber-400 mb-3 shadow-sm"
                style={{ backgroundColor: qrColor }}
              >
                <span>طاولة رقم</span>
                <span className="text-yellow-300 text-sm font-black">{selectedPrintTable.tableNumber}</span>
              </div>

              <div className="w-48 h-48 bg-white p-3 rounded-2xl border-2 border-amber-200 mx-auto shadow-md mb-3 flex items-center justify-center">
                {selectedPrintTable.qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedPrintTable.qrDataUrl}
                    alt="QR"
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <QrCode size={60} className="text-slate-300" />
                )}
              </div>

              <p className="text-xs font-black text-slate-900 mb-0.5">امسح الرمز لطلب طعامك مباشرة 📲</p>
              <p className="text-[10px] text-slate-500 font-medium max-w-[200px] mx-auto mb-2.5">
                وجّه كاميرا هاتفك نحو الرمز لتصفح القائمة والطلب إلى طاولتك
              </p>

              <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-amber-100 text-[10px] font-extrabold text-amber-800">
                <span className="bg-amber-100/70 border border-amber-300/60 px-2 py-0.5 rounded-md">📷 ١. وجّه الكاميرا</span>
                <span className="bg-amber-100/70 border border-amber-300/60 px-2 py-0.5 rounded-md">🍔 ٢. اختر وجبتك</span>
                <span className="bg-amber-100/70 border border-amber-300/60 px-2 py-0.5 rounded-md">⚡ ٣. يجهز فوراً</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadTableQr(selectedPrintTable)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>تحميل PNG</span>
                </button>
                <button
                  onClick={() => {
                    handlePrintSingle(selectedPrintTable);
                    setSelectedPrintTable(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>طباعة الستاند</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedPrintTable(null)}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
