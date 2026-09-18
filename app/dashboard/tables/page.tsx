'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, ExternalLink, Copy, Check, QrCode, Palette, Download, Eye, Sparkles, Upload, Image as ImageIcon, Trash2, Layers, RefreshCw, ChevronDown } from 'lucide-react';
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
  const [showCustomizer, setShowCustomizer] = useState(false);

  // QR Customization Studio States
  const [qrColor, setQrColor] = useState<string>('#0f172a');
  const [qrStyle, setQrStyle] = useState<'artistic' | 'photo_watermark' | 'image_fill' | 'center_badge' | 'solid'>('artistic');
  const [reduceGaps, setReduceGaps] = useState<boolean>(true);
  const [isUploadingQrImage, setIsUploadingQrImage] = useState<boolean>(false);
  const fileInputQrRef = React.useRef<HTMLInputElement>(null);

  // Table Stand Card Background & Theme Customization States
  const [cardTheme, setCardTheme] = useState<StandCardTheme>('crystal_gold');
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
          <button
            type="button"
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showCustomizer
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
            }`}
          >
            <Palette size={15} className={showCustomizer ? 'text-orange-400' : 'text-slate-500'} />
            <span>{showCustomizer ? 'إخفاء خيارات الـ QR' : 'تخصيص باركود الـ QR'}</span>
          </button>

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

      {/* Sleek, Compact QR & Stand Customizer Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:px-4 sm:py-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
              <Palette size={16} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-black text-slate-900">تخصيص بطاقات الطاولات والباركود:</span>
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: qrColor }} />
                <span>
                  {qrStyle === 'center_badge' ? 'شعار بالمنتصف' : qrStyle === 'photo_watermark' ? 'خلفية صورة واضحة 100%' : qrStyle === 'solid' ? 'لون موحد' : 'تصميم فني'}
                </span>
              </span>
              {cardBgImage ? (
                <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg font-bold text-[11px] flex items-center gap-1">
                  <span>خلفية مخصصة للبطاقة 🖼️</span>
                </span>
              ) : (
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                  {cardTheme === 'modern_luxury' ? 'قالب ذهبي فخم ✨' : cardTheme === 'burger_grill' ? 'قالب برجر ومشاوي 🔥' : cardTheme === 'cafe_warm' ? 'قالب كافيه دافئ ☕' : cardTheme === 'oriental_heritage' ? 'قالب تراثي شرقي 🌿' : 'قالب أبيض ناصع ⚪'}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{showCustomizer ? 'إخفاء لوحة التخصيص' : 'تخصيص الخلفية ومظهر البطاقة والـ QR ⚙️'}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showCustomizer ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Clean Settings Panel */}
        {showCustomizer && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
            
            {/* 1. Background & Stand Card Theme Section (خلفية وتصميم بطاقة الطاولة المطبوعة) */}
            <div className="bg-gradient-to-br from-amber-50/60 via-slate-50/80 to-orange-50/50 p-4 rounded-2xl border border-amber-200/70 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🖼️</span>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">خلفية وتصميم بطاقة الطاولة المطبوعة (A5 Stand Card)</h3>
                    <p className="text-[11px] text-slate-500">اختر صورة صالة المطعم أو قالباً جاهزاً مع ضمان وضوح الخطوط بنسبة 100%</p>
                  </div>
                </div>
              </div>

              {/* Background Image Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  {cardBgImage ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-500 shadow-xs shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cardBgImage} alt="خلفية البطاقة" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-amber-100/60 border border-amber-200 text-amber-700 flex flex-col items-center justify-center font-black text-xs shrink-0">
                      <ImageIcon size={22} className="mb-0.5 text-amber-600" />
                      <span className="text-[10px]">بدون صورة</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {cardBgImage ? 'تم تفعيل صورة خلفية البطاقة المطبوعة' : 'رفع صورة خلفية مخصصة للبطاقة المطبوعة'}
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 max-w-md leading-relaxed">
                      {cardBgImage
                        ? '✨ تظهر الصورة في خلفية البطاقة بالكامل مع كبسولات نصوص زجاجية داكنة تحافظ على وضوح الخطوط'
                        : 'يمكنك رفع صورة عالية الجودة لمطعمك أو صالتك لتظهر كخلفية كاملة للبطاقة مع نصوص زجاجية واضحة جداً'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>{isUploadingBg ? 'جاري الرفع...' : cardBgImage ? 'تغيير صورة الخلفية 🖼️' : 'رفع صورة خلفية للبطاقة 🖼️'}</span>
                  </button>

                  {cardBgImage && (
                    <button
                      type="button"
                      onClick={handleRemoveBgImage}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                      title="إزالة صورة الخلفية والعودة للقالب القياسي"
                    >
                      <Trash2 size={13} />
                      <span>إزالة الصورة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ready Preset Themes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">أو اختر قالب تصميم جاهز وبلمسة جمالية فاخرة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { id: 'crystal_gold', label: '💎 زجاج الكريستال', desc: 'مثالي للرخام والخلفيات' },
                    { id: 'imperial_obsidian', label: '👑 أسود ملكي مذهب', desc: 'Imperial Obsidian' },
                    { id: 'modern_luxury', label: '✨ ذهبي عاجي فاخر', desc: 'Modern Luxury' },
                    { id: 'burger_grill', label: '🔥 برجر ومشاوي', desc: 'Dark Charcoal' },
                    { id: 'cafe_warm', label: '☕ كافيه ومخبوزات', desc: 'Warm Latte' },
                    { id: 'clean_minimal', label: '⚪ أبيض ناصع', desc: 'Clean Minimal' },
                  ].map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handleThemeChange(th.id as any)}
                      className={`p-2.5 text-right rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col justify-between ${
                        cardTheme === th.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-amber-400/40'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="font-black text-[11px]">{th.label}</span>
                      <span className={`text-[9.5px] mt-0.5 ${cardTheme === th.id ? 'text-slate-300' : 'text-slate-500'}`}>
                        {th.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tagline input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">نص العبارة الترحيبية على البطاقة:</label>
                <input
                  type="text"
                  value={cardTagline}
                  onChange={(e) => handleTaglineChange(e.target.value)}
                  placeholder="امسح الرمز لتصفح قائمة الطعام والطلب مباشرة إلى طاولتك"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

            </div>

            {/* 2. QR Code Customizer Section (باركود الـ QR، النمط والألوان) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                <QrCode size={15} className="text-slate-700" />
                <h3 className="text-xs font-black text-slate-900">تخصيص باركود الـ QR (الشعار والألوان)</h3>
              </div>

              {/* QR Style Select */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">شكل الرمز والشعار:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'center_badge', label: '🏷️ شعار بالمنتصف', desc: 'لوجو في قلب الرمز' },
                    { id: 'photo_watermark', label: '🖼️ خلفية صورة واضحة (100%)', desc: 'صورتك كاملة بدون أي طبقة شفافة' },
                    { id: 'solid', label: '⬛ لون موحد كلاسيكي', desc: 'رمز أنيق باللون المختار' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStyleChange(st.id as any)}
                      className={`p-2.5 text-right rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col justify-between ${
                        qrStyle === st.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="font-black">{st.label}</span>
                      <span className={`text-[10.5px] mt-0.5 ${qrStyle === st.id ? 'text-slate-300' : 'text-slate-500'}`}>
                        {st.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Colors */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">لون الهوية والرمز:</label>
                <div className="flex flex-wrap items-center gap-2">
                  {QR_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleColorChange(preset.hex)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        qrColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200">
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                      title="لون مخصص"
                    />
                    <span className="text-[11px] font-mono font-bold uppercase text-slate-600">{qrColor}</span>
                  </div>
                </div>
              </div>

              {/* QR Photo / Logo Upload */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
                <div className="flex items-center gap-3">
                  {restaurantLogo ? (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-orange-500 shadow-2xs shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-black text-sm shrink-0">
                      📷
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {restaurantLogo ? 'تم إضافة صورة الـ QR بنجاح' : 'ارفع صورة أو لوجو خاص بالـ QR'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                      ✨ الصورة تظهر بألوانها الأصلية وبدقة كاملة 100% بدون أي طبقة شفافة أو تعتيم
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                    className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>{isUploadingQrImage ? 'جاري الرفع...' : restaurantLogo ? 'تغيير صورة الـ QR' : 'رفع صورة للـ QR'}</span>
                  </button>

                  {restaurantLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        setRestaurantLogo('');
                        handleStyleChange('solid');
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>إزالة</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
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
                    <span>طباعة بطاقة طاولة {table.tableNumber}</span>
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
            
            {/* Quick Background & Theme Controls in Modal */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs">
                <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                  <span>🖼️ صورة الخلفية:</span>
                  <span className={cardBgImage ? 'text-amber-700 font-black' : 'text-slate-500 font-medium'}>
                    {cardBgImage ? 'صورة مخصصة' : 'قالب تلقائي'}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputBgRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Upload size={11} />
                    <span>{cardBgImage ? 'تغيير الصورة 🖼️' : 'رفع صورة خلفية 🖼️'}</span>
                  </button>
                  {cardBgImage && (
                    <button
                      type="button"
                      onClick={handleRemoveBgImage}
                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] border border-rose-200 transition-colors cursor-pointer"
                      title="إزالة صورة الخلفية والعودة للتصميم القياسي"
                    >
                      <Trash2 size={11} />
                      <span>إزالة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Theme Switcher Pills */}
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-0.5">
                {[
                  { id: 'crystal_gold', label: '💎 زجاج الكريستال' },
                  { id: 'imperial_obsidian', label: '👑 أسود ملكي' },
                  { id: 'modern_luxury', label: '✨ ذهبي عاجي' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => handleThemeChange(th.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                      cardTheme === th.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Printable Preview Frame: Royal Stand Plaque */}
            <div 
              className="rounded-3xl p-2.5 mb-3 relative shadow-xl text-center overflow-hidden border-2 border-amber-400/80 min-h-[440px] flex items-center justify-center"
              style={{ background: cardBgImage ? `url(${cardBgImage}) center/cover no-repeat` : '#fdfbf7' }}
            >
              {cardBgImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={cardBgImage} alt="خلفية البطاقة" className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" />
              )}
              {cardBgImage && (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-transparent to-slate-950/25 pointer-events-none z-1" />
              )}

              {/* Central Royal Plaque: Smoked Luxury Glass & Pure White Fonts */}
              <div 
                className="relative z-10 w-full h-full rounded-2xl p-4 flex flex-col items-center justify-between border-2 border-amber-400/90 bg-slate-950/78 backdrop-blur-md text-white shadow-2xl transition-all"
              >
                {/* 4 Ornate Corner Filigrees */}
                <svg className="absolute top-1.5 left-1.5 w-6 h-6 text-amber-400 pointer-events-none" viewBox="0 0 32 32" fill="none">
                  <path d="M2 2h22M2 2v22M5 5h14M5 5v14M2 2l10 10M5 5l7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="15" cy="15" r="2.2" fill="currentColor"/>
                </svg>
                <svg className="absolute top-1.5 right-1.5 w-6 h-6 text-amber-400 pointer-events-none" viewBox="0 0 32 32" fill="none">
                  <path d="M30 2H8M30 2v22M27 5H13M27 5v14M30 2L20 12M27 5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="17" cy="15" r="2.2" fill="currentColor"/>
                </svg>
                <svg className="absolute bottom-1.5 left-1.5 w-6 h-6 text-amber-400 pointer-events-none" viewBox="0 0 32 32" fill="none">
                  <path d="M2 30h22M2 30V8M5 27h14M5 27V13M2 30l10-10M5 27l7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="15" cy="17" r="2.2" fill="currentColor"/>
                </svg>
                <svg className="absolute bottom-1.5 right-1.5 w-6 h-6 text-amber-400 pointer-events-none" viewBox="0 0 32 32" fill="none">
                  <path d="M30 30H8M30 30V8M27 27H13M27 27V13M30 30L20 20M27 27l-7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="17" cy="17" r="2.2" fill="currentColor"/>
                </svg>

                {/* Inner Hairline Frame */}
                <div className="absolute inset-1.5 border border-amber-400/40 rounded-xl pointer-events-none" />

                {/* Top Section */}
                <div className="w-full flex flex-col items-center justify-center text-center z-10 pt-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-1.5">
                    <span>❖</span>
                    <span>أهلاً وسهلاً بكم</span>
                    <span>❖</span>
                  </div>

                  {restaurantLogo && (
                    <div className="w-14 h-14 rounded-full border-2 border-amber-400 p-0.5 shadow-md bg-white mb-2 overflow-hidden mx-auto flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={restaurantLogo} alt="Logo" className="w-full h-full rounded-full object-cover" />
                    </div>
                  )}

                  <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md">
                    {restaurantName || 'أهلاً وسهلاً بكم'}
                  </h3>
                  <p className="text-xs font-bold text-slate-200 max-w-[240px] mx-auto mt-1 leading-snug drop-shadow-xs">
                    {cardTagline}
                  </p>

                  {/* Table Seal Badge */}
                  <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-white text-xs font-black mt-2.5 shadow-md bg-gradient-to-r from-amber-600 to-amber-700 border border-yellow-300">
                    <span className="text-xs">👑 طاولة</span>
                    <span className="text-yellow-200 text-sm font-black">{selectedPrintTable.tableNumber}</span>
                  </div>
                </div>

                {/* QR Hero Pedestal (Enlarged QR Code) */}
                <div className="w-full flex flex-col items-center my-3 z-10">
                  <span className="text-xs font-bold text-white mb-1.5 flex items-center gap-1.5 drop-shadow-xs">
                    <span className="text-emerald-400">📷</span>
                    <span>وجّه الكاميرا وامسح للطلب</span>
                  </span>
                  <div className="relative p-2.5 bg-white rounded-2xl border-2 border-amber-400 shadow-xl flex items-center justify-center">
                    {/* Corner Brackets */}
                    <span className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-500 rounded-tl-xs" />
                    <span className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-500 rounded-tr-xs" />
                    <span className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-500 rounded-bl-xs" />
                    <span className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-500 rounded-br-xs" />

                    {selectedPrintTable.qrDataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={selectedPrintTable.qrDataUrl} alt="QR" className="w-48 h-48 object-contain rounded-lg" />
                    ) : (
                      <QrCode size={70} className="text-slate-300" />
                    )}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="w-full flex flex-col items-center gap-2 z-10 pb-1">
                  <div className="flex items-center justify-center gap-2 text-[11px] font-extrabold text-white">
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10 shadow-2xs">
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">١</span>
                      <span>تصفح</span>
                    </span>
                    <span className="text-amber-400">•</span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10 shadow-2xs">
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">٢</span>
                      <span>اختر</span>
                    </span>
                    <span className="text-amber-400">•</span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10 shadow-2xs">
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">٣</span>
                      <span>اطلب</span>
                    </span>
                  </div>

                  <p className="text-[10.5px] font-bold text-slate-200 drop-shadow-xs">
                    نتمنى لكم وجبة شهية وتجربة استثنائية ✨
                  </p>
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
                  <span>طباعة البطاقة</span>
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
