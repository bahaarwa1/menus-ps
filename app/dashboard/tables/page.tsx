'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, ExternalLink, Copy, Check, QrCode, Palette, Download, Eye, Sparkles, Upload, Image as ImageIcon, Trash2, Layers, RefreshCw } from 'lucide-react';
import { printTableStand, printAllTableStands, StandCardTheme } from '@/lib/print-utils';
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

  // Table Stand Card Background & Theme Customization States
  const [cardTheme, setCardTheme] = useState<StandCardTheme>('modern_luxury');
  const [cardBgImage, setCardBgImage] = useState<string>('');
  const [cardTagline, setCardTagline] = useState<string>('امسح الرمز لتصفح قائمة الطعام والطلب مباشرة إلى طاولتك');
  const [isUploadingBg, setIsUploadingBg] = useState<boolean>(false);
  const fileInputBgRef = React.useRef<HTMLInputElement>(null);

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
        const savedTheme = (urlSlug && localStorage.getItem(`table_card_theme_${urlSlug}`)) || localStorage.getItem('table_card_theme');
        if (savedTheme) setCardTheme(savedTheme as StandCardTheme);
        const savedBg = (urlSlug && localStorage.getItem(`table_card_bg_${urlSlug}`)) || localStorage.getItem('table_card_bg');
        if (savedBg) setCardBgImage(savedBg);
        const savedTag = (urlSlug && localStorage.getItem(`table_card_tagline_${urlSlug}`)) || localStorage.getItem('table_card_tagline');
        if (savedTag) setCardTagline(savedTag);
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

  // Card Theme & Background Handlers
  const handleThemeChange = (newTheme: StandCardTheme) => {
    setCardTheme(newTheme);
    try {
      localStorage.setItem('table_card_theme', newTheme);
      if (currentSlug) localStorage.setItem(`table_card_theme_${currentSlug}`, newTheme);
    } catch {}
  };

  const handleUploadBgImage = async (file: File) => {
    setIsUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setCardBgImage(data.url);
        setCardTheme('custom_bg');
        try {
          localStorage.setItem('table_card_bg', data.url);
          localStorage.setItem('table_card_theme', 'custom_bg');
          if (currentSlug) {
            localStorage.setItem(`table_card_bg_${currentSlug}`, data.url);
            localStorage.setItem(`table_card_theme_${currentSlug}`, 'custom_bg');
          }
        } catch {}
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          setCardBgImage(result);
          setCardTheme('custom_bg');
          try {
            localStorage.setItem('table_card_bg', result);
            localStorage.setItem('table_card_theme', 'custom_bg');
            if (currentSlug) {
              localStorage.setItem(`table_card_bg_${currentSlug}`, result);
              localStorage.setItem(`table_card_theme_${currentSlug}`, 'custom_bg');
            }
          } catch {}
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Background upload error:', err);
      alert('حدث خطأ أثناء رفع صورة الخلفية');
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleRemoveBgImage = () => {
    setCardBgImage('');
    setCardTheme('modern_luxury');
    try {
      localStorage.removeItem('table_card_bg');
      localStorage.setItem('table_card_theme', 'modern_luxury');
      if (currentSlug) {
        localStorage.removeItem(`table_card_bg_${currentSlug}`);
        localStorage.setItem(`table_card_theme_${currentSlug}`, 'modern_luxury');
      }
    } catch {}
  };

  const handleTaglineChange = (val: string) => {
    setCardTagline(val);
    try {
      localStorage.setItem('table_card_tagline', val);
      if (currentSlug) localStorage.setItem(`table_card_tagline_${currentSlug}`, val);
    } catch {}
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
      brandColor: qrColor,
      cardTheme,
      cardBgImage,
      tagline: cardTagline,
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
            brandColor: qrColor,
            cardTheme,
            cardBgImage,
            tagline: cardTagline,
          };
        })
      );
      printAllTableStands(stands, {
        cardTheme,
        cardBgImage,
        tagline: cardTagline,
        brandColor: qrColor,
      });
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

      {/* ============================================================
          TABLE STAND BACKGROUND & DESIGNER STUDIO
      ============================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  استوديو خلفية وتصميم ستاند الطاولة المطبوع
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-black flex items-center gap-1">
                  <span>✨ تحكّم كامل بالخلفية</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                خصص خلفية الستاند الخاص بمطعمك: ارفع صورة خاصة بديكور مطعمك أو اختر من الأنماط الفاخرة المعتمدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (tables.length > 0) handlePrintSingle(tables[0]);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer size={13} />
              <span>طباعة تجريبية للستاند المختار</span>
            </button>
          </div>
        </div>

        {/* Theme Presets Grid */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-800 block">اختر نمط وخلفية الستاند:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              {
                id: 'modern_luxury',
                title: 'فخامة ملكية',
                sub: 'عاجي وذهبي',
                color: 'from-amber-100 to-amber-200 border-amber-300',
                badge: '🏆 الأكثر طلباً',
              },
              {
                id: 'clean_minimal',
                title: 'مينيمل نقي',
                sub: 'أبيض واستوديو',
                color: 'from-slate-50 to-slate-100 border-slate-300',
                badge: 'عصري ونظيف',
              },
              {
                id: 'burger_grill',
                title: 'برجر وجريل',
                sub: 'فحمي داكن ولهب',
                color: 'from-zinc-800 to-zinc-950 border-orange-500 text-white',
                badge: '🍔 مشاوي وبرجر',
              },
              {
                id: 'cafe_warm',
                title: 'كافيه ومقهى',
                sub: 'إسبريسو وبيج',
                color: 'from-amber-50 to-stone-200 border-amber-700/40',
                badge: '☕ مقاهي وحلويات',
              },
              {
                id: 'oriental_heritage',
                title: 'تراثي وشامي',
                sub: 'زيتوني وشرقي',
                color: 'from-emerald-50 to-emerald-100 border-emerald-800/30',
                badge: '🫒 مأكولات أصيلة',
              },
              {
                id: 'custom_bg',
                title: 'خلفية مخصصة',
                sub: cardBgImage ? 'تم رفع صورتك' : 'رفع صورة مطعمك',
                color: 'from-orange-50 to-rose-50 border-orange-300',
                badge: '🖼️ صورة خاصة',
              },
            ].map((themeItem) => {
              const isSelected = cardTheme === themeItem.id;
              return (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() => handleThemeChange(themeItem.id as StandCardTheme)}
                  className={`relative p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
                    isSelected
                      ? 'ring-2 ring-orange-500 border-orange-500 shadow-md bg-orange-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {themeItem.badge}
                      </span>
                      {isSelected && <Check size={14} className="text-orange-600 font-bold" />}
                    </div>
                    <div className="font-black text-xs text-slate-900 mt-1">{themeItem.title}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{themeItem.sub}</div>
                  </div>

                  <div className={`h-2 rounded-full w-full mt-2 bg-gradient-to-r ${themeItem.color}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Background Uploader Bar */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {cardBgImage ? (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-orange-500 shadow-xs shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cardBgImage} alt="خلفية المطعم" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                <ImageIcon size={24} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">
                  {cardBgImage ? 'صورة الخلفية المخصصة للمطعم مفعّلة' : 'تخصيص خلفية خاصة بالمطعم'}
                </span>
                {cardBgImage && (
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
                    نشطة
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ارفع صورة للديكور الداخلي لمطعمك، أو تصميم خاص، وستظهر كخلفية أنيقة تحيط بستاند الطاولة مع مركز زجاجي مصقول عالي الوضوح.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <input
              type="file"
              ref={fileInputBgRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadBgImage(file);
              }}
            />

            <button
              type="button"
              disabled={isUploadingBg}
              onClick={() => fileInputBgRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Upload size={13} />
              <span>{isUploadingBg ? 'جاري الرفع...' : cardBgImage ? 'تغيير صورة الخلفية' : 'رفع صورة خلفية جديدة'}</span>
            </button>

            {cardBgImage && (
              <button
                type="button"
                onClick={handleRemoveBgImage}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-rose-200"
                title="إزالة الصورة المخصصة والعودة للأنماط الجاهزة"
              >
                <Trash2 size={13} />
                <span>إزالة</span>
              </button>
            )}
          </div>
        </div>

        {/* Tagline Customizer Field */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">
              العبارة الترحيبية / الوصف على الستاند:
            </label>
            <input
              type="text"
              value={cardTagline}
              onChange={(e) => handleTaglineChange(e.target.value)}
              placeholder="مثال: أشهى المأكولات والمشروبات بنكهات أصيلة"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              تظهر هذه العبارة أسفل اسم المطعم في بطاقة ستاند الطاولة
            </span>
          </div>

          <div>
            <label className="text-xs font-black text-slate-800 block mb-1">
              معاينة سريعة للستاند المطبوع:
            </label>
            <div className="bg-slate-100/80 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-700">
                  النمط المختار: {
                    cardTheme === 'modern_luxury' ? 'فخامة ملكية (عاجي وذهبي)' :
                    cardTheme === 'clean_minimal' ? 'مينيمل عصري (أبيض نقي)' :
                    cardTheme === 'burger_grill' ? 'برجر آند جريل (فحمي داكن)' :
                    cardTheme === 'cafe_warm' ? 'كافيه ومقهى (إسبريسو دافئ)' :
                    cardTheme === 'oriental_heritage' ? 'تراثي وشامي (زيتوني أصيل)' :
                    'خلفية مخصصة بصورة المطعم'
                  }
                </span>
              </div>
              <span className="text-[11px] font-black text-orange-600">طاولة رقم ١</span>
            </div>
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
            
            {/* Printable Preview Frame (Matches selected cardTheme and custom cardBgImage) */}
            <div
              className={`rounded-3xl p-5 mb-4 relative shadow-lg text-center overflow-hidden border-2 transition-all ${
                cardTheme === 'burger_grill'
                  ? 'bg-zinc-900 border-orange-500 text-white'
                  : cardTheme === 'clean_minimal'
                  ? 'bg-white border-slate-200 text-slate-900'
                  : cardTheme === 'cafe_warm'
                  ? 'bg-gradient-to-b from-stone-100 to-amber-50 border-amber-800/40 text-stone-900'
                  : cardTheme === 'oriental_heritage'
                  ? 'bg-gradient-to-b from-emerald-50 to-stone-50 border-emerald-800/40 text-emerald-950'
                  : 'bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 border-amber-400 text-slate-900'
              }`}
              style={cardBgImage ? { backgroundImage: `url('${cardBgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
              {/* Frosted inner card if custom background is used */}
              <div className={cardBgImage ? 'bg-white/92 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/80' : ''}>
                <div className="flex items-center justify-center gap-1.5 text-xs font-black mb-1">
                  {restaurantLogo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={restaurantLogo}
                      alt="Logo"
                      className="w-10 h-10 rounded-full object-cover border-2 shadow-xs mb-1"
                      style={{ borderColor: qrColor }}
                    />
                  ) : (
                    <div className="flex items-center gap-1 text-amber-500">
                      <span>✦</span>
                      <span className="text-base">🍽️</span>
                      <span>✦</span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-black mb-0.5">
                  {restaurantName || 'أهلاً وسهلاً بكم'}
                </h3>
                <p className="text-[10.5px] font-bold opacity-80 max-w-[220px] mx-auto mb-2.5 leading-snug">
                  {cardTagline || 'قائمة الطعام الرقمية والطلب المباشر إلى طاولتك'}
                </p>

                {/* Proper Arabic badge */}
                <div
                  className="inline-flex items-center justify-center gap-2 px-4 py-1 rounded-full text-white text-xs font-black mb-3 shadow-sm"
                  style={{ backgroundColor: qrColor }}
                >
                  <span>طاولة رقم</span>
                  <span className="text-yellow-300 text-sm font-black">{selectedPrintTable.tableNumber}</span>
                </div>

                <div className="w-48 h-48 bg-white p-3 rounded-2xl border-2 mx-auto shadow-md mb-3 flex items-center justify-center" style={{ borderColor: qrColor }}>
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

                <p className="text-xs font-black mb-0.5">امسح الرمز لطلب طعامك مباشرة 📲</p>
                <p className="text-[10px] opacity-70 font-medium max-w-[200px] mx-auto mb-2.5">
                  وجّه كاميرا هاتفك نحو الرمز لتصفح القائمة والطلب إلى طاولتك
                </p>

                <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-200/60 text-[10px] font-extrabold">
                  <span className="bg-slate-100/80 px-2 py-0.5 rounded-md">📷 ١. الكاميرا</span>
                  <span className="bg-slate-100/80 px-2 py-0.5 rounded-md">🍔 ٢. طلبك</span>
                  <span className="bg-slate-100/80 px-2 py-0.5 rounded-md">⚡ ٣. لطاولتك</span>
                </div>
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
