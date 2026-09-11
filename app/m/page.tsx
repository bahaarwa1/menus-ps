'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, Minus, X, Check, Search, Bell, Star, 
  Utensils, Edit3, AlertCircle, ShieldCheck, Flame, 
  Sparkles, ChefHat, ArrowLeft, ArrowRight, Loader2,
  Store, Home
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

import { categories as fallbackCategories, menuItems as fallbackMenuItems } from '@/data/demo-data';

// --- DB-driven types (mirrors PublicMenuCategory from menu.repository) ---
interface Extra { id: string; name: string; price: number; }
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  imageUrl?: string;
  popular?: boolean;
  spicy?: boolean;
  category: string; // category id
  extras?: Extra[];
}
interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  items: MenuItem[];
}

// Pre-compute instant 0ms fallback dataset
const initialCategories: MenuCategory[] = fallbackCategories.map((cat) => ({
  id: cat.id,
  name: cat.name,
  icon: cat.icon,
  items: fallbackMenuItems
    .filter((item) => item.category === cat.id)
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      imageUrl: item.imageUrl,
      popular: item.popular,
      spicy: item.spicy,
      category: item.category,
      extras: item.extras,
    })),
}));

const initialMenuItems: MenuItem[] = fallbackMenuItems.map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  image: item.image,
  imageUrl: item.imageUrl,
  popular: item.popular,
  spicy: item.spicy,
  category: item.category,
  extras: item.extras,
}));

function FastFrictionlessMenuContent() {
  const searchParams = useSearchParams();
  const qrTokenParam = searchParams.get('t') || searchParams.get('token') || '';
  const restaurantParam = searchParams.get('restaurant') || '';
  const tableParam = searchParams.get('table') || '';
  const defaultSlug = 'burger-house-nablus';

  // Instant extraction from QR token (e.g. qr_burger-house-nablus_t2_xyz)
  const tokenSlugMatch = qrTokenParam ? qrTokenParam.match(/^qr_([a-zA-Z0-9-]+)_t\d+/) : null;
  const slugFromToken = tokenSlugMatch ? tokenSlugMatch[1] : '';
  const tokenTableMatch = qrTokenParam ? qrTokenParam.match(/_t(\d+)_/) : null;
  const tableFromToken = tokenTableMatch ? parseInt(tokenTableMatch[1], 10) : 0;
  const tableFromParam = tableParam ? parseInt(tableParam, 10) : 0;

  const notFoundParam = searchParams.get('notFound') === '1';
  const effectiveSlug = restaurantParam || slugFromToken || (qrTokenParam ? '' : defaultSlug);
  const isDemo = effectiveSlug === 'burger-house-nablus' || effectiveSlug === 'demo';
  const { direction, language } = useLanguage();

  const [isRestaurantNotFound, setIsRestaurantNotFound] = useState<boolean>(notFoundParam);

  // Instant 0ms menu state pre-hydrated ONLY for demo; registered restaurants start clean
  const [dbCategories, setDbCategories] = useState<MenuCategory[]>(isDemo ? initialCategories : []);
  const [dbMenuItems, setDbMenuItems] = useState<MenuItem[]>(isDemo ? initialMenuItems : []);
  const [menuLoading, setMenuLoading] = useState(!isDemo);
  const [menuError, setMenuError] = useState('');

  const [activeCategory, setActiveCategory] = useState(isDemo ? (initialCategories[0]?.id || 'burgers') : '');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Table state: resolve from URL table param, QR token, or demo table 1
  const initialTable = tableFromParam || tableFromToken || (isDemo ? 1 : 0);
  const [tableNumber, setTableNumber] = useState<number>(initialTable);
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(initialTable > 0 || isDemo);
  const [tokenError, setTokenError] = useState<string>('');
  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [customTableInput, setCustomTableInput] = useState('');

  // Cart state
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [selectedExtras, setSelectedExtras] = useState<Record<string, string[]>>({});
  
  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [tempExtras, setTempExtras] = useState<string[]>([]);

  // Order review drawer & submitted state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState('');
  const [serverVerifiedTotal, setServerVerifiedTotal] = useState<number | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [liveOrderStatus, setLiveOrderStatus] = useState<'new' | 'cooking' | 'ready' | 'completed'>('new');

  // Touch swipe between categories
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null || touchStartY === null || touchEndY === null) return;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      const currentIdx = dbCategories.findIndex(c => c.id === activeCategory);
      if (diffX > 0 && currentIdx < dbCategories.length - 1) {
        setActiveCategory(dbCategories[currentIdx + 1].id);
        setSearchQuery('');
      } else if (diffX < 0 && currentIdx > 0) {
        setActiveCategory(dbCategories[currentIdx - 1].id);
        setSearchQuery('');
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
    setTouchStartY(null);
    setTouchEndY(null);
  };

  useEffect(() => {
    const activeBtn = document.getElementById(`cat-btn-${activeCategory}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeCategory]);

  // Realtime order status tracking — Dual Mode: Polling every 2s + SSE push for instant updates
  useEffect(() => {
    if (!isOrderSubmitted || !submittedOrderId) return;

    // 1. Silent Fast Polling (guaranteed across all environments including Vercel serverless)
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/v1/orders/${encodeURIComponent(submittedOrderId)}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.order) {
          const rawStatus = data.order.status;
          if (rawStatus === 'cooking' || rawStatus === 'قيد التحضير') {
            setLiveOrderStatus('cooking');
          } else if (rawStatus === 'ready' || rawStatus === 'جاهز') {
            setLiveOrderStatus('ready');
          } else if (rawStatus === 'completed' || rawStatus === 'تم التسليم') {
            setLiveOrderStatus('completed');
          }
        }
      } catch {}
    };

    pollStatus();
    const pollTimer = setInterval(pollStatus, 2000);

    // 2. Server-Sent Events (SSE) for instant sub-second push
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/v1/orders/stream?orderId=${encodeURIComponent(submittedOrderId)}`);
      eventSource.addEventListener('order', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.order && (payload.order.id === submittedOrderId || payload.order.orderNumber === submittedOrderId)) {
            const rawStatus = payload.order.status;
            if (rawStatus === 'cooking' || rawStatus === 'قيد التحضير') {
              setLiveOrderStatus('cooking');
            } else if (rawStatus === 'ready' || rawStatus === 'جاهز') {
              setLiveOrderStatus('ready');
            } else if (rawStatus === 'completed' || rawStatus === 'تم التسليم') {
              setLiveOrderStatus('completed');
            }
          }
        } catch {}
      });
    } catch {}

    return () => {
      clearInterval(pollTimer);
      eventSource?.close();
    };
  }, [isOrderSubmitted, submittedOrderId]);

  const [activeRestaurantSlug, setActiveRestaurantSlug] = useState<string>(effectiveSlug);
  const [activeRestaurantName, setActiveRestaurantName] = useState<string>(() => {
    if (isDemo) return 'Burger House نابلس';
    if (typeof window !== 'undefined' && effectiveSlug) {
      try {
        const cached = sessionStorage.getItem(`restaurant_meta_${effectiveSlug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.name) return parsed.name;
        }
      } catch {}
    }
    return '';
  });
  const [activeRestaurantLogo, setActiveRestaurantLogo] = useState<string>(() => {
    if (typeof window !== 'undefined' && effectiveSlug) {
      try {
        const cached = sessionStorage.getItem(`restaurant_meta_${effectiveSlug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.logoUrl) return parsed.logoUrl;
        }
      } catch {}
    }
    return '';
  });
  const [activeRestaurantCity, setActiveRestaurantCity] = useState<string>(() => {
    if (isDemo) return 'نابلس';
    if (typeof window !== 'undefined' && effectiveSlug) {
      try {
        const cached = sessionStorage.getItem(`restaurant_meta_${effectiveSlug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.city) return parsed.city;
        }
      } catch {}
    }
    return '';
  });
  const [activeBranchId, setActiveBranchId] = useState<string>('');

  // Fetch restaurant details (logo, city, branchId, etc.) and strictly verify validity
  useEffect(() => {
    if (!activeRestaurantSlug) return;

    if (isDemo) {
      setIsRestaurantNotFound(false);
      setActiveRestaurantName('Burger House نابلس');
      setActiveRestaurantCity('نابلس');
      return;
    }

    let isSubscribed = true;

    fetch(`/api/v1/restaurant/settings?slug=${encodeURIComponent(activeRestaurantSlug)}`)
      .then(async (res) => {
        if (!isSubscribed) return null;
        if (res.status === 404) {
          setIsRestaurantNotFound(true);
          setMenuLoading(false);
          setActiveRestaurantName('');
          return null;
        }
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (!isSubscribed || !data) return;
        if (data.success && data.settings) {
          setIsRestaurantNotFound(false);
          if (data.settings.logoUrl) setActiveRestaurantLogo(data.settings.logoUrl);
          if (data.settings.name) setActiveRestaurantName(data.settings.name);
          if (data.settings.city) setActiveRestaurantCity(data.settings.city);
          if (data.settings.branchId) setActiveBranchId(data.settings.branchId);

          try {
            sessionStorage.setItem(`restaurant_meta_${activeRestaurantSlug}`, JSON.stringify({
              name: data.settings.name,
              logoUrl: data.settings.logoUrl || '',
              city: data.settings.city || '',
              branchId: data.settings.branchId || '',
            }));
          } catch {}
        } else {
          setIsRestaurantNotFound(true);
          setMenuLoading(false);
          setActiveRestaurantName('');
        }
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [activeRestaurantSlug, isDemo]);

  // Dynamic QR Token & Table Verification on Load
  useEffect(() => {
    if (restaurantParam) {
      setActiveRestaurantSlug(restaurantParam);
      if (tableFromParam > 0) {
        setTableNumber(tableFromParam);
        setIsTokenVerified(true);
      }
    }
    if (qrTokenParam) {
      fetch(`/api/v1/tables/verify-token?token=${encodeURIComponent(qrTokenParam)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.table) {
            setTableNumber(data.table.tableNumber);
            setIsTokenVerified(true);
            setTokenError('');
            if (data.table.restaurantSlug) setActiveRestaurantSlug(data.table.restaurantSlug);
            if (data.table.restaurantName) setActiveRestaurantName(data.table.restaurantName);
            if (data.table.branchId) setActiveBranchId(data.table.branchId);
          } else {
            setTokenError(data.error || 'رمز QR غير صالح أو منتهي الصلاحية');
          }
        })
        .catch(() => {
          setTokenError('تعذر التحقق من رمز QR');
        });
    }
  }, [qrTokenParam, restaurantParam, tableFromParam]);

  // Fetch menu with instant client-side SWR (Stale-While-Revalidate) cache
  useEffect(() => {
    if (!activeRestaurantSlug || isRestaurantNotFound) return;

    if (isDemo) {
      setDbCategories(initialCategories);
      setDbMenuItems(initialMenuItems);
      setActiveCategory(initialCategories[0]?.id || 'burgers');
      setMenuLoading(false);
      return;
    }

    // 1. Instant Cache Hydration from sessionStorage
    const cacheKey = `menus_cache_${activeRestaurantSlug}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDbCategories(parsed);
          const allItems: MenuItem[] = parsed.flatMap(cat =>
            cat.items.map((item: any) => ({ ...item, category: cat.id }))
          );
          setDbMenuItems(allItems);
          setActiveCategory((prev) => prev || parsed[0].id);
          setMenuLoading(false); // Render immediately without waiting for network!
        }
      }
    } catch {}

    // 2. Background Revalidation / Initial Fetch
    setMenuError('');
    let isSubscribed = true;

    fetch(`/api/v1/menu?slug=${encodeURIComponent(activeRestaurantSlug)}`)
      .then(async (r) => {
        if (!isSubscribed) return null;
        if (r.status === 404) {
          setIsRestaurantNotFound(true);
          setMenuLoading(false);
          return null;
        }
        return r.json().catch(() => null);
      })
      .then((data) => {
        if (!isSubscribed || !data) return;
        if (data.success === false) {
          setIsRestaurantNotFound(true);
          setMenuLoading(false);
          return;
        }
        if (data.categories && Array.isArray(data.categories)) {
          const cats: MenuCategory[] = data.categories;
          setDbCategories(cats);
          const allItems: MenuItem[] = cats.flatMap(cat =>
            cat.items.map(item => ({ ...item, category: cat.id }))
          );
          setDbMenuItems(allItems);
          setActiveCategory(cats.length > 0 ? cats[0].id : '');
          // Update cache for instant future loads
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(cats));
          } catch {}
        } else {
          setDbCategories([]);
          setDbMenuItems([]);
          setActiveCategory('');
        }
      })
      .catch(() => {
        // If network error and no cached items, show error
        if (isSubscribed) {
          setDbCategories(prev => {
            if (prev.length === 0 && isDemo) setMenuError('تعذر تحميل قائمة الطعام');
            return prev;
          });
        }
      })
      .finally(() => {
        if (isSubscribed) setMenuLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeRestaurantSlug, isDemo, isRestaurantNotFound]);

  // Fast quantity modifications
  const addOne = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCartQuantities(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const removeOne = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCartQuantities(prev => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  // Filtered menu — from DB with resilient category fallback
  const filteredItems = useMemo(() => {
    const currentCat = (activeCategory && dbCategories.some(c => c.id === activeCategory))
      ? activeCategory
      : (dbCategories[0]?.id || '');

    return dbMenuItems.filter(item => {
      const matchCat = searchQuery ? true : (!currentCat || item.category === currentCat);
      const matchSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [dbMenuItems, dbCategories, activeCategory, searchQuery]);

  // Cart summary — uses dbMenuItems
  const cartItemsList = useMemo(() => {
    return Object.entries(cartQuantities).map(([id, qty]) => {
      const item = dbMenuItems.find(m => m.id === id);
      if (!item) return null;
      
      const extrasList = selectedExtras[id] || [];
      const extrasPrice = extrasList.reduce((acc, extraName) => {
        const extraObj = item.extras?.find(e => e.name === extraName);
        return acc + (extraObj?.price || 0);
      }, 0);

      const unitPrice = item.price + extrasPrice;

      return {
        item,
        quantity: qty,
        note: itemNotes[id] || '',
        extras: extrasList,
        unitPrice,
        total: unitPrice * qty
      };
    }).filter((ci): ci is NonNullable<typeof ci> => ci !== null && ci.quantity > 0);
  }, [dbMenuItems, cartQuantities, itemNotes, selectedExtras]);

  const totalAmount = cartItemsList.reduce((sum, ci) => sum + ci.total, 0);
  const totalCount = cartItemsList.reduce((sum, ci) => sum + ci.quantity, 0);

  // Open item modal for details/customization
  const openProductModal = (item: MenuItem) => {
    setSelectedProduct(item);
    setTempNote(itemNotes[item.id] || '');
    setTempExtras(selectedExtras[item.id] || []);
  };

  const handleSaveProductModal = () => {
    if (!selectedProduct) return;
    const id = selectedProduct.id;
    
    setItemNotes(prev => ({ ...prev, [id]: tempNote.trim() }));
    setSelectedExtras(prev => ({ ...prev, [id]: tempExtras }));

    if (!cartQuantities[id]) {
      setCartQuantities(prev => ({ ...prev, [id]: 1 }));
    }

    setSelectedProduct(null);
  };

  const toggleExtra = (extraName: string) => {
    setTempExtras(prev => 
      prev.includes(extraName) 
        ? prev.filter(e => e !== extraName) 
        : [...prev, extraName]
    );
  };

  const handleSendOrder = async () => {
    if (Object.keys(cartQuantities).length === 0) return;

    // If table number is missing or 0, open table picker modal instead of sending invalid order
    if (!tableNumber || tableNumber <= 0) {
      setIsTablePickerOpen(true);
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError('');

    try {
      const itemsPayload = Object.entries(cartQuantities).map(([id, qty]) => ({
        itemId: id,
        quantity: qty,
        note: itemNotes[id] || undefined,
        extras: selectedExtras[id] || undefined,
        selectedExtras: selectedExtras[id] || undefined,
      }));

      const res = await fetch('/api/v1/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: activeBranchId || undefined,
          restaurantSlug: activeRestaurantSlug,
          tableNumber,
          tableToken: qrTokenParam || undefined,
          items: itemsPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setOrderError(data.error || 'تعذر إرسال الطلب، يرجى المحاولة مرة أخرى');
        setIsSubmittingOrder(false);
        return;
      }

      setSubmittedOrderId(data.order.id || data.order.orderNumber);
      setServerVerifiedTotal(data.order.totalAmount);
      setIsReviewOpen(false);
      setIsOrderSubmitted(true);
      setCartQuantities({});
      setItemNotes({});
      setSelectedExtras({});
    } catch {
      setOrderError('تعذر الاتصال بالسيرفر. يرجى التأكد من اتصال الإنترنت');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
  };

  if (isRestaurantNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-center items-center px-4 py-12 text-slate-800 font-sans antialiased selection:bg-orange-500 selection:text-white" dir={direction}>
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Decorative accents */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200/80 flex items-center justify-center mx-auto mb-5 text-rose-500 shadow-md shadow-rose-500/10">
            <Store size={38} className="stroke-[1.8]" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100/70 text-rose-700 mb-3">
            <AlertCircle size={14} />
            {language === 'ar' ? 'المطعم غير موجود' : 'Restaurant Not Found'}
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 leading-tight">
            {language === 'ar' ? 'عذراً، هذا المطعم غير مسجل' : 'Sorry, restaurant not found'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
            {language === 'ar'
              ? 'لم يتم العثور على أي مطعم مسجل بهذا الرابط. قد يكون الرابط خاطئاً أو تم إدخال اسم غير صحيح.'
              : 'No registered restaurant was found for this link. It might be misspelled or no longer active.'}
          </p>

          {activeRestaurantSlug && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 mb-6 flex items-center justify-between gap-2">
              <span className="text-slate-400 font-medium">
                {language === 'ar' ? 'الرابط المطلوب:' : 'Requested Slug:'}
              </span>
              <code className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 max-w-[180px] truncate">
                {activeRestaurantSlug.slice(0, 30)}
              </code>
            </div>
          )}

          <div className="space-y-2.5">
            <a
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Home size={16} />
              <span>{language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Return to Home'}</span>
            </a>

            <a
              href="/m?restaurant=burger-house-nablus"
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Utensils size={15} />
              <span>{language === 'ar' ? 'تجربة قائمة طعام تجريبية (Demo)' : 'View Demo Restaurant Menu'}</span>
            </a>

            <a
              href="/register"
              className="w-full py-2.5 px-4 rounded-xl text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{language === 'ar' ? 'هل تملك مطعماً؟ سجّل الآن مجاناً' : 'Own a restaurant? Register free'}</span>
            </a>
          </div>

          <p className="text-[11px] text-slate-400 mt-6 leading-relaxed">
            {language === 'ar'
              ? 'إذا كنت داخل المطعم، يرجى مسح رمز الـ QR الموجود على طاولتك مرة أخرى.'
              : 'If you are at a table, please scan the QR code on your table again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-800 font-sans antialiased selection:bg-orange-500 selection:text-white" dir={direction}>
      
      {/* Real Responsive Customer Menu Container */}
      <div className="w-full max-w-lg bg-white min-h-screen shadow-xl flex flex-col relative pb-12">

        {/* ============================================================
            1. FIXED LUMINOUS APP BAR & CATEGORY BAR (تصميم مريح وأنيق على الجوال)
        ============================================================ */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs shrink-0">
          
          {/* Top Row: Brand + Table + Language + Waiter */}
          <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {activeRestaurantLogo ? (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-slate-200 shadow-2xs shrink-0 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeRestaurantLogo} alt={activeRestaurantName || 'Logo'} className="w-full h-full object-cover" />
                </div>
              ) : activeRestaurantName ? (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black flex items-center justify-center text-xs shadow-2xs shrink-0">
                  {activeRestaurantName.slice(0, 1).toUpperCase()}
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-200/80 animate-pulse shrink-0" />
              )}
              <div className="truncate min-w-0">
                <div className="flex items-center gap-1">
                  {activeRestaurantName ? (
                    <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {activeRestaurantName}
                    </h1>
                  ) : (
                    <div className="h-4 w-28 bg-slate-200/80 rounded-md animate-pulse my-0.5" />
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                </div>
                {activeRestaurantName ? (
                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 leading-none mt-0.5">
                    <span className="text-amber-500 font-bold flex items-center">
                      <Star size={9} fill="currentColor" /> 4.9
                    </span>
                    <span className="truncate">· {activeRestaurantCity || (language === 'ar' ? 'فلسطين' : 'Palestine')}</span>
                  </p>
                ) : (
                  <div className="h-2.5 w-16 bg-slate-200/60 rounded-sm animate-pulse mt-1" />
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Table Button / Picker */}
              <button
                onClick={() => setIsTablePickerOpen(true)}
                className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                  tableNumber > 0
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs animate-pulse'
                }`}
                title={language === 'ar' ? 'تحديد أو تغيير رقم الطاولة' : 'Select or change table'}
              >
                {tableNumber > 0 ? (
                  <>
                    <span className="text-[10px] text-amber-700 font-bold">{language === 'ar' ? 'طاولة' : 'T.'}</span>
                    <span className="text-xs font-black text-amber-950">{tableNumber}</span>
                  </>
                ) : (
                  <>
                    <Utensils size={11} />
                    <span>{language === 'ar' ? 'حدد الطاولة' : 'Set Table'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCallWaiter}
                className="bg-slate-100 hover:bg-orange-50 active:scale-95 px-2 py-1 rounded-full border border-slate-200 text-slate-700 hover:text-orange-600 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title={language === 'ar' ? 'طلب حضور الويتر للطاولة' : 'Call Waiter'}
              >
                <Bell size={12} className="text-orange-500" />
                <span className="hidden sm:inline text-[11px]">{language === 'ar' ? 'الويتر' : 'Waiter'}</span>
              </button>

              <LanguageSwitcher variant="subtle" />
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={14} className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} />
              <input 
                type="text"
                placeholder={language === 'ar' ? "ابحث عن وجبة، صوص، أو عصير..." : "Search burger, sides, drinks..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Categories Pill Slider */}
          {dbCategories.length > 0 && (
            <div className="px-3 py-2 bg-white/95 border-t border-slate-100 flex gap-1.5 overflow-x-auto hide-scrollbar">
              {dbCategories.map((cat) => {
                const isActive = activeCategory === cat.id && !searchQuery;
                const catName = language === 'en' 
                  ? (cat.id === 'burgers' ? 'Burgers' : cat.id === 'wraps' ? 'Wraps' : cat.id === 'sides' ? 'Sides' : cat.id === 'drinks' ? 'Drinks' : cat.id === 'desserts' ? 'Desserts' : cat.name)
                  : cat.name;
                return (
                  <button
                    key={cat.id}
                    id={`cat-btn-${cat.id}`}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSearchQuery('');
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25 ring-2 ring-orange-500/20'
                        : 'bg-slate-100/90 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{catName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Waiter Alert Toast Notification */}
          <AnimatePresence>
            {waiterCalled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <Check size={15} strokeWidth={3} />
                <span>
                  {language === 'ar' 
                    ? `تم إشعار الويتر، وسيحضر إلى طاولة ${tableNumber} فوراً!` 
                    : `Waiter notified! They will arrive at Table ${tableNumber} shortly.`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Token Error */}
          <AnimatePresence>
            {tokenError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-50 border-t border-rose-200 text-rose-700 px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-2"
              >
                <AlertCircle size={15} />
                <span>{tokenError}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ============================================================
            2. MAIN MENU FEED WITH TOUCH SWIPE (CARDS & ITEMS)
        ============================================================ */}
        <main 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 p-3.5 space-y-3 pb-32 bg-[#F8FAFC] touch-pan-y"
        >
          {menuLoading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 size={32} className="mx-auto mb-3 animate-spin text-orange-500" />
              <p className="text-sm font-bold text-slate-600">
                {language === 'ar' ? 'جاري تحميل قائمة الطعام...' : 'Loading digital menu...'}
              </p>
            </div>
          ) : menuError ? (
            <div className="py-20 text-center text-slate-400">
              <AlertCircle size={32} className="mx-auto mb-3 text-rose-400" />
              <p className="text-sm font-bold text-slate-700">
                {language === 'ar' ? menuError : 'Unable to load menu'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ar' ? 'تواصل مع إدارة المطعم' : 'Please contact restaurant staff'}
              </p>
            </div>
          ) : dbMenuItems.length === 0 ? (
            <div className="py-24 text-center px-4">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200/80 flex items-center justify-center mx-auto mb-4 text-orange-500 shadow-xs">
                <Utensils size={30} />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">
                {language === 'ar' ? 'قائمة الطعام قيد التجهيز' : 'Menu is Being Prepared'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {language === 'ar' 
                  ? 'لم تقم إدارة المطعم بإضافة وجبات بعد. سيتم تحديث القائمة فور إضافة ونشر الأصناف من لوحة التحكم.' 
                  : 'The restaurant has not added any dishes yet. The menu will update once items are published from the dashboard.'}
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Utensils size={40} className="mx-auto mb-2 opacity-30 text-orange-500" />
              <p className="text-sm font-bold text-slate-700">
                {language === 'ar' ? 'لم يتم العثور على أطباق مطابقة' : 'No matching dishes found'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ar' ? 'جرّب البحث باسم آخر أو تصفح بقية الأقسام' : 'Try searching for another dish or browse other categories'}
              </p>
            </div>
          ) : (
            filteredItems.map((item: MenuItem) => {
              const qty = cartQuantities[item.id] || 0;
              const note = itemNotes[item.id];
              const extras = selectedExtras[item.id] || [];

              return (
                <div
                  key={item.id}
                  onClick={() => openProductModal(item)}
                  className={`bg-white rounded-2xl p-3 sm:p-3.5 border transition-all flex items-center justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer relative overflow-hidden group ${
                    qty > 0 
                      ? 'border-orange-500 ring-2 ring-orange-500/15 bg-orange-50/10' 
                      : 'border-slate-200/70 hover:border-orange-200'
                  }`}
                >
                  {/* Left (RTL Right): Details & Pricing */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h3>
                      {item.popular && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Flame size={10} className="text-amber-500" /> {language === 'ar' ? 'الأكثر طلباً' : 'Popular'}
                        </span>
                      )}
                      {item.spicy && (
                        <span className="text-xs" title={language === 'ar' ? "حار وسبايسي" : "Spicy"}>🌶️</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-extrabold text-sm sm:text-base text-slate-900">{item.price}</span>
                        <span className="text-xs text-orange-600 font-bold">₪</span>
                      </div>

                      {/* Customization label if active */}
                      {(note || extras.length > 0) && (
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Edit3 size={10} />
                          <span>
                            {language === 'ar' 
                              ? `مخصص (${extras.length > 0 ? `+${extras.length}` : 'ملاحظة'})` 
                              : `Custom (${extras.length > 0 ? `+${extras.length}` : 'note'})`}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right (RTL Left): Food Image & Quick Action */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative shadow-2xs">
                      {item.imageUrl || (item.image && (item.image.startsWith('http') || item.image.startsWith('data:') || item.image.startsWith('/'))) ? (
                        <img 
                          src={item.imageUrl || item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-orange-50">
                          {item.image || '🍽️'}
                        </div>
                      )}
                    </div>

                    {/* Stepper or Add Button */}
                    {qty === 0 ? (
                      <button
                        onClick={(e) => addOne(item.id, e)}
                        className="w-full min-h-[32px] px-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <Plus size={13} strokeWidth={3} />
                        <span>{language === 'ar' ? 'أضف' : 'Add'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-orange-500 text-white p-0.5 rounded-xl shadow-xs">
                        <button
                          onClick={(e) => removeOne(item.id, e)}
                          className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="font-extrabold text-xs min-w-[18px] text-center">{qty}</span>
                        <button
                          onClick={(e) => addOne(item.id, e)}
                          className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </main>

        {/* ============================================================
            3. SLEEK FLOATING CART PILL
        ============================================================ */}
        <AnimatePresence>
          {totalCount > 0 && (
            <motion.div 
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-3 sm:inset-x-4 max-w-md mx-auto z-40"
            >
              <button
                onClick={() => setIsReviewOpen(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-3 sm:py-3.5 rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-between active:scale-98 transition-all border border-orange-400/40 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-white text-orange-600 font-black text-xs flex items-center justify-center shadow-xs">
                    {totalCount}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {language === 'ar' ? 'عرض السلة ومتابعة الطلب' : 'View Cart & Checkout'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{totalAmount} ₪</span>
                  {direction === 'rtl' ? <ArrowLeft size={16} className="text-white/80" /> : <ArrowRight size={16} className="text-white/80" />}
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            4. DETAILED PRODUCT & EXTRAS MODAL
        ============================================================ */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)} 
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="relative bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl max-h-[90vh] flex flex-col z-10 shadow-2xl overflow-hidden border-t sm:border border-slate-200"
              >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 shrink-0 sm:hidden" />

                {/* Product Image Header */}
                <div className="relative h-44 sm:h-52 w-full bg-orange-50 shrink-0 overflow-hidden">
                  {selectedProduct.imageUrl || (selectedProduct.image && (selectedProduct.image.startsWith('http') || selectedProduct.image.startsWith('data:') || selectedProduct.image.startsWith('/'))) ? (
                    <img 
                      src={selectedProduct.imageUrl || selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {selectedProduct.image || '🍽️'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <button 
                    onClick={() => setSelectedProduct(null)} 
                    className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-white/95 text-slate-700 hover:text-slate-900 flex items-center justify-center shadow-md backdrop-blur-md border border-slate-200/60 transition-transform active:scale-90"
                  >
                    <X size={16} />
                  </button>

                  <div className="absolute bottom-3.5 right-4 left-4 text-white drop-shadow-sm">
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500 text-white font-bold text-xs mb-1 shadow-xs">
                      {selectedProduct.price} ₪
                    </div>
                    <h3 className="text-xl font-bold leading-tight">{selectedProduct.name}</h3>
                    <p className="text-xs text-white/90 font-medium mt-0.5 line-clamp-2">{selectedProduct.description}</p>
                  </div>
                </div>

                {/* Modal Body: Extras & Notes */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-white">
                  {/* Extras Section */}
                  {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-orange-500" />
                        <span>{language === 'ar' ? 'إضافات مميزة حسب الرغبة' : 'Optional Add-ons & Extras'}</span>
                      </h4>
                      <div className="space-y-2">
                        {selectedProduct.extras.map((extra: Extra) => {
                          const isChecked = tempExtras.includes(extra.name);
                          return (
                            <label
                              key={extra.id}
                              onClick={() => toggleExtra(extra.name)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                isChecked 
                                  ? 'bg-orange-50/70 border-orange-500 shadow-xs' 
                                  : 'bg-white border-slate-200/80 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold transition-colors ${
                                  isChecked ? 'bg-orange-500' : 'border border-slate-300'
                                }`}>
                                  {isChecked && <Check size={12} strokeWidth={3} />}
                                </div>
                                <span className="text-xs font-bold text-slate-800">{extra.name}</span>
                              </div>
                              <span className="text-xs font-bold text-orange-600">+{extra.price} ₪</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes / Instructions */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ChefHat size={14} className="text-orange-500" />
                      <span>{language === 'ar' ? 'ملاحظات خاصة للشيف' : 'Special Kitchen Instructions'}</span>
                    </h4>

                    {/* Preset Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(language === 'ar' 
                        ? ['بدون بصل', 'بدون مخلل', 'صوص خارجي', 'حار زيادة', 'استواء كامل']
                        : ['No onions', 'No pickles', 'Sauce on side', 'Extra spicy', 'Well done']
                      ).map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setTempNote(prev => prev ? `${prev}، ${chip}` : chip)}
                          className="text-xs font-medium bg-slate-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-slate-200/60 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      placeholder={language === 'ar' ? "مثلاً: صوص حار على جنب، خبز محمص قليلاً..." : "e.g., sauce on the side, well toasted bread..."}
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-orange-500 resize-none text-slate-800"
                    />
                  </div>
                </div>

                {/* Modal Footer CTA */}
                <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <button
                    onClick={handleSaveProductModal}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                  >
                    <span>{language === 'ar' ? 'حفظ وإضافة للطلب' : 'Save & Add to Order'}</span>
                    <span>•</span>
                    <span>
                      {selectedProduct.price + tempExtras.reduce((acc, name) => {
                        const ex = selectedProduct.extras?.find(e => e.name === name);
                        return acc + (ex?.price || 0);
                      }, 0)} ₪
                    </span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============================================================
            5. ORDER REVIEW & CHECKOUT DRAWER
        ============================================================ */}
        <AnimatePresence>
          {isReviewOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsReviewOpen(false)} 
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="relative bg-white w-full max-w-md rounded-t-[2.5rem] max-h-[85vh] flex flex-col z-10 shadow-2xl overflow-hidden"
              >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <span>{language === 'ar' ? `تأكيد الطلب — طاولة ${tableNumber}` : `Review Order — Table ${tableNumber}`}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {language === 'ar' ? `${totalCount} أصناف ستصل لمطبخ المطعم فوراً` : `${totalCount} items will be sent directly to the kitchen`}
                    </p>
                  </div>
                  <button onClick={() => setIsReviewOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer">
                    <X size={16} />
                  </button>
                </div>

                {/* Items Breakdown */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50">
                  {cartItemsList.map((ci) => (
                    <div key={ci.item.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900">{ci.item.name}</p>
                        
                        {ci.extras.length > 0 && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {language === 'ar' ? 'إضافات: ' : 'Extras: '}{ci.extras.join('، ')}
                          </p>
                        )}
                        {ci.note && (
                          <p className="text-xs text-orange-600 font-medium mt-0.5">
                            {language === 'ar' ? 'ملاحظة: ' : 'Note: '}{ci.note}
                          </p>
                        )}
                        <p className="text-sm font-extrabold text-slate-900 mt-1">{ci.total} ₪</p>
                      </div>

                      {/* Stepper inside cart */}
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl">
                        <button onClick={() => removeOne(ci.item.id)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 active:scale-90 cursor-pointer">
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="font-bold text-xs px-1.5">{ci.quantity}</span>
                        <button onClick={() => addOne(ci.item.id)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 active:scale-90 cursor-pointer">
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Send Action */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  {orderError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{orderError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                    <span>{language === 'ar' ? 'المجموع النهائي:' : 'Order Total:'}</span>
                    <span className="text-lg font-black text-slate-900">{totalAmount} ₪</span>
                  </div>

                  <button
                    onClick={handleSendOrder}
                    disabled={isSubmittingOrder}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingOrder ? (
                      <span className="animate-pulse">
                        {language === 'ar' ? 'جارٍ إرسال الطلب للمطبخ... ⏳' : 'Sending order to kitchen... ⏳'}
                      </span>
                    ) : (
                      <>
                        <span>{language === 'ar' ? 'تأكيد وإرسال للمطبخ فوراً' : 'Confirm & Send to Kitchen Now'}</span>
                        {direction === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============================================================
            6. LIVE ORDER TRACKER SCREEN
        ============================================================ */}
        <AnimatePresence>
          {isOrderSubmitted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 bg-gradient-to-b from-orange-50/50 via-white to-slate-50 flex flex-col justify-between p-6 text-slate-900 text-center"
            >
              {/* Header */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{language === 'ar' ? `طاولة ${tableNumber}` : `Table ${tableNumber}`}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono font-bold">
                  {language === 'ar' ? `رقم الطلب: #${submittedOrderId}` : `Order #${submittedOrderId}`}
                </span>
              </div>

              {/* Main Body */}
              <div className="max-w-sm mx-auto my-auto space-y-6 w-full">
                <div className="w-20 h-20 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto border border-orange-200 shadow-sm">
                  <ChefHat size={40} className="animate-bounce" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1.5">
                    {language === 'ar' ? 'طلبك وصل المطبخ الآن! 🎉' : 'Your Order Arrived in the Kitchen! 🎉'}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    {language === 'ar' 
                      ? 'الشيف بدأ بتحضير أطباقك بعناية، وسيقوم الويتر بتقديمها لطاولتك فور جاهزيتها.'
                      : 'Our kitchen crew is preparing your meal with care, and staff will serve it to your table once ready.'}
                  </p>
                </div>

                {/* 3-Step Live Tracker */}
                <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check size={18} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {language === 'ar' ? '1. استلام الطلب' : '1. Order Received'}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-bold">
                        {language === 'ar' ? 'تم الاستلام بنجاح' : 'Received successfully'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                      liveOrderStatus === 'cooking' || liveOrderStatus === 'ready' || liveOrderStatus === 'completed'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      <ChefHat size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {language === 'ar' ? '2. قيد التحضير في المطبخ' : '2. Cooking in Kitchen'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {liveOrderStatus === 'cooking' 
                          ? (language === 'ar' ? 'جارٍ الشواء والتجهيز الآن 👨‍🍳' : 'Currently grilling & prepping 👨‍🍳')
                          : (language === 'ar' ? 'في قائمة الانتظار' : 'In prep queue')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                      liveOrderStatus === 'ready' || liveOrderStatus === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {language === 'ar' ? '3. جاهز للتقديم' : '3. Ready to Serve'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {liveOrderStatus === 'ready' 
                          ? (language === 'ar' ? 'الطلب جاهز على طاولتك! ✨' : 'Meal is ready at your table! ✨')
                          : (language === 'ar' ? 'خلال دقائق معدودة' : 'In a few minutes')}
                      </p>
                    </div>
                  </div>
                </div>

                {serverVerifiedTotal && (
                  <p className="text-xs font-bold text-slate-600">
                    {language === 'ar' ? 'المجموع المحسوب بالسيرفر: ' : 'Server Verified Total: '}
                    <span className="text-orange-600 font-black text-sm">{serverVerifiedTotal} ₪</span>
                  </p>
                )}
              </div>

              {/* Bottom Return Button */}
              <button
                onClick={() => setIsOrderSubmitted(false)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {language === 'ar' ? 'طلب وجبات إضافية لنفس الطاولة ➕' : 'Order More for This Table ➕'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            7. INTERACTIVE TABLE PICKER MODAL
        ============================================================ */}
        <AnimatePresence>
          {isTablePickerOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setIsTablePickerOpen(false)} 
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="relative bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl p-5 sm:p-6 z-10 shadow-2xl border-t sm:border border-slate-200 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              >
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Utensils size={16} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {language === 'ar' ? 'حدد رقم طاولتك' : 'Select Your Table'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {language === 'ar' ? 'ليصل طلبك إلى طاولتك مباشرة وبدون تأخير' : 'So your order is served directly to your table'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsTablePickerOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Quick Table Grid (1..16) */}
                <div className="my-4">
                  <p className="text-[11px] font-bold text-slate-400 mb-2">
                    {language === 'ar' ? 'طاولات سريعة:' : 'Quick Select:'}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setTableNumber(num);
                          setIsTokenVerified(true);
                          setIsTablePickerOpen(false);
                        }}
                        className={`py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                          tableNumber === num
                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30 ring-2 ring-orange-500/20'
                            : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-800 border border-slate-200/60'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Number Input */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="999"
                    placeholder={language === 'ar' ? "أو اكتب رقم طاولة أخرى..." : "Or type other table number..."}
                    value={customTableInput}
                    onChange={(e) => setCustomTableInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={() => {
                      const parsed = parseInt(customTableInput, 10);
                      if (parsed > 0) {
                        setTableNumber(parsed);
                        setIsTokenVerified(true);
                        setIsTablePickerOpen(false);
                        setCustomTableInput('');
                      }
                    }}
                    disabled={!customTableInput || parseInt(customTableInput, 10) <= 0}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'تأكيد' : 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

export default function FastFrictionlessMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700 text-xs font-bold">
        جارٍ تجهيز المنيو الذكي...
      </div>
    }>
      <FastFrictionlessMenuContent />
    </Suspense>
  );
}
