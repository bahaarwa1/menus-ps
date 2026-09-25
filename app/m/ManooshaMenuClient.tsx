'use client';

import React, { useState, useMemo, useEffect } from 'react';
import './sh-manoosha.css';
import { MANOOSHA_CATEGORIES, MANOOSHA_DISHES, MANOOSHA_INFO } from '@/data/sh-manoosha-data';
import GpsVerificationModal, { GpsStatus } from '@/components/common/GpsVerificationModal';
import { verifyCustomerLocation, Coordinates, DEFAULT_RESTAURANT_COORDINATES } from '@/lib/geo/geofence';

export interface GpsConfig {
  requireGps: boolean;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface ManooshaMenuClientProps {
  initialTable?: number;
  qrTokenParam?: string;
  initialGpsConfig?: GpsConfig;
}

export default function ManooshaMenuClient({ 
  initialTable = 5, 
  qrTokenParam = '',
  initialGpsConfig
}: ManooshaMenuClientProps) {
  const [gpsConfig, setGpsConfig] = useState<GpsConfig>(initialGpsConfig || {
    requireGps: true,
    latitude: DEFAULT_RESTAURANT_COORDINATES.latitude,
    longitude: DEFAULT_RESTAURANT_COORDINATES.longitude,
    radiusMeters: DEFAULT_RESTAURANT_COORDINATES.radiusMeters,
  });

  // Client-side live sync of restaurant GPS settings from API
  useEffect(() => {
    fetch(`/api/v1/restaurant/settings?slug=sh-manoosha&_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setGpsConfig({
            requireGps: data.settings.requireGps !== false,
            latitude: typeof data.settings.gpsLatitude === 'number' ? data.settings.gpsLatitude : DEFAULT_RESTAURANT_COORDINATES.latitude,
            longitude: typeof data.settings.gpsLongitude === 'number' ? data.settings.gpsLongitude : DEFAULT_RESTAURANT_COORDINATES.longitude,
            radiusMeters: typeof data.settings.gpsRadiusMeters === 'number' ? data.settings.gpsRadiusMeters : DEFAULT_RESTAURANT_COORDINATES.radiusMeters,
          });
        }
      })
      .catch(() => {});
  }, []);

  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [activeCategory, setActiveCategory] = useState<string>('manaqeesh');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<number>(initialTable || 5);
  
  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [inputTableVal, setInputTableVal] = useState<string>(String(initialTable || 5));

  // GPS Geofence States
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [distanceMeters, setDistanceMeters] = useState<number | undefined>();
  const [gpsErrorMessage, setGpsErrorMessage] = useState('');
  const [clientCoords, setClientCoords] = useState<Coordinates | null>(null);
  
  // Customization / Dish Modal
  const [activeDish, setActiveDish] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [modalNote, setModalNote] = useState<string>('');

  // Cart: { [cartKey]: { key, dish, size, price, qty, note } }
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  const [orderGeneralNote, setOrderGeneralNote] = useState<string>('');
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2800);
  };

  // Prevent text selection and copying across menu
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Sync table if prop changes or URL changes
  useEffect(() => {
    if (initialTable && initialTable > 0) {
      setTableNumber(initialTable);
      setInputTableVal(String(initialTable));
    }
  }, [initialTable]);

  // Dishes filtered by search or category
  const filteredDishes = useMemo(() => {
    let list = MANOOSHA_DISHES;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(
        (d: any) =>
          (d.name && d.name.toLowerCase().includes(q)) ||
          (d.nameEn && d.nameEn.toLowerCase().includes(q)) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }
    if (activeCategory === 'all') return list;
    return list.filter((d: any) => d.category === activeCategory);
  }, [searchQuery, activeCategory]);

  // Cart calculations
  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(() => cartItems.reduce((acc, it) => acc + it.qty, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((acc, it) => acc + it.price * it.qty, 0), [cartItems]);

  const getDishCartQty = (dishId: string) => {
    return cartItems.filter((it) => it.dish.id === dishId).reduce((acc, it) => acc + it.qty, 0);
  };

  const handleOpenDishModal = (dish: any) => {
    setActiveDish(dish);
    setSelectedSize(dish.sizes && dish.sizes.length > 0 ? dish.sizes[0] : null);
    setModalQty(1);
    setModalNote('');
  };

  const handleQuickAdd = (e: React.MouseEvent, dish: any) => {
    e.stopPropagation();
    if (dish.sizes && dish.sizes.length > 1) {
      handleOpenDishModal(dish);
      return;
    }
    const size = dish.sizes && dish.sizes.length === 1 ? dish.sizes[0] : null;
    const price = size ? size.price : dish.price;
    const key = `${dish.id}_default`;

    setCart((prev) => {
      const existing = prev[key];
      const newQty = existing ? existing.qty + 1 : 1;
      return {
        ...prev,
        [key]: {
          key,
          dish,
          size,
          price,
          qty: newQty,
          note: '',
        },
      };
    });

    showToast(lang === 'ar' ? `تمت إضافة "${dish.name}" إلى الطلب` : `Added "${dish.nameEn || dish.name}" to order`);
  };

  const confirmModalAdd = () => {
    if (!activeDish) return;
    const price = selectedSize ? selectedSize.price : activeDish.price;
    const sizeKey = selectedSize ? selectedSize.name : 'default';
    const key = `${activeDish.id}_${sizeKey}_${modalNote.trim()}`;

    setCart((prev) => {
      const existing = prev[key];
      const newQty = existing ? existing.qty + modalQty : modalQty;
      return {
        ...prev,
        [key]: {
          key,
          dish: activeDish,
          size: selectedSize,
          price,
          qty: newQty,
          note: modalNote.trim(),
        },
      };
    });

    showToast(lang === 'ar' ? `تمت إضافة "${activeDish.name}"` : `Added "${activeDish.nameEn || activeDish.name}"`);
    setActiveDish(null);
  };

  const updateCartItemQty = (key: string, delta: number) => {
    setCart((prev) => {
      const item = prev[key];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: { ...item, qty: newQty },
      };
    });
  };

  // Step 1: Initiate GPS Geofence Verification before placing order
  const handleInitiateOrderWithGps = async () => {
    if (cartItems.length === 0) return;

    setGpsModalOpen(true);
    setGpsStatus('checking');
    setGpsErrorMessage('');

    // Fetch latest fresh GPS coordinates & toggle from server
    let currentConfig = gpsConfig;
    try {
      const res = await fetch(`/api/v1/restaurant/settings?slug=sh-manoosha&_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.settings) {
        currentConfig = {
          requireGps: data.settings.requireGps !== false,
          latitude: typeof data.settings.gpsLatitude === 'number' ? data.settings.gpsLatitude : gpsConfig.latitude,
          longitude: typeof data.settings.gpsLongitude === 'number' ? data.settings.gpsLongitude : gpsConfig.longitude,
          radiusMeters: typeof data.settings.gpsRadiusMeters === 'number' ? data.settings.gpsRadiusMeters : gpsConfig.radiusMeters,
        };
        setGpsConfig(currentConfig);
      }
    } catch {}

    // If restaurant has disabled GPS geofencing in settings, submit directly!
    if (!currentConfig.requireGps) {
      setGpsModalOpen(false);
      executeSubmitOrder();
      return;
    }

    // If customer already verified GPS during this session, proceed directly
    if (clientCoords) {
      setGpsModalOpen(false);
      executeSubmitOrder(clientCoords);
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMessage('المتصفح لا يدعم خدمة تحديد الموقع (GPS). يرجى طلب مساعدة الويتر لتأكيد الطلب.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };

        const result = verifyCustomerLocation(coords, {
          name: 'مطعم وكافيه شيشة ومنقوشة',
          latitude: currentConfig.latitude,
          longitude: currentConfig.longitude,
          radiusMeters: currentConfig.radiusMeters,
        });
        setDistanceMeters(result.distanceMeters);

        setClientCoords(coords);

        if (result.isWithin) {
          setGpsStatus('success');
          setTimeout(() => {
            setGpsModalOpen(false);
            executeSubmitOrder(coords);
          }, 1100);
        } else {
          setGpsStatus('too_far');
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        if (err.code === 1) { // PERMISSION_DENIED
          setGpsStatus('permission_denied');
        } else {
          setGpsStatus('error');
          setGpsErrorMessage('تعذر التقاط إشارة الـ GPS بدقة. تأكد من تفعيل الموقع في هاتفك ثم أعد المحاولة.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Safe simulation for authorized testing/preview
  const handleSimulateInside = () => {
    const fakeCoords: Coordinates = {
      latitude: gpsConfig.latitude,
      longitude: gpsConfig.longitude,
      accuracy: 5,
    };
    setClientCoords(fakeCoords);
    setDistanceMeters(6);
    setGpsStatus('success');
    setTimeout(() => {
      setGpsModalOpen(false);
      executeSubmitOrder(fakeCoords, true);
    }, 900);
  };

  // Step 2: Submit Order directly to Server / KDS with verified GPS coordinates
  const executeSubmitOrder = async (coords?: Coordinates, simulated: boolean = false) => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);

    try {
      // Prepare payload formatted for /api/v1/orders/submit
      const formattedItems = cartItems.map((it) => ({
        itemId: it.dish.id,
        id: it.dish.id,
        itemName: it.dish.name,
        name: it.dish.name,
        price: it.price,
        quantity: it.qty,
        imageUrl: it.dish.image || undefined,
        image: it.dish.image || undefined,
        selectedExtras: it.size ? [{ id: it.size.name, name: it.size.name, price: it.size.price }] : [],
        customerNotes: it.note || undefined,
        note: it.note || undefined,
      }));

      const activeCoords = coords || clientCoords;

      const payload = {
        restaurantSlug: 'sh-manoosha',
        branchId: 'a84f5ec9-714f-44fe-980d-82a78eb4f9b9',
        tableNumber: Number(tableNumber) || 5,
        tableToken: qrTokenParam || undefined,
        items: formattedItems,
        customerNote: orderGeneralNote.trim() || undefined,
        clientCoordinates: activeCoords ? {
          latitude: activeCoords.latitude,
          longitude: activeCoords.longitude,
          accuracy: activeCoords.accuracy,
          simulated,
        } : undefined,
      };

      const res = await fetch('/api/v1/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsCartOpen(false);
        setOrderSuccess({
          orderId: data.orderNumber || data.orderId || `#${Date.now().toString().slice(-4)}`,
          table: tableNumber,
          total: data.totalAmount || cartTotal,
          itemsCount: cartCount,
        });
        setCart({});
        setOrderGeneralNote('');
      } else {
        showToast(data.error || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم، يرجى التحقق من الاتصال بالإنترنت');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWaiterCall = (reason: string) => {
    setIsWaiterModalOpen(false);
    showToast(
      lang === 'ar'
        ? `تم نداء الويتر لطاولة #${tableNumber} (${reason})`
        : `Waiter called for Table #${tableNumber} (${reason})`
    );
  };

  return (
    <div className="sh-manoosha-body" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="app-container">
        
        {/* 1. Top Header */}
        <header className="top-header">
          <div className="brand-section">
            <div className="brand-logo-wrap">
              <img src="/sh-manoosha/logo.png" alt="شيشة ومنقوشة" className="brand-logo-img" />
            </div>
            <div className="brand-info">
              <h1 className="brand-title">
                <span className="brand-name-text">{lang === 'ar' ? MANOOSHA_INFO.name : MANOOSHA_INFO.nameEn}</span>
                <span className="status-dot-inline" title={lang === 'ar' ? 'في خدمتكم' : 'Open'}></span>
              </h1>
              <p className="brand-subtitle">
                {lang === 'ar' ? 'مطعم وكافيه • خدمة الطاولة' : 'Restaurant & Cafe • Dine-In'}
              </p>
            </div>
          </div>

          <div className="header-actions">
            {/* Table Badge (Fixed - Customer cannot change table) */}
            <div className="action-btn btn-table btn-table-locked" title={lang === 'ar' ? `طاولة رقم ${tableNumber}` : `Table #${tableNumber}`}>
              <span>🪑</span>
              <span className="table-badge-text">{lang === 'ar' ? 'طاولة' : 'Table'}</span>
              <span className="table-number-label">{tableNumber}</span>
            </div>

            {/* Waiter bell */}
            <button className="action-btn btn-bell" onClick={() => setIsWaiterModalOpen(true)} title="نداء الويتر">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>

            {/* Language Switcher */}
            <button className="action-btn btn-lang" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} title="تبديل اللغة">
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
          </div>
        </header>

        {/* 2. Ambient Photo Banner */}
        <section className="clean-hero-banner">
          <img src="/sh-manoosha/cover.jpg" alt="أجواء شيشة ومنقوشة" className="hero-cover-img" />
          <div className="hero-gradient-overlay">
            <div className="hero-text-wrap">
              <span className="hero-tag">
                {lang === 'ar' ? '⭐ نكهة بتجمعنا.. منذ ١٩٤٨' : '⭐ Taste That Unites Us • Est. 1948'}
              </span>
              <h2 className="hero-title">
                {lang === 'ar' ? 'مطعم وكافيه شيشة ومنقوشة' : 'Sh&Manoosha Restaurant & Cafe'}
              </h2>
              <p className="hero-sub">
                {lang === 'ar' ? 'صالة الضيافة • خدمة الطاولة المباشرة' : 'Dine-In • Direct Table Service'}
              </p>
            </div>
          </div>
        </section>

        {/* 3. Sticky Search & Categories Horizontal Scroller */}
        <div className="sticky-nav-section">
          {/* Search Box */}
          <div className="search-box">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن منقوشة، حمص، فطور، مشاوي، شيشة، أو عصير...' : 'Search manakish, grills, breakfast, drinks...'}
            />
            {searchQuery && (
              <button className="search-clear visible" onClick={() => setSearchQuery('')} title="مسح">✕</button>
            )}
          </div>

          {/* Categories Scroller */}
          <div className="categories-wrapper hide-scrollbar">
            {MANOOSHA_CATEGORIES.map((cat) => {
              const count = cat.id === 'all'
                ? MANOOSHA_DISHES.length
                : MANOOSHA_DISHES.filter((d: any) => d.category === cat.id).length;
              const isActive = activeCategory === cat.id && !searchQuery;
              return (
                <button
                  key={cat.id}
                  className={`category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                  }}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span>{lang === 'ar' ? cat.name : cat.nameEn}</span>
                  <span className="cat-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Menu Dishes Grid */}
        <main className="menu-main-content">
          <div className="section-title-wrap">
            <h3 className="section-heading">
              <span className="section-heading-icon">
                {searchQuery ? '🔍' : MANOOSHA_CATEGORIES.find((c) => c.id === activeCategory)?.icon || '🍽️'}
              </span>
              <span>
                {searchQuery
                  ? lang === 'ar' ? `نتائج البحث عن: "${searchQuery}"` : `Search: "${searchQuery}"`
                  : activeCategory === 'all'
                  ? lang === 'ar' ? 'جميع أصناف القائمة' : 'All Menu Dishes'
                  : lang === 'ar'
                  ? MANOOSHA_CATEGORIES.find((c) => c.id === activeCategory)?.name
                  : MANOOSHA_CATEGORIES.find((c) => c.id === activeCategory)?.nameEn}
              </span>
            </h3>
            <span className="items-count-badge">
              {filteredDishes.length} {lang === 'ar' ? 'صنف' : 'items'}
            </span>
          </div>

          {/* 2-Column Responsive Grid */}
          <div className="dishes-grid">
            {filteredDishes.map((dish: any) => {
              const cartQty = getDishCartQty(dish.id);
              return (
                <div
                  key={dish.id}
                  className="dish-card"
                  onClick={() => handleOpenDishModal(dish)}
                >
                  <div className="dish-img-wrap">
                    <img
                      src={dish.image || '/sh-manoosha/logo.png'}
                      alt={dish.name}
                      className="dish-img"
                      loading="lazy"
                    />
                    {dish.badge && (
                      <span className="dish-badge-top">{dish.badge}</span>
                    )}
                    {cartQty > 0 && (
                      <span className="dish-cart-badge">{cartQty}</span>
                    )}
                  </div>

                  <div className="dish-body">
                    <h4 className="dish-title">{lang === 'ar' ? dish.name : (dish.nameEn || dish.name)}</h4>
                    <p className="dish-desc">{lang === 'ar' ? dish.description : (dish.descriptionEn || dish.description)}</p>

                    <div className="dish-footer" onClick={(e) => e.stopPropagation()}>
                      <div className="dish-price">
                        {dish.sizes && dish.sizes.length > 1 && (
                          <span style={{ fontSize: '10px', color: 'var(--stone-600)', marginInlineEnd: '2px' }}>
                            {lang === 'ar' ? 'من' : 'From'}
                          </span>
                        )}
                        <span>{dish.sizes && dish.sizes.length > 0 ? dish.sizes[0].price : dish.price}</span>
                        <span className="currency">{lang === 'ar' ? '₪' : 'ILS'}</span>
                      </div>

                      <div className="dish-action-box">
                        {cartQty === 0 || (dish.sizes && dish.sizes.length > 1) ? (
                          <button
                            className={`btn-add-circle ${cartQty > 0 ? 'active-in-cart' : ''}`}
                            onClick={(e) => handleQuickAdd(e, dish)}
                            title={lang === 'ar' ? 'إضافة للطلب' : 'Add to order'}
                          >
                            {cartQty > 0 ? (
                              <span style={{ fontSize: '11px', fontWeight: 900 }}>{cartQty}✓</span>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            )}
                          </button>
                        ) : (
                          <div className="dish-qty-stepper">
                            <button className="btn-step" onClick={() => updateCartItemQty(`${dish.id}_default`, -1)}>−</button>
                            <span className="step-num">{cartQty}</span>
                            <button className="btn-step" onClick={() => updateCartItemQty(`${dish.id}_default`, 1)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDishes.length === 0 && (
            <div className="empty-state">
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3>{lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No dishes found'}</h3>
              <p>{lang === 'ar' ? 'جرّب البحث باسم آخر أو تصفح باقي الأقسام' : 'Try searching for another dish or browse categories'}</p>
              <button className="empty-reset-btn" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
                {lang === 'ar' ? 'عرض جميع الأصناف' : 'View all dishes'}
              </button>
            </div>
          )}
        </main>

        {/* 5. Footer */}
        <footer className="menu-footer">
          <img src="/sh-manoosha/logo.png" alt="شيشة ومنقوشة" className="footer-logo" />
          <h4 className="footer-name">شيشة ومنقوشة (sh&manoosha)</h4>
          <p className="footer-tagline">
            {lang === 'ar' ? 'أهلاً وسهلاً بكم في صالتنا • نتمنى لكم وقتاً ممتعاً وأشهى اللحظات' : 'Welcome to our restaurant • Wishing you delightful moments'}
          </p>
          <div className="footer-contact-pills">
            <button onClick={() => setIsWaiterModalOpen(true)} className="footer-pill">
              <span>🔔</span>
              <span>{lang === 'ar' ? 'نداء الويتر' : 'Call Waiter'}</span>
            </button>
            <button onClick={() => setIsTableModalOpen(true)} className="footer-pill">
              <span>🪑</span>
              <span>{lang === 'ar' ? 'تغيير الطاولة' : 'Change Table'}</span>
            </button>
          </div>
        </footer>

        {/* 6. Floating Cart Bar (Bottom) */}
        {cartCount > 0 && (
          <div className="floating-cart-wrapper">
            <div className="floating-cart-bar" onClick={() => setIsCartOpen(true)}>
              <div className="cart-bar-left">
                <div className="cart-icon-bubble">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <span className="cart-badge-count">{cartCount}</span>
                </div>
                <div className="cart-text-wrap">
                  <span className="cart-title">
                    {lang === 'ar' ? `طلب طاولة #${tableNumber}` : `Table #${tableNumber} Order`}
                  </span>
                  <span className="cart-total-price">{cartTotal} ₪</span>
                </div>
              </div>
              <div 
                className="cart-bar-right"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCartOpen(true);
                }}
              >
                <span className="cart-action-text">{lang === 'ar' ? 'مراجعة وإرسال' : 'Review & Send'}</span>
                <span className="cart-arrow">{lang === 'ar' ? '←' : '→'}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
           MODALS & DRAWERS
           ========================================================================= */}

      {/* 1. Cart Drawer */}
      {isCartOpen && (
        <div className="drawer-backdrop open" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title-wrap">
                <span className="drawer-icon">🛒</span>
                <h3 className="drawer-title">{lang === 'ar' ? 'طلب الصالة لطاولتك' : 'Your Table Order'}</h3>
              </div>
              <button className="drawer-close" onClick={() => setIsCartOpen(false)} title="إغلاق">✕</button>
            </div>

            <div className="drawer-body">
              {/* Table Banner */}
              <div className="table-banner">
                <div className="table-banner-left">
                  <span className="table-banner-icon">🪑</span>
                  <div>
                    <div className="table-banner-text">{lang === 'ar' ? 'خدمة داخل الصالة' : 'Dine-In Service'}</div>
                    <div className="table-banner-number">
                      <span>{lang === 'ar' ? 'طاولة رقم:' : 'Table No:'}</span> #{tableNumber}
                    </div>
                  </div>
                </div>
                <div className="table-locked-indicator">
                  <span className="table-locked-tag">{lang === 'ar' ? 'محددة تلقائياً ✓' : 'Verified Table ✓'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="cart-items-container">
                {cartItems.map((item) => (
                  <div key={item.key} className="cart-item-card">
                    <div className="cart-item-img-wrap">
                      <img src={item.dish.image || '/sh-manoosha/logo.png'} alt={item.dish.name} className="cart-item-img" />
                    </div>
                    <div className="cart-item-info">
                      <h4 className="cart-item-name">{lang === 'ar' ? item.dish.name : (item.dish.nameEn || item.dish.name)}</h4>
                      {item.size && (
                        <span className="cart-item-size-badge">
                          {lang === 'ar' ? item.size.name : (item.size.nameEn || item.size.name)}
                        </span>
                      )}
                      {item.note && (
                        <p className="cart-item-note-text">📝 {item.note}</p>
                      )}
                      <div className="cart-item-price">{item.price * item.qty} ₪</div>
                    </div>

                    <div className="cart-qty-ctrl">
                      <button className="btn-qty" onClick={() => updateCartItemQty(item.key, -1)}>−</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="btn-qty" onClick={() => updateCartItemQty(item.key, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Notes */}
              <div className="order-notes-wrap">
                <label className="notes-label">
                  {lang === 'ar' ? 'ملاحظات خاصة للمطبخ والشيف (اختياري)' : 'Special notes for kitchen (optional)'}
                </label>
                <input
                  type="text"
                  className="notes-input"
                  value={orderGeneralNote}
                  onChange={(e) => setOrderGeneralNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: زيادة تحمير، بدون شطة، شاي سكر خفيف...' : 'e.g., extra crispy, no spicy...'}
                />
              </div>

              {/* Order Summary */}
              <div className="order-summary-card">
                <div className="summary-row">
                  <span>{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{cartTotal} ₪</span>
                </div>
                <div className="summary-row">
                  <span>{lang === 'ar' ? 'الخدمة والضريبة' : 'Tax & Service'}</span>
                  <span className="included-tag">{lang === 'ar' ? 'مشمولة ✓' : 'Included ✓'}</span>
                </div>
                <div className="summary-row total">
                  <span>{lang === 'ar' ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                  <span className="summary-total-val">{cartTotal} ₪</span>
                </div>
              </div>
            </div>

            {/* Direct Platform Submit Button (No WhatsApp) */}
            <div className="drawer-footer">
              <button
                className="btn-direct-order"
                onClick={handleInitiateOrderWithGps}
                disabled={isSubmitting || cartItems.length === 0}
              >
                <span className="btn-order-icon">🚀</span>
                <span>
                  {isSubmitting
                    ? (lang === 'ar' ? 'جارٍ إرسال الطلب للمطبخ...' : 'Sending to Kitchen...')
                    : (lang === 'ar' ? `إرسال الطلب للمطبخ والكاشير مباشرة (${cartTotal} ₪)` : `Send Direct Order to Kitchen (${cartTotal} ₪)`)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Dish Customization Modal */}
      {activeDish && (
        <div className="modal-backdrop open" onClick={() => setActiveDish(null)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hero-img-wrap">
              <img src={activeDish.image || '/sh-manoosha/logo.png'} alt={activeDish.name} className="modal-hero-img" />
              <button className="modal-close-btn" onClick={() => setActiveDish(null)}>✕</button>
            </div>

            <div className="modal-content-body">
              <div className="modal-title-row">
                <div>
                  <h3 className="modal-dish-title">{lang === 'ar' ? activeDish.name : (activeDish.nameEn || activeDish.name)}</h3>
                  <p className="modal-dish-desc">{lang === 'ar' ? activeDish.description : (activeDish.descriptionEn || activeDish.description)}</p>
                </div>
                <div className="modal-base-price">{selectedSize ? selectedSize.price : activeDish.price} ₪</div>
              </div>

              {/* Sizes */}
              {activeDish.sizes && activeDish.sizes.length > 0 && (
                <div className="modal-section-box">
                  <h4 className="modal-section-title">{lang === 'ar' ? 'اختر الحجم المطلوب:' : 'Select Size:'}</h4>
                  <div className="sizes-chips-wrap">
                    {activeDish.sizes.map((s: any) => (
                      <button
                        key={s.name}
                        className={`size-chip ${selectedSize?.name === s.name ? 'selected' : ''}`}
                        onClick={() => setSelectedSize(s)}
                      >
                        <span>{lang === 'ar' ? s.name : (s.nameEn || s.name)}</span>
                        <span className="size-price-tag">{s.price} ₪</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="modal-section-box">
                <h4 className="modal-section-title">{lang === 'ar' ? 'ملاحظاتك الخاصة لهذا الصنف (اختياري):' : 'Special notes for dish:'}</h4>
                <input
                  type="text"
                  className="modal-note-input"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: زيادة تحمير، بدون بصل...' : 'e.g., extra sauce, no onions...'}
                />
              </div>

              {/* Qty & Add Button */}
              <div className="modal-action-row">
                <div className="modal-qty-selector">
                  <button className="btn-modal-qty" onClick={() => setModalQty(Math.max(1, modalQty - 1))}>−</button>
                  <span className="modal-qty-val">{modalQty}</span>
                  <button className="btn-modal-qty" onClick={() => setModalQty(modalQty + 1)}>+</button>
                </div>

                <button className="btn-confirm-add" onClick={confirmModalAdd}>
                  <span>{lang === 'ar' ? 'إضافة للطلب' : 'Add to Order'}</span>
                  <span className="modal-calc-price">
                    {(selectedSize ? selectedSize.price : activeDish.price) * modalQty} ₪
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Table Modal (Disabled - Table is permanently locked to table number) */}

      {/* 4. Waiter Modal */}
      {isWaiterModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsWaiterModalOpen(false)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon">🔔</div>
            <h3 className="dialog-title">
              {lang === 'ar' ? `نداء الويتر لطاولة #${tableNumber}` : `Call Waiter for Table #${tableNumber}`}
            </h3>
            <p className="dialog-desc">
              {lang === 'ar' ? 'اختر ما ترغب به وسيصلك الويتر فوراً لمساعدتك' : 'Select your request and our staff will assist you promptly'}
            </p>
            <div className="waiter-options-list">
              <button className="waiter-option-btn" onClick={() => handleSendWaiterCall('طلب الحساب والفاتورة')}>
                <span>💳</span>
                <span>{lang === 'ar' ? 'طلب الحساب والفاتورة' : 'Request Bill / Check'}</span>
              </button>
              <button className="waiter-option-btn" onClick={() => handleSendWaiterCall('تبديل فحم للأرجيلة')}>
                <span>🔥</span>
                <span>{lang === 'ar' ? 'تبديل فحم للأرجيلة' : 'Change Shisha Charcoal'}</span>
              </button>
              <button className="waiter-option-btn" onClick={() => handleSendWaiterCall('محارم وضيافة إضافية')}>
                <span>🍽️</span>
                <span>{lang === 'ar' ? 'محارم وضيافة إضافية' : 'Table Napkins / Setup'}</span>
              </button>
              <button className="waiter-option-btn" onClick={() => handleSendWaiterCall('مساعدة أو استفسار عن صنف')}>
                <span>🙋‍♂️</span>
                <span>{lang === 'ar' ? 'مساعدة أو استفسار عن صنف' : 'General Assistance'}</span>
              </button>
            </div>
            <button className="dialog-btn-cancel" onClick={() => setIsWaiterModalOpen(false)}>
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* 5. Order Success Dialog (Direct in-app confirmation) */}
      {orderSuccess && (
        <div className="modal-backdrop open" style={{ zIndex: 1200 }} onClick={() => setOrderSuccess(null)}>
          <div className="dialog-card success-card" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon-success">✓</div>
            <h3 className="dialog-title">{lang === 'ar' ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!'}</h3>
            <p className="dialog-desc">
              {lang === 'ar'
                ? `طلبك تم إرساله مباشرة إلى شاشة المطبخ والكاشير لطاولة رقم #${orderSuccess.table}`
                : `Your order has been sent directly to the kitchen & cashier for Table #${orderSuccess.table}`}
            </p>
            
            <div className="success-order-box">
              <div className="success-row">
                <span>{lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</span>
                <span className="success-val">{orderSuccess.orderId}</span>
              </div>
              <div className="success-row">
                <span>{lang === 'ar' ? 'رقم الطاولة:' : 'Table:'}</span>
                <span className="success-val">#{orderSuccess.table}</span>
              </div>
              <div className="success-row">
                <span>{lang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                <span className="success-val">{orderSuccess.total} ₪</span>
              </div>
            </div>

            <button className="dialog-btn-primary" onClick={() => setOrderSuccess(null)}>
              {lang === 'ar' ? 'متابعة تصفح المنيو' : 'Continue Browsing'}
            </button>
          </div>
        </div>
      )}

      {/* 6. Toast */}
      {toastMsg && (
        <div className="toast-notification">
          <span className="toast-icon">✓</span>
          <span className="toast-text">{toastMsg}</span>
        </div>
      )}

      {/* 7. GPS Geofencing Verification Modal */}
      <GpsVerificationModal
        isOpen={gpsModalOpen}
        onClose={() => setGpsModalOpen(false)}
        status={gpsStatus}
        distanceMeters={distanceMeters}
        allowedRadiusMeters={gpsConfig.radiusMeters}
        restaurantName={lang === 'ar' ? 'مطعم وكافيه شيشة ومنقوشة' : 'Shisha & Manoosha'}
        restaurantLocationText={lang === 'ar' ? 'نابلس - رفيديا - الشارع الرئيسي' : 'Nablus - Rafidia'}
        errorMessage={gpsErrorMessage}
        userCoords={clientCoords}
        restaurantCoords={{ latitude: gpsConfig.latitude, longitude: gpsConfig.longitude }}
        onRetry={handleInitiateOrderWithGps}
        onCallWaiter={() => {
          setGpsModalOpen(false);
          handleSendWaiterCall(lang === 'ar' ? 'تأكيد الطلب على الطاولة يدوياً (GPS)' : 'Manual Table Verification (GPS)');
        }}
        onSimulateInside={process.env.NODE_ENV === 'development' ? handleSimulateInside : undefined}
      />

    </div>
  );
}
