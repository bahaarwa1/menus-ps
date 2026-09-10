'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, Minus, X, Check, Search, Bell, Star, 
  ShoppingBag, Utensils,
  Edit3, AlertCircle, ShieldCheck, Flame, 
  Sparkles, ChefHat, ArrowLeft
} from 'lucide-react';
import { menuItems, categories, MenuItem, Extra } from '@/data/demo-data';

function FastFrictionlessMenuContent() {
  const searchParams = useSearchParams();
  const qrTokenParam = searchParams.get('t') || searchParams.get('token') || '';

  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || 'burgers');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Table verification state
  const [tableNumber, setTableNumber] = useState<number>(12);
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string>('');

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

  // Realtime order status tracking
  useEffect(() => {
    if (!isOrderSubmitted || !submittedOrderId) return;
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
      eventSource?.close();
    };
  }, [isOrderSubmitted, submittedOrderId]);

  // Dynamic QR Token Verification on Load
  useEffect(() => {
    if (qrTokenParam) {
      fetch(`/api/v1/tables/verify-token?token=${encodeURIComponent(qrTokenParam)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.table) {
            setTableNumber(data.table.tableNumber);
            setIsTokenVerified(true);
            setTokenError('');
          } else {
            setTokenError(data.error || 'رمز QR غير صالح أو منتهي الصلاحية');
          }
        })
        .catch(() => {
          const match = qrTokenParam.match(/(\d+)/);
          if (match) {
            setTableNumber(parseInt(match[1], 10));
            setIsTokenVerified(true);
          }
        });
    }
  }, [qrTokenParam]);

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

  // Filtered menu
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = searchQuery ? true : item.category === activeCategory;
      const matchSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  // Cart summary
  const cartItemsList = useMemo(() => {
    return Object.entries(cartQuantities).map(([id, qty]) => {
      const item = menuItems.find(m => m.id === id)!;
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
  }, [cartQuantities, itemNotes, selectedExtras]);

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
    
    // Set note and extras
    setItemNotes(prev => ({ ...prev, [id]: tempNote.trim() }));
    setSelectedExtras(prev => ({ ...prev, [id]: tempExtras }));

    // If item not in cart yet, add 1
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
    setIsSubmittingOrder(true);
    setOrderError('');

    try {
      const itemsPayload = Object.entries(cartQuantities).map(([id, qty]) => ({
        itemId: id,
        quantity: qty,
        note: itemNotes[id] || undefined,
        extras: selectedExtras[id] || undefined,
      }));

      const res = await fetch('/api/v1/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: 'b0000000-0000-0000-0000-000000000001',
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

      setSubmittedOrderId(data.order.orderNumber);
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

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-800 font-sans antialiased selection:bg-orange-500 selection:text-white" dir="rtl">
      
      {/* Real Responsive Customer Menu Container */}
      <div className="w-full max-w-lg bg-white min-h-screen shadow-xl flex flex-col relative pb-32">

        {/* ============================================================
            1. HERO RESTAURANT HEADER
        ============================================================ */}
        <header className="relative bg-slate-950 text-white shrink-0 overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-32 sm:h-36 w-full overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80" 
              alt="Burger House Nablus" 
              className="w-full h-full object-cover opacity-60 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
            
            {/* Top Bar Floating Buttons */}
            <div className="absolute top-2.5 inset-x-3 flex items-center justify-between z-10">
              <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-[11px] font-black shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-300">مفتوح الآن</span>
              </div>

              {/* Waiter Alert & Table Badge */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCallWaiter}
                  className="bg-slate-900/80 hover:bg-orange-600 active:scale-90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-black flex items-center gap-1.5 shadow-lg transition-all"
                >
                  <Bell size={13} className="text-orange-400" />
                  <span>نداء الويتر</span>
                </button>

                <div className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1 border border-orange-400">
                  <ShieldCheck size={14} className={isTokenVerified ? 'text-emerald-300' : 'text-white'} />
                  <span>طاولة {tableNumber}</span>
                </div>
              </div>
            </div>

            {/* Restaurant Info Bottom of Banner */}
            <div className="absolute bottom-3 right-4 left-4 z-10 flex items-end justify-between">
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2 drop-shadow-md">
                  Burger House نابلس
                  <span className="text-xs bg-orange-500/30 text-orange-300 font-bold px-2 py-0.5 rounded-md border border-orange-400/30">
                    رفيديا
                  </span>
                </h1>
                <p className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star size={12} fill="currentColor" /> 4.9 (420+ تقييم)
                  </span>
                  <span>•</span>
                  <span>برغر وفاست فود فاخر</span>
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-xl shrink-0 border border-slate-200">
                <div className="w-full h-full rounded-xl bg-orange-500 text-white font-black flex items-center justify-center text-lg shadow-inner">
                  BH
                </div>
              </div>
            </div>
          </div>

          {/* Waiter Alert Toast Notification */}
          <AnimatePresence>
            {waiterCalled && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-black flex items-center justify-center gap-2 shadow-lg"
              >
                <Check size={16} strokeWidth={3} />
                <span>تم إشعار الويتر بنجاح، وسيحضر إلى طاولة {tableNumber} فوراً!</span>
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
                className="bg-rose-600 text-white px-4 py-2 text-xs font-black flex items-center justify-center gap-1.5"
              >
                <AlertCircle size={14} />
                <span>{tokenError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Input */}
          <div className="p-3 bg-slate-950 border-t border-white/5">
            <div className="relative">
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="ابحث عن وجبة، صوص، أو إضافة مميزة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Categories Pill Slider */}
          <div className="px-3 pb-3 bg-slate-950 flex gap-1.5 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id && !searchQuery;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ============================================================
            2. MAIN MENU FEED (CARDS & ITEMS)
        ============================================================ */}
        <main className="flex-1 overflow-y-auto p-3.5 space-y-3 pb-36 bg-slate-50">
          {filteredItems.length === 0 ? (
            <div className="py-24 text-center text-slate-400">
              <Utensils size={40} className="mx-auto mb-2 opacity-30 text-orange-500" />
              <p className="text-sm font-black text-slate-700">لم يتم العثور على أطباق مطابقة</p>
              <p className="text-xs text-slate-400 mt-1">جرّب البحث باسم آخر أو تصفح بقية الأقسام</p>
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
                  className={`bg-white rounded-3xl p-3.5 border transition-all flex items-center justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer relative ${
                    qty > 0 ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/15' : 'border-slate-200/80 hover:border-orange-200'
                  }`}
                >
                  {/* Left (RTL Right): Details & Pricing */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <h3 className="font-black text-sm text-slate-900 leading-snug">
                        {item.name}
                      </h3>
                      {item.popular && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Flame size={10} className="text-amber-600" /> الأكثر طلباً
                        </span>
                      )}
                      {item.spicy && (
                        <span className="text-[11px]" title="حار وسبايسي">🌶️</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed mb-2.5">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span className="font-black text-sm text-slate-900">{item.price}</span>
                        <span className="text-xs text-orange-600 font-bold mr-1">₪</span>
                      </div>

                      {/* Customization label if active */}
                      {(note || extras.length > 0) && (
                        <span className="text-[10px] font-black text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Edit3 size={10} />
                          <span>مخصص ({extras.length > 0 ? `+${extras.length} إضافات` : 'ملاحظة'})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right (RTL Left): Food Image & Quick Action */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl bg-orange-50">
                          {item.image}
                        </div>
                      )}
                    </div>

                    {/* Stepper or Add Button */}
                    {qty === 0 ? (
                      <button
                        onClick={(e) => addOne(item.id, e)}
                        className="w-full py-1.5 px-3.5 bg-orange-500 hover:bg-orange-600 active:scale-90 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-md shadow-orange-500/25 transition-all"
                      >
                        <Plus size={14} strokeWidth={3} />
                        <span>أضف</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-orange-500 text-white p-1 rounded-xl shadow-md shadow-orange-500/25">
                        <button
                          onClick={(e) => removeOne(item.id, e)}
                          className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Minus size={13} strokeWidth={3} />
                        </button>
                        <span className="font-black text-xs min-w-[18px] text-center">{qty}</span>
                        <button
                          onClick={(e) => addOne(item.id, e)}
                          className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-90 transition-all"
                        >
                          <Plus size={13} strokeWidth={3} />
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
            3. LUXURY STICKY FLOATING CART BAR
        ============================================================ */}
        <div className="fixed bottom-0 inset-x-0 max-w-lg mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3.5 z-30 shadow-[0_-10px_35px_rgba(0,0,0,0.1)]">
          {totalCount === 0 ? (
            <div className="text-center py-2 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <ShoppingBag size={15} className="text-slate-300" />
              <span>انقر على زر (+) بجانب أي وجبة لإضافتها لطلبك</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Order total info */}
              <button 
                onClick={() => setIsReviewOpen(true)}
                className="text-right shrink-0"
              >
                <div className="flex items-center gap-1.5">
                  <span className="bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-0.5 rounded-md">
                    {totalCount} أصناف
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">طاولة {tableNumber}</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-0.5 leading-none">
                  {totalAmount} <span className="text-xs text-orange-600 font-bold">₪</span>
                </div>
              </button>

              {/* Direct Review & Send Button */}
              <button
                onClick={() => setIsReviewOpen(true)}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
              >
                <span>مراجعة وإرسال الطلب</span>
                <ArrowLeft size={16} />
              </button>
            </div>
          )}
        </div>

        {/* ============================================================
            4. DETAILED PRODUCT & EXTRAS MODAL
        ============================================================ */}
        <AnimatePresence>
          {selectedProduct && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)} 
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
                className="relative bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl max-h-[90vh] flex flex-col z-10 shadow-2xl overflow-hidden"
              >
                {/* Product Image Header */}
                <div className="relative h-48 w-full bg-slate-900 shrink-0">
                  {selectedProduct.imageUrl ? (
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {selectedProduct.image}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  
                  <button 
                    onClick={() => setSelectedProduct(null)} 
                    className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md"
                  >
                    <X size={18} />
                  </button>

                  <div className="absolute bottom-3 right-4 left-4 text-white">
                    <h3 className="text-xl font-black">{selectedProduct.name}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{selectedProduct.description}</p>
                  </div>
                </div>

                {/* Modal Body: Extras & Notes */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
                  {/* Extras Section */}
                  {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                    <div>
                      <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-orange-500" />
                        <span>إضافات مميزة حسب الرغبة</span>
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
                                  ? 'bg-orange-50 border-orange-500 shadow-xs' 
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-black transition-colors ${
                                  isChecked ? 'bg-orange-500' : 'border border-slate-300'
                                }`}>
                                  {isChecked && <Check size={12} strokeWidth={3} />}
                                </div>
                                <span className="text-xs font-bold text-slate-800">{extra.name}</span>
                              </div>
                              <span className="text-xs font-black text-orange-600">+{extra.price} ₪</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes / Instructions */}
                  <div>
                    <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ChefHat size={14} className="text-orange-500" />
                      <span>ملاحظات خاصة للشيف</span>
                    </h4>

                    {/* Preset Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['بدون بصل', 'بدون مخلل', 'صوص خارجي', 'حار زيادة', 'استواء كامل'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setTempNote(prev => prev ? `${prev}، ${chip}` : chip)}
                          className="text-[11px] font-bold bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      placeholder="مثلاً: صوص حار على جنب، خبز محمص قليلاً..."
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500 resize-none text-slate-800"
                    />
                  </div>
                </div>

                {/* Modal Footer CTA */}
                <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleSaveProductModal}
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
                  >
                    <span>حفظ وإضافة للطلب</span>
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
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="relative bg-white w-full max-w-md rounded-t-[2.5rem] max-h-[85vh] flex flex-col z-10 shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <div>
                    <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                      <span>تأكيد الطلب — طاولة {tableNumber}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">{totalCount} أصناف ستصل لمطبخ المطعم فوراً</p>
                  </div>
                  <button onClick={() => setIsReviewOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>

                {/* Items Breakdown */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50">
                  {cartItemsList.map((ci) => (
                    <div key={ci.item.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xs text-slate-900">{ci.item.name}</p>
                        
                        {ci.extras.length > 0 && (
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            إضافات: {ci.extras.join('، ')}
                          </p>
                        )}
                        {ci.note && (
                          <p className="text-[10px] text-orange-600 font-black mt-0.5">
                            ملاحظة: {ci.note}
                          </p>
                        )}
                        <p className="text-xs font-black text-slate-900 mt-1">{ci.total} ₪</p>
                      </div>

                      {/* Stepper inside cart */}
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl">
                        <button onClick={() => removeOne(ci.item.id)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 active:scale-90">
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="font-black text-xs px-1.5">{ci.quantity}</span>
                        <button onClick={() => addOne(ci.item.id)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-slate-700 active:scale-90">
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Send Action */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0 space-y-3">
                  {orderError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{orderError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                    <span>المجموع النهائي:</span>
                    <span className="text-lg font-black text-slate-900">{totalAmount} ₪</span>
                  </div>

                  <button
                    onClick={handleSendOrder}
                    disabled={isSubmittingOrder}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-all disabled:opacity-50"
                  >
                    {isSubmittingOrder ? (
                      <span className="animate-pulse">جارٍ إرسال الطلب للمطبخ... ⏳</span>
                    ) : (
                      <>
                        <span>تأكيد وإرسال للمطبخ فوراً</span>
                        <ArrowLeft size={16} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============================================================
            6. LIVE ORDER TRACKER SCREEN (POST-SUBMIT)
        ============================================================ */}
        <AnimatePresence>
          {isOrderSubmitted && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 text-white text-center"
            >
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-white/10 text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>طاولة {tableNumber}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">رقم الطلب: {submittedOrderId}</span>
              </div>

              <div className="max-w-sm mx-auto my-auto space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
                  <ChefHat size={40} className="animate-bounce" />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight mb-1">
                    طلبك وصل المطبخ الآن! ⚡
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    الشيف بدأ بتحضير وجباتك بعناية، وسيقوم الويتر بتقديمها لطاولتك فور جاهزيتها.
                  </p>
                </div>

                {/* 3-Step Live Tracker */}
                <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 space-y-4 text-right">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">1. استلام الطلب</p>
                      <p className="text-[10px] text-emerald-400 font-bold">تم الاستلام بنجاح</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      liveOrderStatus === 'cooking' || liveOrderStatus === 'ready' || liveOrderStatus === 'completed'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      <ChefHat size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">2. قيد التحضير في المطبخ</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {liveOrderStatus === 'cooking' ? 'جارٍ الشواء والتجهيز الآن 👨‍🍳' : 'في الانتظار'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      liveOrderStatus === 'ready' || liveOrderStatus === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">3. جاهز للتقديم</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {liveOrderStatus === 'ready' ? 'الطلب جاهز على طاولتك! 🎉' : 'خلال دقائق معدودة'}
                      </p>
                    </div>
                  </div>
                </div>

                {serverVerifiedTotal && (
                  <p className="text-xs font-black text-slate-300">
                    المبلغ الإجمالي المحسوب بالسيرفر: <span className="text-orange-400 font-mono text-sm">{serverVerifiedTotal} ₪</span>
                  </p>
                )}
              </div>

              <button
                onClick={() => setIsOrderSubmitted(false)}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition-all"
              >
                طلب وجبات إضافية لنفس الطاولة ➕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

export default function FastFrictionlessMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-black">
        جارٍ تجهيز المنيو الذكي...
      </div>
    }>
      <FastFrictionlessMenuContent />
    </Suspense>
  );
}
