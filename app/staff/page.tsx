'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, CheckCircle2, Clock,
  Search, Printer, Check, X, Bell, BellOff,
  Sun, Moon, LogOut, ChefHat, RefreshCw,
  KeyRound, AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { printThermalReceipt } from '@/lib/print-utils';
import { matchFoodPhoto } from '@/lib/food-presets-catalog';

// Audio chime using Web Audio API
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start(ctx.currentTime + 0.14);
    osc1.stop(ctx.currentTime + 0.65);
    osc2.stop(ctx.currentTime + 0.65);
  } catch {}
}

function mapDbOrder(raw: any) {
  return {
    id: raw.id,
    orderNumber: raw.order_number || raw.orderNumber || `#${raw.id?.slice(0, 6)}`,
    table: raw.table_number ?? raw.tableNumber ?? 0,
    items: (raw.order_items || raw.items || []).map((it: any) => ({
      name: it.item_name || it.itemName || it.name || 'صنف',
      quantity: Number(it.quantity) || 1,
      price: Number(it.unit_price || it.unitPrice || it.price) || 0,
      extras: it.selected_extras || it.extras || [],
      customization: it.notes || it.customization || '',
      imageUrl: it.image_url || it.imageUrl || it.image || matchFoodPhoto(it.item_name || it.itemName || it.name),
    })),
    total: Number(raw.total_amount || raw.totalAmount) || 0,
    status: raw.status || 'جديد',
    time: raw.created_at
      ? new Date(raw.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    customerName: `طاولة ${raw.table_number ?? raw.tableNumber ?? 0}`,
    notes: raw.customer_note || raw.customerNote || '',
    branchId: raw.branch_id || raw.branchId,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

export default function StaffOrdersManagementPage({ initialSlug }: { initialSlug?: string } = {}) {
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [branchId, setBranchId] = useState<string>('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<{ id: string; table: number; count: number; time: string } | null>(null);

  // Restaurant & Authentication States
  const [restaurantSlug, setRestaurantSlug] = useState<string>(initialSlug || '');
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurantLogo, setRestaurantLogo] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isSubmittingPin, setIsSubmittingPin] = useState<boolean>(false);

  const selectedOrder = ordersList.find(o => o.id === selectedOrderId) || ordersList[0];

  // Fetch session + load initial orders
  const loadOrders = useCallback(async (bid?: string) => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/v1/orders/list${bid ? `?branchId=${encodeURIComponent(bid)}` : ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        const mapped = data.orders.map(mapDbOrder);
        setOrdersList(mapped);
        if (mapped.length > 0 && !selectedOrderId) {
          setSelectedOrderId(mapped[0].id);
        }
      } else if (res.status === 401 || res.status === 403) {
        setIsAuthenticated(false);
        setShowPinModal(true);
      }
    } catch (e) {
      console.error('loadOrders error:', e);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [selectedOrderId]);

  useEffect(() => {
    let slug = initialSlug || '';
    if (!slug && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const querySlug = urlParams.get('restaurant') || urlParams.get('slug');
      if (querySlug) slug = querySlug;
    }

    fetch('/api/auth/session')
      .then(r => r.json())
      .then(async (sessionData) => {
        const user = sessionData.user;
        const sessionBranchId = user?.branchId || '';
        const sessionSlug = user?.restaurantSlug || '';
        const sessionName = user?.restaurantName || '';

        const effectiveSlug = slug || sessionSlug;
        if (effectiveSlug) setRestaurantSlug(effectiveSlug);
        if (sessionName) setRestaurantName(sessionName);

        let targetBranch = sessionBranchId;
        if (effectiveSlug) {
          try {
            const restRes = await fetch(`/api/v1/restaurant/settings?slug=${encodeURIComponent(effectiveSlug)}`);
            const restData = await restRes.json();
            if (restData.success && restData.restaurant) {
              setRestaurantName(restData.restaurant.name || sessionName);
              if (restData.restaurant.logoUrl) setRestaurantLogo(restData.restaurant.logoUrl);
              if (restData.restaurant.branchId) targetBranch = restData.restaurant.branchId;
            }
          } catch {}
        }

        if (sessionData.authenticated && user) {
          if (slug && sessionBranchId && targetBranch && sessionBranchId !== targetBranch) {
            // User is authenticated under a different restaurant's branch
            setIsAuthenticated(false);
            setShowPinModal(true);
          } else {
            setIsAuthenticated(true);
            setShowPinModal(false);
            const activeBid = targetBranch || sessionBranchId;
            setBranchId(activeBid);
            loadOrders(activeBid);
          }
        } else {
          setIsAuthenticated(false);
          setShowPinModal(true);
          setIsLoadingOrders(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setShowPinModal(true);
        setIsLoadingOrders(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlug]);

  const handlePinSubmit = async (pinOverride?: string) => {
    const code = (pinOverride || pinInput).trim();
    if (code.length < 4) {
      setPinError('أدخل رمز الدخول (4 أرقام على الأقل)');
      return;
    }
    setIsSubmittingPin(true);
    setPinError('');
    try {
      const res = await fetch('/api/auth/staff-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: code,
          restaurantSlug,
          branchId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setShowPinModal(false);
        setPinInput('');
        if (data.user?.branchId) {
          setBranchId(data.user.branchId);
          loadOrders(data.user.branchId);
        }
        if (data.user?.restaurantName) {
          setRestaurantName(data.user.restaurantName);
        }
        if (data.user?.restaurantSlug) {
          setRestaurantSlug(data.user.restaurantSlug);
        }
      } else {
        setPinError(data.error || 'رمز الدخول غير صحيح');
        setPinInput('');
      }
    } catch {
      setPinError('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Supabase Realtime subscription for live order updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const raw = payload.new as any;
          if (branchId && raw.branch_id !== branchId) return;

          // 1. Instantly display order in 0ms (no waiting for fetch roundtrip!)
          const immediateOrder = mapDbOrder(raw);
          setOrdersList(prev => {
            const exists = prev.some(o => o.id === immediateOrder.id);
            if (exists) return prev;
            return [immediateOrder, ...prev];
          });
          setSelectedOrderId(prev => prev || immediateOrder.id);
          if (soundEnabled) playOrderChime();
          setNewOrderAlert({
            id: immediateOrder.id,
            table: immediateOrder.table,
            count: immediateOrder.items?.length || 1,
            time: immediateOrder.time,
          });
          setTimeout(() => setNewOrderAlert(null), 8000);

          // 2. In background, fetch full enriched order with items and update in place
          fetch(`/api/v1/orders/list?orderId=${raw.id}&_t=${Date.now()}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(data => {
              if (data.success && data.orders?.length > 0) {
                const enriched = mapDbOrder(data.orders[0]);
                setOrdersList(prev => prev.map(o => o.id === enriched.id ? enriched : o));
              }
            })
            .catch(() => {});
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const raw = payload.new as any;
          setOrdersList(prev => prev.map(o =>
            o.id === raw.id ? { ...o, status: raw.status } : o
          ));
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [branchId, soundEnabled]);

  // Fast Background Polling every 2s with cache bypass and safe merge (orders never disappear)
  useEffect(() => {
    let isMounted = true;
    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/orders/list?_t=${Date.now()}${branchId ? `&branchId=${encodeURIComponent(branchId)}` : ''}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.orders)) {
          const fresh = data.orders.map(mapDbOrder);
          setOrdersList((prev) => {
            if (prev.length === 0) return fresh;

            // Build map of fresh order IDs
            const freshIds = new Set(fresh.map((o: any) => o.id));

            // Prevent disappearing: Keep any recent order from prev that isn't in fresh yet
            const now = Date.now();
            const keptFromPrev = prev.filter((p: any) => {
              if (freshIds.has(p.id)) return false;
              const orderTime = new Date(p.createdAt || 0).getTime();
              return (now - orderTime) < 180000; // Retain recent orders up to 3 minutes
            });

            // Detect newly incoming orders to trigger chime & alert
            const prevIds = new Set(prev.map((o: any) => o.id));
            const newOrders = fresh.filter((o: any) => !prevIds.has(o.id));
            if (newOrders.length > 0) {
              const latest = newOrders[0];
              if (soundEnabled) playOrderChime();
              setNewOrderAlert({
                id: latest.id,
                table: latest.table,
                count: latest.items.length,
                time: latest.time,
              });
              setTimeout(() => setNewOrderAlert(null), 8000);
            }

            const combined = [...keptFromPrev, ...fresh];
            combined.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            return combined;
          });
        }
      } catch {}
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [branchId, soundEnabled]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Optimistic update
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (newStatus === 'جاهز' && soundEnabled) playOrderChime();
    // Persist to DB
    try {
      await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error('updateOrderStatus error:', e);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setIsAuthenticated(false);
    setShowPinModal(false);
    setOrdersList([]);
    window.location.href = '/login';
  };

  const handlePrintReceipt = (order: any) => {
    if (!order) return;
    printThermalReceipt({
      id: order.orderNumber || order.id,
      table: order.table,
      time: order.time,
      total: order.total,
      items: order.items || [],
      notes: order.notes,
      restaurantName: restaurantName || 'MENUS.PS'
    });
  };

  // Filter orders
  const filteredOrders = ordersList.filter(o => {
    const matchesFilter = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      (o.orderNumber || o.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      `طاولة ${o.table}`.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });


  // Clean, professional, eye-friendly status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'جديد':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200/80 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>بانتظار التأكيد</span>
          </span>
        );
      case 'قيد التحضير':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200/80 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>قيد التحضير</span>
          </span>
        );
      case 'جاهز':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Check size={11} strokeWidth={2.5} className="text-emerald-600" />
            <span>جاهز للتسليم</span>
          </span>
        );
      case 'تم التسليم':
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200/80 font-bold text-[11px] px-2.5 py-0.5 rounded-full shrink-0">
            مكتمل
          </span>
        );
      default:
        return null;
    }
  };

  const newOrdersCount = ordersList.filter(o => o.status === 'جديد').length;
  const preparingCount = ordersList.filter(o => o.status === 'قيد التحضير').length;
  const readyCount = ordersList.filter(o => o.status === 'جاهز').length;

  const renderInspectorContent = (order: any, isMobileModal: boolean = false) => {
    if (!order) {
      return (
        <div className={`rounded-2xl border p-8 text-center text-xs ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200/80 text-slate-500'
        }`}>
          اختر طلباً من القائمة لعرض تفاصيله
        </div>
      );
    }

    return (
      <div className={`space-y-3.5 ${
        isMobileModal 
          ? '' 
          : `rounded-2xl border shadow-xs p-4 max-h-[calc(100vh-160px)] overflow-y-auto ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800'
            }`
      }`}>
        {/* Order Details Header */}
        <div className={`pb-3 flex items-center justify-between border-b ${
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-lg tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>{order.id}</span>
              {getStatusBadge(order.status)}
            </div>
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              طلب طاولة <span className="text-orange-600 font-bold">{order.table}</span> — الساعة {order.time}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePrintReceipt(order)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
              title="طباعة بون المطبخ (صفحة واحدة فورية)"
            >
              <Printer size={15} />
              <span>طباعة البون</span>
            </button>

            {isMobileModal && (
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="إغلاق"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className={`space-y-2 ${isMobileModal ? 'max-h-64' : 'max-h-60'} overflow-y-auto pr-0.5`}>
          <p className={`text-xs font-bold ${
            isDarkMode ? 'text-slate-200' : 'text-slate-700'
          }`}>
            محتويات الطلب ({order.items.length} أصناف)
          </p>
          {order.items.map((item: any, iIdx: number) => {
            const img = item.imageUrl || item.image || matchFoodPhoto(item.name);
            return (
              <div 
                key={iIdx} 
                className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 border transition-all ${
                  isDarkMode 
                    ? 'bg-slate-800/80 border-slate-700 text-slate-100' 
                    : 'bg-slate-50/70 border-slate-200/70 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {item.quantity}×
                  </span>
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-xs sm:text-sm truncate ${
                      isDarkMode ? 'text-white' : 'text-slate-800'
                    }`}>{item.name}</p>
                    {item.customization && (
                      <span className="text-[11px] text-orange-600 font-medium block">• {item.customization}</span>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <span className={`text-[11px] font-normal block ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>• + {item.extras.join('، ')}</span>
                    )}
                  </div>
                </div>
                <span className={`font-bold text-xs sm:text-sm shrink-0 ${
                  isDarkMode ? 'text-white' : 'text-slate-800'
                }`}>{item.price * item.quantity} ₪</span>
              </div>
            );
          })}
        </div>

        {/* Customer Notes */}
        {order.notes && (
          <div className={`rounded-xl p-3 text-xs shadow-2xs border ${
            isDarkMode 
              ? 'bg-amber-950/40 border-amber-800 text-amber-200' 
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <span className={`block mb-1 font-bold ${
              isDarkMode ? 'text-amber-300' : 'text-amber-800'
            }`}>⚠️ ملاحظات الزبون الخاصة:</span>
            <p className={`leading-relaxed ${
              isDarkMode ? 'text-amber-100' : 'text-slate-700'
            }`}>{order.notes}</p>
          </div>
        )}

        {/* Bill Breakdown */}
        <div className={`p-3 rounded-xl space-y-1.5 text-xs border ${
          isDarkMode 
            ? 'bg-slate-800/60 border-slate-700' 
            : 'bg-slate-50 border-slate-200/70'
        }`}>
          <div className={`flex justify-between ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>المجموع الفرعي:</span>
            <span className={`font-semibold ${
              isDarkMode ? 'text-slate-200' : 'text-slate-700'
            }`}>{order.total} ₪</span>
          </div>
          <div className={`flex justify-between ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>الضريبة والخدمة:</span>
            <span className={`font-semibold ${
              isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
            }`}>مشمولة بالكامل (0 ₪)</span>
          </div>
          <div className={`flex justify-between text-sm font-bold pt-2 border-t ${
            isDarkMode ? 'border-slate-700' : 'border-slate-200/80'
          }`}>
            <span className={isDarkMode ? 'text-slate-200' : 'text-slate-800'}>الإجمالي المطلوب:</span>
            <span className="text-orange-600 font-extrabold text-base">{order.total} ₪</span>
          </div>
        </div>

        {/* Primary Action Button Based on Order Status */}
        <div className="pt-1">
          {order.status === 'جديد' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'قيد التحضير')}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ChefHat size={17} />
              <span>بدء تحضير الطلب</span>
            </button>
          )}

          {order.status === 'قيد التحضير' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'جاهز')}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={17} />
              <span>الطلب جاهز للتسليم (طاولة {order.table})</span>
            </button>
          )}

          {order.status === 'جاهز' && (
            <button
              onClick={() => updateOrderStatus(order.id, 'تم التسليم')}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={17} />
              <span>تسليم الطلب للزبون وإغلاقه</span>
            </button>
          )}

          {order.status === 'تم التسليم' && (
            <div className={`text-center py-2.5 border rounded-xl text-xs sm:text-sm font-bold ${
              isDarkMode 
                ? 'bg-slate-800 text-slate-300 border-slate-700' 
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              ✓ تم تسليم هذا الطلب بنجاح
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col selection:bg-orange-500 selection:text-white transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F4F6F9] text-slate-900'
    }`} dir="rtl">
      
      {/* Realtime Floating New Order Alert Banner */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            className="fixed top-4 inset-x-4 max-w-lg mx-auto z-50 bg-gradient-to-r from-orange-600 to-amber-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-orange-400/40"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                🔔
              </span>
              <div>
                <p className="text-xs font-black">طلب جديد لطاولة #{newOrderAlert.table}!</p>
                <p className="text-[11px] text-orange-100">{newOrderAlert.count} أصناف · الساعة {newOrderAlert.time}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedOrderId(newOrderAlert.id);
                setIsMobileDetailOpen(true);
                setNewOrderAlert(null);
              }}
              className="px-3.5 py-2 bg-white hover:bg-orange-50 text-orange-600 rounded-xl text-xs font-black shadow-xs cursor-pointer shrink-0 transition-all"
            >
              معاينة الطلب
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive In-Place Staff PIN Authentication Modal */}
      <AnimatePresence>
        {(showPinModal || !isAuthenticated) && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center text-slate-900 relative"
            >
              {/* Header */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/20 overflow-hidden">
                {restaurantLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={restaurantLogo} alt={restaurantName} className="w-full h-full object-cover" />
                ) : (
                  <ChefHat size={32} />
                )}
              </div>
              
              <h2 className="text-lg font-black text-slate-900 mb-0.5">
                {restaurantName || (restaurantSlug ? `مطعم ${restaurantSlug}` : 'شاشة المطبخ والطلبات')}
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                أدخل رمز دخول الموظف (PIN) المكون من 4 إلى 6 أرقام
              </p>

              {pinError && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 animate-shake">
                  <AlertCircle size={14} />
                  <span>{pinError}</span>
                </div>
              )}

              {/* PIN Digits Display */}
              <div className="flex justify-center gap-2 mb-6">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                      pinInput.length > idx
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs scale-105'
                        : 'border-slate-200 bg-slate-50 text-slate-300'
                    }`}
                  >
                    {pinInput.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pinInput.length < 6) {
                        const next = pinInput + String(num);
                        setPinInput(next);
                        if (next.length === 6) handlePinSubmit(next);
                      }
                    }}
                    className="h-12 rounded-xl bg-slate-50 hover:bg-orange-50 active:bg-orange-100 border border-slate-200 text-slate-800 text-lg font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPinInput('')}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold transition-all cursor-pointer"
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 6) {
                      const next = pinInput + '0';
                      setPinInput(next);
                      if (next.length === 6) handlePinSubmit(next);
                    }
                  }}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-orange-50 active:bg-orange-100 border border-slate-200 text-slate-800 text-lg font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPinInput(prev => prev.slice(0, -1))}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold transition-all cursor-pointer"
                >
                  ⌫
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={pinInput.length < 4 || isSubmittingPin}
                onClick={() => handlePinSubmit()}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingPin ? (
                  <><RefreshCw size={16} className="animate-spin" /> جاري التحقق...</>
                ) : (
                  <><KeyRound size={16} /> دخول لشاشة المطبخ</>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>كود من 4 إلى 6 أرقام</span>
                <a href="/login?role=staff" className="text-orange-600 hover:underline font-bold">
                  تسجيل الدخول الرئيسي
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Header Bar */}
      <header className={`sticky top-0 z-30 border-b shadow-xs transition-colors backdrop-blur-md ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200/80'
      }`}>
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          
          {/* Logo & Title */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                <ChefHat size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-base sm:text-lg font-bold leading-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>إدارة الطلبات الحية</h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isRealtimeConnected 
                      ? 'bg-emerald-500 text-white shadow-xs' 
                      : 'bg-amber-500 text-white'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{isRealtimeConnected ? 'سحابي مباشر' : 'إعادة اتصال...'}</span>
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {restaurantName ? `${restaurantName} · متابعة وتحديث طلبات الصالة` : 'شاشة المطبخ والطلبات · متابعة وتحديث طلبات الصالة'}
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border text-xs font-medium ${
                  soundEnabled ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
              </button>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>

          {/* Action Toolbar (Without QR code, purely staff order management) */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => loadOrders(branchId)}
              disabled={isLoadingOrders}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shadow-2xs ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80'
              }`}
              title="تحديث قائمة الطلبات"
            >
              <RefreshCw size={14} className={isLoadingOrders ? 'animate-spin text-orange-500' : 'text-slate-500'} />
              <span>تحديث الطلبات</span>
            </button>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playOrderChime();
              }}
              className={`hidden md:flex p-2 rounded-xl border text-xs font-medium transition-all shadow-2xs ${
                soundEnabled
                  ? 'bg-orange-500 text-white border-orange-500'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200/80'
              }`}
              title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت التنبيه'}
            >
              {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`hidden md:flex p-2 rounded-xl border text-xs font-medium transition-all shadow-2xs ${
                isDarkMode
                  ? 'bg-amber-400 text-slate-950 border-amber-400'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
              }`}
              title="تبديل المظهر النهاري/الليلي"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className={`hidden lg:flex p-2 rounded-xl border text-xs font-medium shadow-2xs ${
                isDarkMode 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
              title="ملء الشاشة"
            >
              ⛶
            </button>

            <button
              onClick={handleLogout}
              className={`p-2 rounded-xl border transition-colors shadow-2xs ${
                isDarkMode 
                  ? 'border-slate-700 text-slate-300 hover:text-rose-400 hover:bg-rose-950/40' 
                  : 'border-slate-200/80 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="تسجيل خروج"
            >
              <LogOut size={15} />
            </button>
          </div>

        </div>

        {/* 2. Filter Tabs & Search Bar */}
        <div className={`max-w-[1600px] mx-auto px-3 sm:px-5 py-2 border-t flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
          isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white'
        }`}>
          {/* Status Filter Tabs with Clean Calm Style */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 font-bold ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({ordersList.length})
            </button>

            <button
              onClick={() => setStatusFilter('جديد')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 font-bold ${
                statusFilter === 'جديد'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-amber-50 border border-amber-200/80 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'جديد' ? 'bg-white' : 'bg-amber-500'} animate-pulse`} />
              <span>بانتظار التأكيد ({newOrdersCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('قيد التحضير')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 font-bold ${
                statusFilter === 'قيد التحضير'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-blue-50 border border-blue-200/80 text-blue-800 hover:bg-blue-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'قيد التحضير' ? 'bg-white' : 'bg-blue-500'}`} />
              <span>قيد التحضير ({preparingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('جاهز')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 font-bold ${
                statusFilter === 'جاهز'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 border border-emerald-200/80 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'جاهز' ? 'bg-white' : 'bg-emerald-600'}`} />
              <span>جاهز للتسليم ({readyCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('تم التسليم')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 font-bold ${
                statusFilter === 'تم التسليم'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-slate-100 border border-slate-200/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              مكتمل ({ordersList.filter(o => o.status === 'تم التسليم').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search size={14} className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="بحث برقم الطلب أو الطاولة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pr-9 pl-3.5 py-1.5 border rounded-full text-xs transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-orange-500'
              }`}
            />
          </div>
        </div>
      </header>

      {/* 3. Main Split Master-Detail Interface */}
      <main className="max-w-[1600px] mx-auto p-3 sm:p-5 w-full flex-1 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
          
          {/* Orders Cards Container: 3 COLUMNS PER ROW ("3 طاولات جمب بعض") */}
          <div className="w-full lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[calc(100vh-170px)] overflow-y-auto pr-0.5 content-start">
            {filteredOrders.length === 0 ? (
              <div className={`col-span-full rounded-2xl border p-12 text-center ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200/80 text-slate-500'
              }`}>
                <ClipboardList size={36} className="mx-auto mb-2 text-orange-500 opacity-40" />
                <p className={`text-sm font-bold ${
                  isDarkMode ? 'text-slate-200' : 'text-slate-800'
                }`}>لا توجد طلبات مطابقة</p>
                <p className={`text-xs mt-1 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-400'
                }`}>جرّب تغيير حالة الفلتر أو محاكاة طلب QR جديد</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setIsMobileDetailOpen(true);
                    }}
                    className={`rounded-2xl p-2.5 sm:p-3 border transition-all cursor-pointer relative shadow-xs hover:shadow-md flex flex-col justify-between ${
                      isSelected
                        ? isDarkMode
                          ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-950/20'
                          : 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/20'
                        : isDarkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200/80 hover:border-orange-300'
                    }`}
                  >
                    {/* Top Row: Clean Table Badge + Status + Time */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`px-2.5 py-1 rounded-xl font-bold text-xs flex items-center gap-1 border shrink-0 ${
                          isDarkMode ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold">طاولة</span>
                          <span className="text-sm font-black">{order.table}</span>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-slate-400">
                        <Clock size={12} className="text-slate-400" />
                        <span>{order.time}</span>
                      </div>
                    </div>

                    {/* Items preview with food thumbnails & count */}
                    <div className="mb-2.5 flex-1">
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <span className="text-[11px] font-bold text-slate-400">
                          {order.items.length} أصناف
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {order.total} ₪
                        </span>
                      </div>

                      {/* Mini food thumbnails preview */}
                      <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                        {order.items.slice(0, 4).map((it: any, itIdx: number) => {
                          const itImg = it.imageUrl || it.image || matchFoodPhoto(it.name);
                          return (
                            <div key={itIdx} className="relative w-9 h-9 rounded-xl overflow-hidden border border-slate-200/80 shadow-2xs shrink-0" title={`${it.quantity}x ${it.name}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={itImg} alt={it.name} className="w-full h-full object-cover" />
                              {it.quantity > 1 && (
                                <span className="absolute bottom-0 right-0 bg-orange-600 text-white text-[9px] font-black px-1 rounded-tl-md">
                                  {it.quantity}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {order.items.length > 4 && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-1.5 py-1 shrink-0">
                            +{order.items.length - 4}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs line-clamp-2 leading-relaxed ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        {order.items.map((i: any) => `${i.quantity}× ${i.name}`).join('، ')}
                      </p>
                      {order.notes && (
                        <span className="mt-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 px-2 py-0.5 rounded-md block truncate">
                          ملاحظة: {order.notes}
                        </span>
                      )}
                    </div>

                    {/* Direct 1-Click Action Button Bar */}
                    <div className={`pt-2 border-t flex items-center gap-1.5 ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      {order.status === 'جديد' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'قيد التحضير');
                          }}
                          className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <ChefHat size={14} />
                          <span>بدء التحضير</span>
                        </button>
                      )}
                      {order.status === 'قيد التحضير' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'جاهز');
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Check size={14} strokeWidth={2.5} />
                          <span>جاهز للتسليم</span>
                        </button>
                      )}
                      {order.status === 'جاهز' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'تم التسليم');
                          }}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <span>تسليم الطلب</span>
                        </button>
                      )}
                      {order.status === 'تم التسليم' && (
                        <span className="text-[11px] font-bold text-slate-400 py-1.5 flex-1 text-center">
                          تم التسليم بنجاح
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintReceipt(order);
                        }}
                        className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                          isDarkMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="طباعة البون"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Sticky Inspector Pane (4 Cols on Desktop) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-20">
            {renderInspectorContent(selectedOrder, false)}
          </div>

        </div>
      </main>

      {/* 4. Mobile Slide-Up Bottom Sheet Drawer */}
      <AnimatePresence>
        {isMobileDetailOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDetailOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className={`relative w-full max-h-[88vh] rounded-t-3xl shadow-2xl z-10 overflow-hidden flex flex-col border-t ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
              }`}
            >
              {/* Drawer Pull Handle */}
              <div 
                className="pt-3 pb-1 flex justify-center cursor-pointer"
                onClick={() => setIsMobileDetailOpen(false)}
              >
                <div className={`w-12 h-1.5 rounded-full ${
                  isDarkMode ? 'bg-slate-700' : 'bg-slate-300'
                }`} />
              </div>
              
              <div className="p-4 overflow-y-auto">
                {renderInspectorContent(selectedOrder, true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
