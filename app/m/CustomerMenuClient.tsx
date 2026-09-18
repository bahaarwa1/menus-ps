'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, Minus, X, Check, Search, Bell, Star, 
  Utensils, Edit3, AlertCircle, ShieldCheck, Flame, 
  Sparkles, ChefHat, ArrowLeft, ArrowRight, Loader2,
  Store, Home, Lock, MessageCircle, Share2, PhoneCall
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { 
  translateFoodName, 
  translateFoodDescription, 
  translateCategoryName, 
  translateExtraName 
} from '@/lib/smart-food-translator';

import { categories as fallbackCategories, menuItems as fallbackMenuItems } from '@/data/demo-data';

// --- Smart Food Image Helper with Appetizing Fallbacks ---
function getSmartFoodImage(item: MenuItem): string {
  if (item.imageUrl && item.imageUrl.trim() && item.imageUrl.startsWith('http')) return item.imageUrl;
  if (item.image && item.image.trim() && (item.image.startsWith('http') || item.image.startsWith('data:') || item.image.startsWith('/'))) return item.image;
  
  const name = (item.name || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  
  if (name.includes('برجر') || name.includes('burger') || cat.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('بيتزا') || name.includes('pizza') || cat.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('دجاج') || name.includes('chicken') || name.includes('مسحب') || name.includes('بسشب') || name.includes('كرسبي') || name.includes('بروستد') || name.includes('ستربس') || name.includes('شاورما') || name.includes('زنجر')) {
    return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('سلط') || name.includes('salad')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('عصير') || name.includes('مشروب') || name.includes('كولا') || name.includes('drink') || name.includes('juice') || cat.includes('drink')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('حلو') || name.includes('كيك') || name.includes('dessert') || name.includes('وافل') || name.includes('كريب')) {
    return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('مشاوي') || name.includes('لحم') || name.includes('كباب') || name.includes('steak')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('بطاطا') || name.includes('fries') || name.includes('مقبلات')) {
    return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80';
}

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

function extractSubdomainFromWindow(): string {
  if (typeof window === 'undefined') return '';
  const hostname = (window.location.hostname || '').toLowerCase().split(':')[0];
  if (hostname.endsWith('.menus.cool')) {
    const parts = hostname.slice(0, -'.menus.cool'.length).split('.');
    if (parts[0] && parts[0] !== 'www' && parts[0] !== 'menus') {
      return parts[0];
    }
  }
  if (hostname.endsWith('.menus.ps')) {
    const parts = hostname.slice(0, -'.menus.ps'.length).split('.');
    if (parts[0] && parts[0] !== 'www' && parts[0] !== 'menus') {
      return parts[0];
    }
  }
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.slice(0, -'.localhost'.length).split('.');
    if (parts[0] && parts[0] !== 'www') {
      return parts[0];
    }
  }
  return '';
}

export interface CustomerMenuClientProps {
  initialSlug?: string;
  initialSettings?: {
    id?: string;
    name?: string;
    slug?: string;
    logoUrl?: string;
    city?: string;
    address?: string;
    currency?: string;
    branchId?: string;
    branchName?: string;
    isActive?: boolean;
    phone?: string;
    whatsappNumber?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    tiktokUrl?: string;
    offersBannerUrl?: string;
    offersBannerTitle?: string;
    offersBannerSubtitle?: string;
    offersBannerActive?: boolean;
  } | null;
  initialCategories?: MenuCategory[];
  initialMenuItems?: MenuItem[];
  initialTable?: number;
  initialTokenVerified?: boolean;
  initialTokenError?: string;
  initialNotFound?: boolean;
  initialSuspended?: boolean;
  qrTokenParam?: string;
  isExplicitDemo?: boolean;
}

export default function CustomerMenuClient({
  initialSlug = '',
  initialSettings,
  initialCategories = [],
  initialMenuItems = [],
  initialTable = 0,
  initialTokenVerified = false,
  initialTokenError = '',
  initialNotFound = false,
  initialSuspended = false,
  qrTokenParam: propQrToken = '',
  isExplicitDemo: propIsExplicitDemo = false,
}: CustomerMenuClientProps) {
  const searchParams = useSearchParams();
  const qrTokenParam = propQrToken || searchParams.get('t') || searchParams.get('token') || '';
  const restaurantParam = searchParams.get('restaurant') || '';
  const tableParam = searchParams.get('table') || '';
  const defaultSlug = '';

  // Instant extraction from QR token (e.g. qr_burger-house-nablus_t2_xyz)
  const tokenSlugMatch = qrTokenParam ? qrTokenParam.match(/^qr_([a-zA-Z0-9-]+)_t\d+/) : null;
  const slugFromToken = tokenSlugMatch ? tokenSlugMatch[1] : '';
  const tokenTableMatch = qrTokenParam ? qrTokenParam.match(/_t(\d+)_/) : null;
  const tableFromToken = tokenTableMatch ? parseInt(tokenTableMatch[1], 10) : 0;
  const tableFromParam = tableParam ? parseInt(tableParam, 10) : 0;

  const windowSubdomain = typeof window !== 'undefined' ? extractSubdomainFromWindow() : '';
  const resolvedSlug = initialSlug || restaurantParam || windowSubdomain || slugFromToken || defaultSlug;
  const isExplicitDemo = propIsExplicitDemo || resolvedSlug === 'demo';
  const { direction, language } = useLanguage();

  const notFoundParam = searchParams.get('notFound') === '1';
  const [isRestaurantNotFound, setIsRestaurantNotFound] = useState<boolean>(initialNotFound || notFoundParam);
  const [isRestaurantSuspended, setIsRestaurantSuspended] = useState<boolean>(initialSuspended || false);

  const hasInitialData = initialCategories && initialCategories.length > 0;
  const fallbackCats = isExplicitDemo ? initialCategories : [];
  const fallbackItems = isExplicitDemo ? initialMenuItems : [];

  // Instant 0ms menu state pre-hydrated from Server Component (SSR)
  const [dbCategories, setDbCategories] = useState<MenuCategory[]>(hasInitialData ? initialCategories : fallbackCats);
  const [dbMenuItems, setDbMenuItems] = useState<MenuItem[]>(hasInitialData ? initialMenuItems : fallbackItems);
  const [menuLoading, setMenuLoading] = useState(!hasInitialData && !isExplicitDemo);
  const [menuError, setMenuError] = useState('');

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Table state: resolve from URL table param, QR token, or demo table 1
  const initialTableNum = initialTable || tableFromParam || tableFromToken || (isExplicitDemo ? 1 : 0);
  const [tableNumber, setTableNumber] = useState<number>(initialTableNum);
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(initialTokenVerified || initialTableNum > 0 || isExplicitDemo);
  const [tokenError, setTokenError] = useState<string>(initialTokenError || '');
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
  const [orderGeneralNote, setOrderGeneralNote] = useState('');
  const [serverVerifiedTotal, setServerVerifiedTotal] = useState<number | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [liveOrderStatus, setLiveOrderStatus] = useState<'new' | 'cooking' | 'ready' | 'completed'>('new');

  // Auto-rotating Hero Ad Banner carousel state (يتبدل تلقائياً كل 4.5 ثانية لعرض العروض وإعلان التواصل والواتساب)
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerSlide((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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
      const catList = ['all', ...dbCategories.map(c => c.id)];
      const currentIdx = catList.indexOf(activeCategory);
      if (diffX > 0 && currentIdx < catList.length - 1) {
        setActiveCategory(catList[currentIdx + 1]);
        setSearchQuery('');
      } else if (diffX < 0 && currentIdx > 0) {
        setActiveCategory(catList[currentIdx - 1]);
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

  const [activeRestaurantSlug, setActiveRestaurantSlug] = useState<string>(resolvedSlug);
  const [activeRestaurantName, setActiveRestaurantName] = useState<string>(initialSettings?.name || (isExplicitDemo ? 'Burger House نابلس' : ''));
  const [activeRestaurantLogo, setActiveRestaurantLogo] = useState<string>(initialSettings?.logoUrl || '');
  const [activeRestaurantCity, setActiveRestaurantCity] = useState<string>(initialSettings?.city || (isExplicitDemo ? 'نابلس' : ''));
  const [activeBranchId, setActiveBranchId] = useState<string>(initialSettings?.branchId || '');

  // Social media links
  const [socialWhatsapp, setSocialWhatsapp] = useState<string>(initialSettings?.whatsappNumber || initialSettings?.phone || '');
  const [socialInstagram, setSocialInstagram] = useState<string>(initialSettings?.instagramUrl || '');
  const [socialFacebook, setSocialFacebook] = useState<string>(initialSettings?.facebookUrl || '');
  const [socialTiktok, setSocialTiktok] = useState<string>(initialSettings?.tiktokUrl || '');
  const [restaurantPhone, setRestaurantPhone] = useState<string>(initialSettings?.phone || '');

  // Promotional Hero Banner
  const [offersBannerUrl, setOffersBannerUrl] = useState<string>(
    initialSettings?.offersBannerUrl || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&auto=format&fit=crop&q=80'
  );
  const [offersBannerTitle, setOffersBannerTitle] = useState<string>(
    initialSettings?.offersBannerTitle || 'عروض وخصومات اليوم 🔥'
  );
  const [offersBannerSubtitle, setOffersBannerSubtitle] = useState<string>(
    initialSettings?.offersBannerSubtitle || 'خصم 20% على الوجبات المميزة - لفترة محدودة'
  );
  const [offersBannerActive, setOffersBannerActive] = useState<boolean>(
    initialSettings?.offersBannerActive !== undefined ? initialSettings.offersBannerActive : true
  );

  // Sync with localStorage for instant 0ms updates when configured in dashboard
  useEffect(() => {
    const slugToUse = resolvedSlug || activeRestaurantSlug;
    if (!slugToUse) return;
    try {
      const savedSocial = localStorage.getItem(`restaurant_social_${slugToUse}`);
      if (savedSocial) {
        const parsed = JSON.parse(savedSocial);
        if (parsed.whatsappNumber) setSocialWhatsapp(parsed.whatsappNumber);
        if (parsed.instagramUrl) setSocialInstagram(parsed.instagramUrl);
        if (parsed.facebookUrl) setSocialFacebook(parsed.facebookUrl);
        if (parsed.tiktokUrl) setSocialTiktok(parsed.tiktokUrl);
        if (parsed.phone) setRestaurantPhone(parsed.phone);
      }
      const savedOffers = localStorage.getItem(`restaurant_offers_${slugToUse}`);
      if (savedOffers) {
        const parsed = JSON.parse(savedOffers);
        if (parsed.bannerUrl) setOffersBannerUrl(parsed.bannerUrl);
        if (parsed.title) setOffersBannerTitle(parsed.title);
        if (parsed.subtitle) setOffersBannerSubtitle(parsed.subtitle);
        if (parsed.active !== undefined) setOffersBannerActive(parsed.active);
      }
    } catch {}
  }, [resolvedSlug, activeRestaurantSlug]);

  const cleanWhatsappUrl = useMemo(() => {
    const num = (socialWhatsapp || restaurantPhone || '').replace(/\D/g, '');
    if (!num) return '';
    return `https://wa.me/${num}`;
  }, [socialWhatsapp, restaurantPhone]);

  const cleanInstagramUrl = useMemo(() => {
    if (!socialInstagram) return '';
    if (socialInstagram.startsWith('http')) return socialInstagram;
    const handle = socialInstagram.replace(/^@/, '').trim();
    return `https://instagram.com/${handle}`;
  }, [socialInstagram]);

  const cleanFacebookUrl = useMemo(() => {
    if (!socialFacebook) return '';
    if (socialFacebook.startsWith('http')) return socialFacebook;
    return `https://facebook.com/${socialFacebook.trim()}`;
  }, [socialFacebook]);

  const cleanTiktokUrl = useMemo(() => {
    if (!socialTiktok) return '';
    if (socialTiktok.startsWith('http')) return socialTiktok;
    const handle = socialTiktok.replace(/^@/, '').trim();
    return `https://tiktok.com/@${handle}`;
  }, [socialTiktok]);

  const cleanPhoneUrl = useMemo(() => {
    const p = (restaurantPhone || socialWhatsapp || '').trim();
    return p ? `tel:${p}` : '';
  }, [restaurantPhone, socialWhatsapp]);

  // Pre-formatted categories with "All" for the 2-row category grid (4 on top, 4 below)
  const categoryItems = useMemo(() => {
    const allItem = {
      id: 'all',
      name: language === 'ar' ? 'الكل' : 'All',
      icon: '🍽️',
      count: dbMenuItems.length,
    };
    const cats = dbCategories.map((cat) => ({
      id: cat.id,
      name: language === 'en' ? translateCategoryName(cat.name, 'en') : cat.name,
      icon: cat.icon || '🍴',
      count: dbMenuItems.filter((m) => m.category === cat.id).length,
    }));
    return [allItem, ...cats];
  }, [dbCategories, dbMenuItems, language]);

  // Synchronize state when SSR props update
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setDbCategories(initialCategories);
      setDbMenuItems(initialMenuItems || []);
    }
  }, [initialCategories, initialMenuItems]);

  // Authoritative DB loader: dynamically queries Supabase for settings and menu
  useEffect(() => {
    const sub = extractSubdomainFromWindow();
    const resolvedSlug = (restaurantParam || sub || slugFromToken || initialSlug || '').trim().toLowerCase();

    // Verify QR token for table if present
    if (qrTokenParam) {
      fetch(`/api/v1/tables/verify-token?token=${encodeURIComponent(qrTokenParam)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.table) {
            setTableNumber(data.table.tableNumber);
            setIsTokenVerified(true);
            setTokenError('');
            if (data.table.branchId) setActiveBranchId(data.table.branchId);
          } else {
            setTokenError(data.error || 'رمز QR غير صالح أو منتهي الصلاحية');
          }
        })
        .catch(() => {
          setTokenError('تعذر التحقق من رمز QR');
        });
    }

    if (tableFromParam > 0) {
      setTableNumber(tableFromParam);
      setIsTokenVerified(true);
    }

    // Demo mode: only when explicitly visiting demo or main site with no restaurant
    if (!resolvedSlug || resolvedSlug === 'demo') {
      setActiveRestaurantSlug('demo');
      setActiveRestaurantName('Demo Restaurant');
      setActiveRestaurantCity('');
      setDbCategories(initialCategories);
      setDbMenuItems(initialMenuItems);
      setActiveCategory(initialCategories[0]?.id || 'all');
      setMenuLoading(false);
      setIsRestaurantNotFound(false);
      return;
    }

    // Real Restaurant: Load directly with Single Request and no stale cache
    setActiveRestaurantSlug(resolvedSlug);
    setMenuError('');

    if (!hasInitialData) {
      setMenuLoading(true);
    }

    let isSubscribed = true;

    // Single Unified API Request (menu + settings in one fast roundtrip)
    fetch(`/api/v1/menu?slug=${encodeURIComponent(resolvedSlug)}&withSettings=1&fresh=1&_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store' },
    })
      .then(async (res) => {
        if (res.status === 404) {
          if (isSubscribed) {
            setIsRestaurantNotFound(true);
            setMenuLoading(false);
          }
          return;
        }
        const data = await res.json().catch(() => null);
        if (!isSubscribed || !data) return;

        if (data.settings) {
          if (data.settings.isActive === false) {
            setIsRestaurantSuspended(true);
            setMenuLoading(false);
            return;
          }
          setIsRestaurantSuspended(false);
          if (data.settings.name) setActiveRestaurantName(data.settings.name);
          if (data.settings.city) setActiveRestaurantCity(data.settings.city);
          if (data.settings.logoUrl) setActiveRestaurantLogo(data.settings.logoUrl);
          if (data.settings.branchId) setActiveBranchId(data.settings.branchId);
          if (data.settings.whatsappNumber) setSocialWhatsapp(data.settings.whatsappNumber);
          if (data.settings.instagramUrl) setSocialInstagram(data.settings.instagramUrl);
          if (data.settings.facebookUrl) setSocialFacebook(data.settings.facebookUrl);
          if (data.settings.tiktokUrl) setSocialTiktok(data.settings.tiktokUrl);
          if (data.settings.phone) setRestaurantPhone(data.settings.phone);
          if (data.settings.offersBannerUrl) setOffersBannerUrl(data.settings.offersBannerUrl);
          if (data.settings.offersBannerTitle) setOffersBannerTitle(data.settings.offersBannerTitle);
          if (data.settings.offersBannerSubtitle) setOffersBannerSubtitle(data.settings.offersBannerSubtitle);
          if (data.settings.offersBannerActive !== undefined) setOffersBannerActive(data.settings.offersBannerActive);
        }

        if (data.success && Array.isArray(data.categories)) {
          setIsRestaurantNotFound(false);
          setDbCategories(data.categories);
          const allItems: MenuItem[] = data.categories.flatMap((cat: any) =>
            (cat.items || []).map((it: any) => ({ ...it, category: cat.id }))
          );
          setDbMenuItems(allItems);
          setActiveCategory((prev) => (data.categories.some((c: any) => c.id === prev) ? prev : 'all'));
        } else if (!hasInitialData) {
          setDbCategories([]);
          setDbMenuItems([]);
          setActiveCategory('');
        }
      })
      .catch((err) => {
        console.error('Failed to load menu data:', err);
        if (isSubscribed && !hasInitialData) {
          setMenuError('تعذر تحميل بيانات المطعم من قاعدة البيانات');
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setMenuLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [restaurantParam, qrTokenParam, slugFromToken, tableFromParam]);

  // Live auto-refresh: polls every 3 seconds + refreshes instantly on tab focus/visibility
  useEffect(() => {
    const sub = extractSubdomainFromWindow();
    const resolvedSlug = (restaurantParam || sub || slugFromToken || initialSlug || '').trim().toLowerCase();
    if (!resolvedSlug || resolvedSlug === 'demo') return;

    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/v1/menu?slug=${encodeURIComponent(resolvedSlug)}&fresh=1&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.categories)) {
          setDbCategories(data.categories);
          const allItems: MenuItem[] = data.categories.flatMap((cat: any) =>
            (cat.items || []).map((it: any) => ({ ...it, category: cat.id }))
          );
          setDbMenuItems(allItems);
        }
      } catch {}
    };

    const handleFocus = () => fetchLatest();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchLatest();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = setInterval(fetchLatest, 3000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [restaurantParam, slugFromToken, initialSlug]);

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
    return dbMenuItems.filter(item => {
      const selectedCat = dbCategories.find(c => c.id === activeCategory);
      const matchCat = searchQuery || activeCategory === 'all' || !activeCategory
        ? true
        : (item.category === activeCategory || (selectedCat && item.category === selectedCat.name));
      const matchSearch = !searchQuery || 
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
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
          customerNote: orderGeneralNote.trim() || undefined,
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
      setOrderGeneralNote('');
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

  if (isRestaurantSuspended) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center px-4 py-12 text-white font-sans antialiased" dir="rtl">
        <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/60 rounded-3xl shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400">
            <AlertCircle size={40} className="stroke-[1.5]" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-400 border border-rose-500/25 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            المطعم متوقف مؤقتاً
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white mb-3 leading-tight">
            عذراً، هذا المطعم متوقف
          </h1>
          <p className="text-sm text-slate-400 mb-5 leading-relaxed">
            تم إيقاف هذا المطعم مؤقتاً من قِبل الإدارة. يرجى التواصل مع إدارة المطعم للاستفسار عن إعادة الخدمة.
          </p>
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 mb-6 text-right">
            <p className="text-[11px] text-slate-500 font-bold mb-1">رابط المطعم</p>
            <p className="text-sm font-mono text-amber-400 font-bold">{activeRestaurantSlug}.menus.cool</p>
          </div>
          <a
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home size={16} />
            <span>العودة للصفحة الرئيسية</span>
          </a>
        </div>
      </div>
    );
  }

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
              href="https://burger-house-nablus.menus.cool"
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
              {/* Table Badge / Locked Indicator */}
              {tableNumber > 0 ? (
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs select-none"
                  title={language === 'ar' ? 'رقم الطاولة موثق ومقفل' : 'Table number verified and locked'}
                >
                  <Lock size={11} className="text-amber-700" />
                  <span className="text-[10px] text-amber-700 font-bold">{language === 'ar' ? 'طاولة' : 'T.'}</span>
                  <span className="text-xs font-black text-amber-950">{tableNumber}</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsTablePickerOpen(true)}
                  className="px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white shadow-xs animate-pulse cursor-pointer"
                  title={language === 'ar' ? 'حدد رقم طاولتك' : 'Set table'}
                >
                  <Utensils size={11} />
                  <span>{language === 'ar' ? 'حدد الطاولة' : 'Set Table'}</span>
                </button>
              )}

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

          {/* Categories 2-Row Grid (التصنيفات سطرين: 4 بالأعلى و4 بالأسفل) */}
          {categoryItems.length > 0 ? (
            <div className="px-2.5 sm:px-3 py-2 bg-white/95 border-t border-slate-100">
              <div 
                className={
                  categoryItems.length <= 8
                    ? "grid grid-cols-4 gap-1.5 sm:gap-2"
                    : "grid grid-rows-2 grid-flow-col auto-cols-[calc((100%-18px)/4)] gap-1.5 overflow-x-auto hide-scrollbar pb-0.5"
                }
              >
                {categoryItems.map((cat) => {
                  const isActive = (activeCategory === cat.id || (cat.id === 'all' && (!activeCategory || activeCategory === 'all'))) && !searchQuery;
                  return (
                    <button
                      key={cat.id}
                      id={`cat-btn-${cat.id}`}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSearchQuery('');
                      }}
                      className={`h-9 sm:h-10 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer min-w-0 ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs shadow-orange-500/25 ring-2 ring-orange-500/20'
                          : 'bg-slate-100/90 text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60'
                      }`}
                      title={cat.name}
                    >
                      <span className="text-sm shrink-0">{cat.icon}</span>
                      <span className="truncate max-w-[55px] sm:max-w-[70px] leading-tight text-center">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : menuLoading ? (
            <div className="px-3 py-2 bg-white/95 border-t border-slate-100 grid grid-cols-4 gap-1.5 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-9 rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : null}

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
            <div className="space-y-3 animate-pulse pt-1">
              <div className="flex items-center justify-between px-1">
                <div className="h-4 w-28 bg-slate-200 rounded-md" />
                <div className="h-3 w-16 bg-slate-100 rounded-md" />
              </div>
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex gap-3 shadow-xs items-center justify-between"
                >
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-4 w-32 bg-slate-200 rounded-md" />
                    <div className="h-3 w-48 bg-slate-100 rounded-md" />
                    <div className="h-4 w-16 bg-orange-100 rounded-md mt-1" />
                  </div>
                  <div className="w-20 h-20 bg-slate-100 rounded-xl shrink-0 border border-slate-100 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-slate-200/60" />
                  </div>
                </div>
              ))}
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
            <div className="space-y-4">
              {/* 1. Large Auto-Rotating Hero Ad Banner (صورة كبيرة وعروض ترويجية وإعلان تواصل وسوشال ميديا يتبدل تلقائياً) */}
              {!searchQuery && (
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 aspect-[16/9] sm:aspect-[21/9] bg-slate-950 group select-none">
                  <AnimatePresence mode="wait">
                    {currentBannerSlide === 0 && (
                      <motion.div
                        key="banner-slide-0"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={offersBannerUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80'} 
                          alt="Special Offers" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-3.5 sm:p-4">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                              <Sparkles size={11} />
                              <span>{language === 'ar' ? 'عرض حصري' : 'Special Deal'}</span>
                            </span>
                            <span className="bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/30">
                              🔥 {language === 'ar' ? 'لفترة محدودة' : 'Limited Offer'}
                            </span>
                          </div>
                          <h2 className="text-white font-black text-sm sm:text-base leading-tight mb-0.5 drop-shadow-md">
                            {offersBannerTitle 
                              ? (language === 'en' ? translateFoodName(offersBannerTitle, 'en') : offersBannerTitle) 
                              : (language === 'ar' ? 'عروض وتوفير على أشهى وجبات اليوم' : 'Special Deals & Daily Offers')}
                          </h2>
                          <p className="text-slate-200 text-[10px] sm:text-xs font-medium line-clamp-1 drop-shadow-sm">
                            {offersBannerSubtitle 
                              ? (language === 'en' ? translateFoodDescription(offersBannerSubtitle, 'en') : offersBannerSubtitle) 
                              : (language === 'ar' ? 'اطلب وجبتك المفضلة فوراً واستمتع بأشهى النكهات الطازجة' : 'Order your favorites now and enjoy fresh delicious flavors')}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {currentBannerSlide === 1 && (
                      <motion.div
                        key="banner-slide-1"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80" 
                          alt="Social Media and WhatsApp Contact Ad" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/55 backdrop-blur-2xs flex flex-col justify-end p-3 sm:p-4">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                              <MessageCircle size={11} className="fill-white" />
                              <span>{language === 'ar' ? 'إعلان التواصل والطلبات' : 'Direct Orders & Connect'}</span>
                            </span>
                            <span className="bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/30">
                              📢 {language === 'ar' ? 'خدمة فورية' : 'Instant Reply'}
                            </span>
                          </div>

                          <h2 className="text-white font-black text-sm sm:text-base leading-tight mb-0.5 drop-shadow-md">
                            {language === 'ar' ? 'تابعنا على مواقع التواصل واطلب عبر واتساب' : 'Follow Us on Social & Order via WhatsApp'}
                          </h2>
                          <p className="text-slate-300 text-[10px] sm:text-xs font-medium line-clamp-1 mb-2">
                            {language === 'ar' ? 'استفسارات، عروض يومية، واستقبال طلباتكم مباشرة' : 'Inquiries, daily deals, and direct orders on official channels'}
                          </p>

                          {/* Direct Clickable Action Badges embedded inside the Ad Banner */}
                          <div className="flex items-center gap-1.5 flex-wrap z-10">
                            {(cleanWhatsappUrl || restaurantPhone) && (
                              <a
                                href={cleanWhatsappUrl || `https://wa.me/?text=${encodeURIComponent(activeRestaurantName || 'Menus.ps')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-md shadow-emerald-950/50 transition-all border border-emerald-400/30 shrink-0"
                                title="WhatsApp"
                              >
                                <MessageCircle size={12} className="fill-white" />
                                <span>{language === 'ar' ? 'واتساب للطلب' : 'WhatsApp'}</span>
                              </a>
                            )}

                            {(cleanInstagramUrl || isExplicitDemo) && (
                              <a
                                href={cleanInstagramUrl || 'https://instagram.com'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 active:scale-95 text-white text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-md shadow-pink-950/50 transition-all border border-pink-400/30 shrink-0"
                                title="Instagram"
                              >
                                <span className="text-[11px]">📸</span>
                                <span>{language === 'ar' ? 'إنستغرام' : 'Instagram'}</span>
                              </a>
                            )}

                            {(cleanFacebookUrl || isExplicitDemo) && (
                              <a
                                href={cleanFacebookUrl || 'https://facebook.com'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 active:scale-95 text-white text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-md shadow-blue-950/50 transition-all border border-blue-400/30 shrink-0"
                                title="Facebook"
                              >
                                <span className="text-[11px]">📘</span>
                                <span>{language === 'ar' ? 'فيسبوك' : 'Facebook'}</span>
                              </a>
                            )}

                            {(cleanTiktokUrl || isExplicitDemo) && (
                              <a
                                href={cleanTiktokUrl || 'https://tiktok.com'}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-black/90 hover:bg-black active:scale-95 text-white text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-md border border-white/20 transition-all shrink-0"
                                title="TikTok"
                              >
                                <span className="text-[11px]">🎵</span>
                                <span>{language === 'ar' ? 'تيك توك' : 'TikTok'}</span>
                              </a>
                            )}

                            {(cleanPhoneUrl || restaurantPhone) && (
                              <a
                                href={cleanPhoneUrl || `tel:${restaurantPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-md shadow-amber-950/50 transition-all border border-amber-400/30 shrink-0"
                                title="Call"
                              >
                                <PhoneCall size={11} />
                                <span>{language === 'ar' ? 'اتصال مباشر' : 'Call'}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentBannerSlide === 2 && (
                      <motion.div
                        key="banner-slide-2"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80" 
                          alt="Fresh Ingredients Ad" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-3.5 sm:p-4">
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                              <ChefHat size={11} />
                              <span>{language === 'ar' ? 'شيف المطعم' : "Chef's Touch"}</span>
                            </span>
                            <span className="bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/30">
                              ⭐ {language === 'ar' ? 'طازج ١٠٠٪ يومياً' : '100% Fresh Daily'}
                            </span>
                          </div>
                          <h2 className="text-white font-black text-sm sm:text-base leading-tight mb-0.5 drop-shadow-md">
                            {language === 'ar' ? 'لحوم طازجة ١٠٠٪ ومكونات منتقاة بعناية' : '100% Fresh Meats & Artisan Quality'}
                          </h2>
                          <p className="text-slate-200 text-[10px] sm:text-xs font-medium line-clamp-1 drop-shadow-sm">
                            {language === 'ar' ? 'نحضر وجبتك فور طلبها لنضمن لك أشهى مذاق وجودة تليق بذوقك' : 'Cooked to perfection upon order for highest satisfaction'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Carousel Slide Indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full border border-white/10">
                    {[0, 1, 2].map((idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentBannerSlide(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          currentBannerSlide === idx ? 'w-5 bg-orange-500 shadow-xs' : 'w-1.5 bg-white/60 hover:bg-white'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Side Navigation Arrows */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerSlide((prev) => (prev - 1 + 3) % 3);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-all z-20 cursor-pointer active:scale-90"
                    aria-label="Previous Slide"
                  >
                    <ArrowLeft size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerSlide((prev) => (prev + 1) % 3);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-all z-20 cursor-pointer active:scale-90"
                    aria-label="Next Slide"
                  >
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}

              {/* 3. All Menu Items in Modern 2-Column Grid (وتحتهن الباقي بشبكة ثنائية أنيقة) */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Utensils size={14} className="text-orange-500" />
                    <span>
                      {searchQuery 
                        ? (language === 'ar' ? `نتائج البحث عن "${searchQuery}"` : `Search results for "${searchQuery}"`)
                        : activeCategory === 'all'
                          ? (language === 'ar' ? 'جميع أطباق القائمة' : 'All Menu Dishes')
                          : (language === 'en' ? translateCategoryName(dbCategories.find(c => c.id === activeCategory)?.name || '', 'en') : (dbCategories.find(c => c.id === activeCategory)?.name || 'الأصناف'))}
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                    {filteredItems.length} {language === 'ar' ? 'أصناف' : 'dishes'}
                  </span>
                </div>

                {/* 2-Column Food Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {filteredItems.map((item: MenuItem) => {
                    const qty = cartQuantities[item.id] || 0;
                    const note = itemNotes[item.id];
                    const extras = selectedExtras[item.id] || [];
                    const foodImg = getSmartFoodImage(item);
                    const translatedTitle = language === 'en' ? translateFoodName(item.name, 'en') : item.name;
                    const translatedDesc = language === 'en' ? translateFoodDescription(item.description, 'en') : item.description;

                    return (
                      <div
                        key={item.id}
                        onClick={() => openProductModal(item)}
                        className={`bg-white rounded-2xl p-2.5 sm:p-3 border transition-all flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer relative group ${
                          qty > 0 
                            ? 'border-orange-500 ring-2 ring-orange-500/15 bg-orange-50/10' 
                            : 'border-slate-200/80 hover:border-orange-200'
                        }`}
                      >
                        {/* Top Photo */}
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-2 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={foodImg}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end">
                            {item.popular && (
                              <span className="bg-black/60 backdrop-blur-xs text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-300/30">
                                <Flame size={9} className="text-orange-400 fill-orange-400" />
                                <span>{language === 'ar' ? 'الأكثر طلباً' : 'Popular'}</span>
                              </span>
                            )}
                            {item.spicy && (
                              <span className="bg-red-950/70 backdrop-blur-xs text-rose-300 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-red-500/30">
                                🌶️ {language === 'ar' ? 'حار' : 'Spicy'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug group-hover:text-orange-600 transition-colors mb-1 line-clamp-1">
                            {translatedTitle}
                          </h4>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed mb-2">
                            {translatedDesc}
                          </p>

                          {/* Customization label if active */}
                          {(note || extras.length > 0) && (
                            <div className="mb-2">
                              <span className="text-[9px] font-bold text-orange-700 bg-orange-50 border border-orange-200/80 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                                <Edit3 size={8} />
                                <span>
                                  {language === 'ar' 
                                    ? `مخصص (${extras.length > 0 ? `+${extras.length}` : 'ملاحظة'})` 
                                    : `Custom (${extras.length > 0 ? `+${extras.length}` : 'note'})`}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom: Price + Stepper or Add Button */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                          <div className="flex items-baseline gap-0.5">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900">{item.price}</span>
                            <span className="text-[10px] text-orange-600 font-bold">₪</span>
                          </div>

                          {qty === 0 ? (
                            <button
                              onClick={(e) => addOne(item.id, e)}
                              className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                            >
                              <Plus size={11} strokeWidth={3} />
                              <span>{language === 'ar' ? 'أضف' : 'Add'}</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-orange-500 text-white px-1 py-0.5 rounded-lg shadow-2xs">
                              <button
                                onClick={(e) => removeOne(item.id, e)}
                                className="w-5 h-5 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center active:scale-90 cursor-pointer"
                              >
                                <Minus size={10} strokeWidth={3} />
                              </button>
                              <span className="font-bold text-[10px] sm:text-xs min-w-[14px] text-center">{qty}</span>
                              <button
                                onClick={(e) => addOne(item.id, e)}
                                className="w-5 h-5 bg-white/20 hover:bg-white/30 rounded flex items-center justify-center active:scale-90 cursor-pointer"
                              >
                                <Plus size={10} strokeWidth={3} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={getSmartFoodImage(selectedProduct)} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  
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
                    <h3 className="text-xl font-bold leading-tight">
                      {language === 'en' ? translateFoodName(selectedProduct.name, 'en') : selectedProduct.name}
                    </h3>
                    <p className="text-xs text-white/90 font-medium mt-0.5 line-clamp-2">
                      {language === 'en' ? translateFoodDescription(selectedProduct.description, 'en') : selectedProduct.description}
                    </p>
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
                                <span className="text-xs font-bold text-slate-800">
                                  {language === 'en' ? translateExtraName(extra.name, 'en') : extra.name}
                                </span>
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
                        <p className="font-bold text-sm text-slate-900">
                          {language === 'en' ? translateFoodName(ci.item.name, 'en') : ci.item.name}
                        </p>
                        
                        {ci.extras.length > 0 && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {language === 'ar' ? 'إضافات: ' : 'Extras: '}
                            {ci.extras.map(e => language === 'en' ? translateExtraName(e, 'en') : e).join('، ')}
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

                {/* General Order Notes Input */}
                <div className="px-4 pt-3 pb-1 bg-white shrink-0 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <span>📝</span>
                      <span>{language === 'ar' ? 'ملاحظة عامة على الطلب (اختياري)' : 'Order notes / instructions (optional)'}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'مثلاً: يرجى الاستعجال، بدون كاتشب...' : 'e.g., extra napkins, please hurry...'}
                      value={orderGeneralNote}
                      onChange={(e) => setOrderGeneralNote(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-orange-500 text-slate-800"
                    />
                  </div>
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
