'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { 
  QrCode, Smartphone, ChefHat, BarChart3, Sparkles, CheckCircle2, 
  ArrowLeft, ArrowRight, ExternalLink, ShieldCheck, Zap, TrendingUp, Clock, 
  ArrowDown, Check
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const { t, language, direction } = useLanguage();
  const isRtl = direction === 'rtl';

  // Showcase state
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'menu' | 'kitchen' | 'dashboard'>('menu');
  const [demoCartCount, setDemoCartCount] = useState(2);
  const [demoCartTotal, setDemoCartTotal] = useState(64);

  const handleAddDemoItem = (price: number) => {
    setDemoCartCount(prev => prev + 1);
    setDemoCartTotal(prev => prev + price);
  };

  const slideLabels = language === 'ar' ? [
    'الرئيسية والعرض',
    'محاكي المنتج الحي',
    'كيف يعمل النظام',
    'مميزات المنصة',
    'الأسعار والبدء'
  ] : [
    'Home & Hero',
    'Live Simulator',
    'How It Works',
    'Features',
    'Pricing & Start'
  ];

  // Scroll to slide function
  const scrollToSlide = useCallback((index: number) => {
    if (!containerRef.current) return;
    const targetIndex = Math.max(0, Math.min(slideLabels.length - 1, index));
    const slideHeight = containerRef.current.clientHeight;
    isScrollingRef.current = true;
    containerRef.current.scrollTo({
      top: targetIndex * slideHeight,
      behavior: 'smooth',
    });
    setActiveSlide(targetIndex);
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 700);
  }, [slideLabels.length]);

  // Track active slide on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      const slideHeight = container.clientHeight;
      const current = Math.round(container.scrollTop / slideHeight);
      setActiveSlide(current);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <PublicLayout>
      {/* =========================================================================
          RESPONSIVE SCROLLING CONTAINER (طبيعي ومريح على الجوال + سناب أنيق على الديسكتوب)
      ========================================================================= */}
      <div 
        ref={containerRef}
        className="w-full overflow-y-auto scroll-smooth relative selection:bg-orange-500 selection:text-white bg-slate-50 md:h-[calc(100dvh-3.5rem)] md:snap-y md:snap-mandatory hide-scrollbar"
        dir={direction}
      >


        {/* =========================================================================
            SLIDE 1: HERO SECTION (سلايد 1: البداية والعرض الرئيسي)
        ========================================================================= */}
        <section className="w-full relative flex items-center justify-center overflow-hidden py-8 sm:py-12 md:py-0 md:h-[calc(100dvh-3.5rem)] md:min-h-[580px] md:snap-start md:snap-always bg-gradient-to-b from-orange-50/50 via-white to-slate-50">
          {/* Subtle Ambient Light */}
          <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-32 w-[600px] sm:w-[900px] h-[400px] bg-gradient-to-tr from-orange-400/15 to-amber-200/20 blur-[130px] rounded-full pointer-events-none -z-10"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              
              {/* Text Side (7 cols) */}
              <div className={`lg:col-span-7 ${isRtl ? 'text-right' : 'text-left'}`}>
                
                {/* Announcement Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/90 border border-orange-200 text-orange-700 text-xs font-black mb-3 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <span>
                    {language === 'ar'
                      ? 'المنصة السحابية الأولى لإدارة المنيو والطلبات في فلسطين 🇵🇸'
                      : 'The #1 Cloud Menu & Ordering Platform in Palestine 🇵🇸'}
                  </span>
                </div>

                {/* Main Headline */}
                {language === 'ar' ? (
                  <h1 className="text-2xl sm:text-4xl lg:text-[2.85rem] font-black text-slate-900 leading-[1.22] tracking-tight mb-3">
                    حوّل مطعمك لتجربة رقمية ذكية <br className="hidden sm:inline" />
                    <span className="text-orange-500 relative inline-block">
                      تضاعف مبيعاتك
                      <svg className="absolute -bottom-1.5 inset-x-0 w-full text-orange-400/40" viewBox="0 0 250 12" fill="none">
                        <path d="M2 9C50 2 150 2 248 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </span> وتلغي طوابير الانتظار
                  </h1>
                ) : (
                  <h1 className="text-2xl sm:text-4xl lg:text-[2.85rem] font-black text-slate-900 leading-[1.22] tracking-tight mb-3">
                    Transform Your Restaurant With <br className="hidden sm:inline" />
                    <span className="text-orange-500 relative inline-block">
                      Smart Digital Menus
                      <svg className="absolute -bottom-1.5 inset-x-0 w-full text-orange-400/40" viewBox="0 0 250 12" fill="none">
                        <path d="M2 9C50 2 150 2 248 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    </span> & Instant QR Orders
                  </h1>
                )}

                {/* Plain-Language Subtitle */}
                <p className="text-xs sm:text-base text-slate-600 font-medium leading-relaxed mb-5 max-w-xl">
                  {language === 'ar'
                    ? 'منيو رقمي فائق السرعة بكود QR لكل طاولة، مزامنة مباشرة بلحظة مع شاشة المطبخ، ومساعد ذكاء اصطناعي لرفع المبيعات — بدون شراء أي أجهزة جديدة.'
                    : 'Ultra-fast digital menu with dedicated QR code per table, real-time kitchen screen sync, and AI upselling tools — zero new hardware required.'}
                </p>

                {/* 4 Core Value Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 max-w-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200/90 px-2.5 py-2 rounded-xl shadow-2xs">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>{language === 'ar' ? 'كود QR لكل طاولة' : 'QR for every table'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200/90 px-2.5 py-2 rounded-xl shadow-2xs">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>{language === 'ar' ? 'بدون تنزيل تطبيق' : 'No app required'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200/90 px-2.5 py-2 rounded-xl shadow-2xs">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>{language === 'ar' ? 'يصل للمطبخ فوراً' : 'Instant kitchen sync'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200/90 px-2.5 py-2 rounded-xl shadow-2xs">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span>{language === 'ar' ? '0 ₪ تكلفة أجهزة' : '0 ₪ hardware cost'}</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/m"
                    target="_blank"
                    className="w-full sm:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
                  >
                    <Smartphone size={16} />
                    <span>{language === 'ar' ? '📱 جرّب المنيو كزبون (ديمو حي)' : '📱 Test Customer Menu (Live)'}</span>
                    {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                  </Link>

                  <Link
                    href="/staff"
                    target="_blank"
                    className="w-full sm:w-auto px-5 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <ChefHat size={16} className="text-orange-400" />
                    <span>{language === 'ar' ? '👨‍🍳 شاشة المطبخ (KDS)' : '👨‍🍳 Kitchen Display (KDS)'}</span>
                  </Link>

                  <Link
                    href="/contact"
                    className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center border border-slate-300 transition-all"
                  >
                    {language === 'ar' ? 'طلب تجربة مجانية' : 'Start Free Trial'}
                  </Link>
                </div>

              </div>

              {/* Visual Side: High Quality Phone Mockup (5 cols) */}
              <div className="lg:col-span-5 flex justify-center relative">
                <div className="relative w-[280px] sm:w-[305px] max-w-full">
                  
                  {/* Subtle Glow Behind Phone */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-amber-300 rounded-[3rem] rotate-2 scale-105 opacity-25 blur-xl"></div>

                  {/* Floating Badge 1: Live QR Scan */}
                  <div className={`absolute -top-3 z-30 bg-slate-900 text-white px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 ${
                    isRtl ? '-right-3' : '-left-3'
                  }`}>
                    <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black shrink-0">
                      <QrCode size={15} />
                    </div>
                    <div className={`${isRtl ? 'text-right' : 'text-left'} leading-tight`}>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {isRtl ? 'تم مسح الكود 📲' : 'QR Code Scanned 📲'}
                      </p>
                      <p className="text-xs font-black text-white">
                        {isRtl ? 'طاولة 12 (منيو مباشر)' : 'Table 12 (Live Menu)'}
                      </p>
                    </div>
                  </div>

                  {/* Floating Badge 2: Kitchen Instant Sync */}
                  <div className={`absolute -bottom-3 z-30 bg-white text-slate-900 px-3 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-200 ${
                    isRtl ? '-left-3' : '-right-3'
                  }`}>
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className={`${isRtl ? 'text-right' : 'text-left'} leading-tight`}>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {isRtl ? 'الطلب وصل بلحظة ⚡' : 'Instant Kitchen Alert ⚡'}
                      </p>
                      <p className="text-xs font-black text-slate-900">
                        {isRtl ? 'مزامنة فورية مع المطبخ' : 'Realtime Kitchen Sync'}
                      </p>
                    </div>
                  </div>

                  {/* The Phone Container */}
                  <div className="relative bg-slate-900 border-[7px] border-slate-900 rounded-[2.7rem] shadow-2xl overflow-hidden flex flex-col aspect-[9/18.5]">
                    
                    {/* Notch */}
                    <div className="h-5 bg-slate-900 flex items-center justify-center shrink-0 z-20">
                      <div className="w-16 h-3 bg-slate-800 rounded-full flex items-center justify-end px-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                      </div>
                    </div>

                    {/* Inside Phone Screen Content */}
                    <div className={`flex-1 bg-[#f8fafc] flex flex-col overflow-hidden text-slate-800 ${isRtl ? 'text-right' : 'text-left'}`} dir={direction}>
                      
                      {/* Restaurant Header Banner */}
                      <div className="relative h-28 shrink-0 bg-slate-900 overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80" 
                          alt="Burger House" 
                          className="w-full h-full object-cover opacity-85" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                        
                        <div className="absolute bottom-2 right-3 left-3 text-white flex items-end justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-sm font-black">Burger House</span>
                              <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                                {isRtl ? 'مفتوح' : 'Open'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-bold">
                              {isRtl ? 'فرع رفيديا • طاولة 12' : 'Rafidia Branch • Table 12'}
                            </p>
                          </div>
                          <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                            {isRtl ? 'طاولة 12' : 'Table 12'}
                          </span>
                        </div>
                      </div>

                      {/* Categories Bar */}
                      <div className="bg-white p-2 border-b border-slate-200 flex gap-1.5 text-[10px] font-black shrink-0 overflow-x-auto">
                        <span className="bg-orange-500 text-white px-2.5 py-1 rounded-lg shrink-0">
                          {isRtl ? '🍔 برغر (8)' : '🍔 Burgers (8)'}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg shrink-0">
                          {isRtl ? '🍟 مقبلات' : '🍟 Sides'}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg shrink-0">
                          {isRtl ? '🥤 مشروبات' : '🥤 Drinks'}
                        </span>
                      </div>

                      {/* Food Items List */}
                      <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                        <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-xs text-slate-900 truncate">
                              {isRtl ? 'دبل سماش برغر' : 'Double Smash Burger'}
                            </p>
                            <p className="text-[9px] text-slate-400 truncate">
                              {isRtl ? 'لحم بقري، شيدر ذائبة، صوص' : 'Beef patty, melted cheddar, special sauce'}
                            </p>
                            <p className="text-xs font-black text-orange-600 mt-0.5">42 ₪</p>
                          </div>
                          <button className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            +
                          </button>
                        </div>

                        <div className="bg-white p-2 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-xs text-slate-900 truncate">
                              {isRtl ? 'تشيز بيكون فرايز' : 'Cheese Bacon Fries'}
                            </p>
                            <p className="text-[9px] text-slate-400 truncate">
                              {isRtl ? 'بطاطا مقرمشة وصوص جبنة' : 'Crispy fries with warm cheese sauce'}
                            </p>
                            <p className="text-xs font-black text-orange-600 mt-0.5">22 ₪</p>
                          </div>
                          <button className="w-7 h-7 rounded-lg bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            +
                          </button>
                        </div>
                      </div>

                      {/* Bottom Floating Bar */}
                      <div className="p-2 bg-white border-t border-slate-200 shrink-0">
                        <div className="bg-orange-500 text-white px-3 py-2 rounded-xl flex items-center justify-between shadow-xs">
                          <span className="text-xs font-black">
                            {isRtl ? 'السلة (64 ₪)' : 'Cart (64 ₪)'}
                          </span>
                          <span className="text-[10px] font-bold bg-orange-600 px-2 py-0.5 rounded-md">
                            {isRtl ? 'إرسال للمطبخ ⬅' : 'Send to Kitchen ➔'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Clean Scroll Indicator */}
          <button 
            onClick={() => scrollToSlide(1)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-slate-400 hover:text-orange-500 transition-colors z-20 cursor-pointer"
          >
            <span className="text-[10px] font-bold tracking-widest uppercase mb-0.5">SCROLL</span>
            <ArrowDown size={14} />
          </button>
        </section>


        {/* =========================================================================
            SLIDE 2: WINDOWS 11 DESKTOP SIMULATOR (سلايد 2: محاكي نظام ويندوز المتطور)
        ========================================================================= */}
        <section className="w-full relative flex flex-col justify-center items-center bg-slate-950 text-white overflow-hidden py-10 sm:py-14 md:py-0 md:h-[calc(100dvh-3.5rem)] md:min-h-[580px] md:snap-start md:snap-always p-3 sm:p-6">
          
          <div className="text-center max-w-2xl mx-auto mb-3 z-10">
            <span className="bg-sky-500/20 text-sky-400 text-xs font-black px-3.5 py-1 rounded-full mb-1.5 inline-flex items-center gap-1.5 border border-sky-500/30">
              <span>🪟</span>
              <span>
                {isRtl ? 'واجهة وتجربة سطح مكتب ويندوز 11 المتطورة' : 'Modern Windows 11 Desktop Experience'}
              </span>
            </span>
            <h2 className="text-xl sm:text-3xl font-black mb-1">
              {isRtl 
                ? 'نظام تشغيل متكامل لمطعمك في شاشة واحدة' 
                : 'A Complete Operating System for Your Restaurant in One Screen'}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              {isRtl 
                ? 'تحكم بالمنيو، راقب المطبخ لحظة بلحظة، وتابع حركة الكاشير كما لو كنت على كمبيوتر ويندوز' 
                : 'Manage your menu, monitor the kitchen in real-time, and track cashier KPIs just like a desktop OS'}
            </p>
          </div>

          {/* Windows 11 Application Window Frame */}
          <div className="w-full max-w-4xl bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col z-10" dir={direction}>
            
            {/* Windows 11 Title Bar */}
            <div className="bg-slate-950 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs select-none">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs shrink-0">
                  🪟
                </div>
                <span className="font-extrabold text-white text-[11px] sm:text-xs truncate">
                  {isRtl 
                    ? 'Menus.ps Windows OS — مركز إدارة المطاعم الموحد (Burger House نابلس)' 
                    : 'Menus.ps Windows OS — Unified Restaurant Command Center (Burger House Nablus)'}
                </span>
              </div>

              {/* Windows Window Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-6 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-800 rounded text-xs cursor-pointer">—</span>
                <span className="w-6 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-800 rounded text-xs cursor-pointer">🗖</span>
                <span className="w-6 h-5 flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white rounded text-xs cursor-pointer">✕</span>
              </div>
            </div>

            {/* App Tabs inside the Windows Window */}
            <div className="px-3 pt-3 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3.5 py-1.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-t-2 ${
                  activeTab === 'menu' 
                    ? 'bg-slate-950 text-white border-orange-500 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <Smartphone size={14} className="text-orange-400" />
                <span>{isRtl ? '1. منيو العميل للجوال' : '1. Customer Mobile Menu'}</span>
              </button>

              <button
                onClick={() => setActiveTab('kitchen')}
                className={`px-3.5 py-1.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-t-2 ${
                  activeTab === 'kitchen' 
                    ? 'bg-slate-950 text-white border-orange-500 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <ChefHat size={14} className="text-amber-400" />
                <span>{isRtl ? '2. شاشة المطبخ (KDS)' : '2. Kitchen Display (KDS)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border-t-2 ${
                  activeTab === 'dashboard' 
                    ? 'bg-slate-950 text-white border-orange-500 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <BarChart3 size={14} className="text-emerald-400" />
                <span>{isRtl ? '3. لوحة الكاشير والـ KPI' : '3. Cashier & KPI Dashboard'}</span>
              </button>
            </div>

            {/* Window Content Area */}
            <div className="p-3 sm:p-5 bg-slate-950 min-h-[290px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {activeTab === 'menu' && (
                  <motion.div
                    key="sim-menu"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full max-w-md bg-white text-slate-900 rounded-2xl p-3.5 shadow-xl ${isRtl ? 'text-right' : 'text-left'}`}
                    dir={direction}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                      <div>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900">
                          {isRtl ? 'منيو طاولة 12 (تجربة تفاعلية)' : 'Table 12 Menu (Interactive Demo)'}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {isRtl ? 'انقر على (+) لتجربة إضافة الوجبة للسلة فوراً' : 'Click (+) to add an item to the cart instantly'}
                        </p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {isRtl ? 'مباشر' : 'Live'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-black text-xs text-slate-900">
                            {isRtl ? 'دبل سماش برغر فاخر' : 'Deluxe Double Smash Burger'}
                          </p>
                          <span className="text-xs font-black text-orange-600">42 ₪</span>
                        </div>
                        <button 
                          onClick={() => handleAddDemoItem(42)}
                          className="px-2.5 py-1 bg-orange-500 text-white rounded-lg text-xs font-black active:scale-90 transition-transform cursor-pointer"
                        >
                          {isRtl ? '+ أضف' : '+ Add'}
                        </button>
                      </div>

                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-black text-xs text-slate-900">
                            {isRtl ? 'تشيز بيكون فرايز مقرمش' : 'Crispy Cheese Bacon Fries'}
                          </p>
                          <span className="text-xs font-black text-orange-600">22 ₪</span>
                        </div>
                        <button 
                          onClick={() => handleAddDemoItem(22)}
                          className="px-2.5 py-1 bg-orange-500 text-white rounded-lg text-xs font-black active:scale-90 transition-transform cursor-pointer"
                        >
                          {isRtl ? '+ أضف' : '+ Add'}
                        </button>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-100 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {demoCartCount} {isRtl ? 'أصناف بالسلة' : 'items in cart'}
                        </span>
                        <span className="text-sm font-black text-slate-900">{demoCartTotal} ₪</span>
                      </div>
                      <Link
                        href="/m"
                        target="_blank"
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <span>{isRtl ? 'فتح المنيو الكامل' : 'Open Full Menu'}</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'kitchen' && (
                  <motion.div
                    key="sim-kitchen"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full grid sm:grid-cols-3 gap-2.5 ${isRtl ? 'text-right' : 'text-left'}`}
                    dir={direction}
                  >
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                      <span className="text-xs font-black text-rose-400 block mb-1.5">
                        {isRtl ? 'جديد (2)' : 'New (2)'}
                      </span>
                      <div className="bg-slate-800 p-2.5 rounded-lg text-white">
                        <div className="flex justify-between text-xs font-black mb-1">
                          <span className="text-orange-400">#4241</span>
                          <span className="bg-slate-700 px-1.5 rounded text-[10px]">
                            {isRtl ? 'طاولة 7' : 'Table 7'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {isRtl ? '2x دبل سماش برغر' : '2x Double Smash Burger'}
                        </p>
                        <span className="text-[9px] text-rose-400 block mt-1">
                          {isRtl ? 'تنبيه صوتي رن 🛎️' : 'Audio chime triggered 🛎️'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                      <span className="text-xs font-black text-amber-400 block mb-1.5">
                        {isRtl ? 'قيد التحضير (1)' : 'In Progress (1)'}
                      </span>
                      <div className="bg-slate-800 p-2.5 rounded-lg text-white">
                        <div className="flex justify-between text-xs font-black mb-1">
                          <span className="text-orange-400">#4240</span>
                          <span className="bg-slate-700 px-1.5 rounded text-[10px]">
                            {isRtl ? 'طاولة 12' : 'Table 12'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {isRtl ? '1x كلاسيك برغر فاخر' : '1x Classic Burger'}
                        </p>
                        <span className="text-[9px] text-amber-400 block mt-1">
                          {isRtl ? 'جاري الشوي' : 'Currently grilling'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                      <span className="text-xs font-black text-emerald-400 block mb-1.5">
                        {isRtl ? 'جاهز للتسليم (1)' : 'Ready to Serve (1)'}
                      </span>
                      <div className="bg-slate-800 p-2.5 rounded-lg text-white">
                        <div className="flex justify-between text-xs font-black mb-1">
                          <span className="text-orange-400">#4239</span>
                          <span className="bg-slate-700 px-1.5 rounded text-[10px]">
                            {isRtl ? 'طاولة 4' : 'Table 4'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {isRtl ? '3x تشيكن كريسبي' : '3x Crispy Chicken'}
                        </p>
                        <span className="text-[9px] text-emerald-400 block mt-1">
                          {isRtl ? 'جاهز على الصينية' : 'Ready on tray'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'dashboard' && (
                  <motion.div
                    key="sim-dashboard"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${isRtl ? 'text-right' : 'text-left'}`}
                    dir={direction}
                  >
                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isRtl ? 'مبيعات اليوم' : "Today's Sales"}
                      </span>
                      <span className="text-lg font-black text-white">3,350 ₪</span>
                      <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                        {isRtl ? '+12.5% نمو' : '+12.5% growth'}
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isRtl ? 'طلبات QR' : 'QR Orders'}
                      </span>
                      <span className="text-lg font-black text-orange-400">72%</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        {isRtl ? '43 طلب مباشر' : '43 direct orders'}
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isRtl ? 'متوسط الطلب' : 'Average Order'}
                      </span>
                      <span className="text-lg font-black text-white">76.8 ₪</span>
                      <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                        {isRtl ? '+18% عبر الإضافات' : '+18% via add-ons'}
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">
                        {isRtl ? 'إشغال الصالة' : 'Floor Occupancy'}
                      </span>
                      <span className="text-lg font-black text-emerald-400">9 / 15</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">
                        {isRtl ? 'طاولات نشطة' : 'active tables'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Windows 11 Taskbar at Bottom of Window */}
            <div className="bg-slate-950 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs text-white select-none">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-sky-600 text-white font-black text-xs flex items-center gap-1 shadow-xs">
                  🪟 <span className="hidden sm:inline">{isRtl ? 'ابدأ' : 'Start'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
                  {isRtl ? 'متصل بـ Burger House Nablus' : 'Connected to Burger House Nablus'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-medium">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isRtl ? 'سحابي نشط' : 'Cloud Active'}
                </span>
                <span>🇵🇸 {isRtl ? 'فلسطين' : 'Palestine'}</span>
              </div>
            </div>

          </div>

          <button 
            onClick={() => scrollToSlide(2)}
            className="mt-4 flex flex-col items-center animate-bounce text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5">
              {isRtl ? 'اسحب للأسفل' : 'SCROLL DOWN'}
            </span>
            <ArrowDown size={14} />
          </button>
        </section>


        {/* =========================================================================
            SLIDE 3: HOW IT WORKS (سلايد 3: كيف يعمل النظام)
        ========================================================================= */}
        <section className="w-full relative flex flex-col justify-center items-center bg-white py-12 md:py-0 md:h-[calc(100dvh-3.5rem)] md:min-h-[580px] md:snap-start md:snap-always p-4 sm:p-6 border-y border-slate-100">
          <div className="container mx-auto max-w-6xl text-center">
            
            <div className="max-w-xl mx-auto mb-8">
              <span className="bg-orange-100 text-orange-700 text-xs font-black px-3.5 py-1 rounded-full mb-2 inline-block">
                {isRtl ? 'سرعة وسهولة متناهية' : 'Effortless & Fast'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                {isRtl ? 'ثلاث خطوات تريحك وتريح زبونك' : 'Three Simple Steps for You & Your Guests'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                {isRtl 
                  ? 'النظام مصمم ليعمل بدون تدريب معقد أو شراء أي أجهزة جديدة' 
                  : 'Designed to work smoothly without complicated training or costly new hardware'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-8">
              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 text-center hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-4 shadow-md shadow-orange-500/25">
                  1
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1.5">
                  {isRtl ? 'اطبع ستاند الـ QR للطاولات' : 'Print Table QR Stands'}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {isRtl 
                    ? 'أنشئ واطبع ستاند أنيق بكود مشفر خاص بكل طاولة بنقرة واحدة من لوحة التحكم.' 
                    : 'Generate and print stylish encrypted QR code stands for each table with one click from the dashboard.'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 text-center hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-4 shadow-md shadow-orange-500/25">
                  2
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1.5">
                  {isRtl ? 'الزبون يمسح ويطلب بجواله' : 'Guest Scans & Orders on Phone'}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {isRtl 
                    ? 'يفتح المنيو بكاميرا هاتفه فوراً بدون تحميل تطبيق، يختار وجباته ويرسل الطلب.' 
                    : 'Opens the digital menu instantly with their phone camera without downloading an app, selects meals, and places orders.'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 text-center hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg mx-auto mb-4 shadow-md shadow-orange-500/25">
                  3
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1.5">
                  {isRtl ? 'يصل للمطبخ فوراً مع نغمة تنبيه' : 'Instant Kitchen Alert with Chime'}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {isRtl 
                    ? 'يظهر الطلب على شاشة المطبخ والكاشير بصوت تنبيه فوري، ويبدأ التحضير.' 
                    : 'Orders appear instantly on kitchen and cashier screens with sound alerts to start prep immediately.'}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl max-w-4xl mx-auto">
              <div>
                <p className="text-xl sm:text-2xl font-black text-orange-500">+35%</p>
                <p className="text-[11px] font-bold text-slate-600">
                  {isRtl ? 'زيادة بالفاتورة' : 'Higher Check Size'}
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">0 {isRtl ? 'ثوانٍ' : 'sec'}</p>
                <p className="text-[11px] font-bold text-slate-600">
                  {isRtl ? 'انتظار المنيو' : 'Menu Wait Time'}
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-orange-500">100%</p>
                <p className="text-[11px] font-bold text-slate-600">
                  {isRtl ? 'دقة الطلبات' : 'Order Accuracy'}
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-slate-900">0 ₪</p>
                <p className="text-[11px] font-bold text-slate-600">
                  {isRtl ? 'أجهزة إضافية' : 'Hardware Cost'}
                </p>
              </div>
            </div>

          </div>

          <button 
            onClick={() => scrollToSlide(3)}
            className="mt-4 flex flex-col items-center animate-bounce text-slate-400 hover:text-orange-500 transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5">
              {isRtl ? 'اسحب للمميزات' : 'SCROLL TO FEATURES'}
            </span>
            <ArrowDown size={14} />
          </button>
        </section>


        {/* =========================================================================
            SLIDE 4: FEATURES BENTO SHOWCASE (سلايد 4: المميزات والتقنيات)
        ========================================================================= */}
        <section className="w-full relative flex flex-col justify-center items-center bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 p-4 sm:p-6 overflow-hidden py-12 md:py-0 md:h-[calc(100dvh-3.5rem)] md:min-h-[580px] md:snap-start md:snap-always border-y border-slate-200/60">
          
          <div className="text-center max-w-xl mx-auto mb-6 z-10">
            <span className="bg-orange-50 text-orange-600 text-xs font-black px-3.5 py-1 rounded-full mb-2.5 inline-block border border-orange-200/90 shadow-2xs">
              {isRtl ? 'تقنيات عالمية بمطعمك' : 'World-Class Restaurant Tech'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1.5 tracking-tight">
              {isRtl ? 'مبني بأحدث معايير الأمان والسرعة' : 'Built for Speed & Enterprise Security'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">
              {isRtl 
                ? 'يجمع بين سرعة منيو الـ QR وقوة نظام إدارة المطاعم المتكامل' 
                : 'Combines the agility of QR ordering with the power of an integrated restaurant OS'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full z-10">
            <div className="bg-white border border-slate-200/90 hover:border-orange-500/60 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/90 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <QrCode size={20} />
              </div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                {isRtl ? 'أكواد QR مشفرة وديناميكية' : 'Encrypted Dynamic QR Codes'}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isRtl 
                  ? 'تحمي من الطلبات الوهمية وتمنع إرسال طلبات من خارج المطعم.' 
                  : 'Protects against fraudulent orders and restricts requests strictly to seated guests.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 hover:border-orange-500/60 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/90 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Zap size={20} />
              </div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                {isRtl ? 'مزامنة فورية Realtime' : 'Realtime Kitchen Synchronization'}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isRtl 
                  ? 'يصل الطلب للمطبخ في أجزاء من الثانية مع جرس تنبيه صوتي فوري.' 
                  : 'Tickets arrive in milliseconds at the kitchen accompanied by an immediate sound chime.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 hover:border-orange-500/60 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/90 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Sparkles size={20} />
              </div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                {isRtl ? 'ذكاء اصطناعي Menus AI' : 'Menus AI Intelligence'}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isRtl 
                  ? 'تحليل ذكي للمبيعات وساعات الذروة واقتراحات رفع الأرباح بالعربي.' 
                  : 'Smart analysis of peak hours, sales trends, and automated revenue-boosting suggestions.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 hover:border-orange-500/60 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/90 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                {isRtl ? 'تحقق صارم من الأسعار' : 'Strict Price Verification'}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isRtl 
                  ? 'حساب مركزي للأسعار لمنع أي تلاعب وتأمين الفواتير بنسبة 100%.' 
                  : 'Server-authoritative price validation eliminates tampering and guarantees 100% billing accuracy.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 hover:border-orange-500/60 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/90 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <TrendingUp size={20} />
              </div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                {isRtl ? 'زيادة الفاتورة Upselling' : 'Automated Smart Upselling'}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isRtl 
                  ? 'اقتراحات إضافات تلقائية ذكية تزيد المبيعات بنسبة تصل إلى 35%.' 
                  : 'Contextual add-on recommendations that increase average guest check values by up to 35%.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 hover:border-orange-500/60 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/90 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <Clock size={20} />
              </div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 mb-1 group-hover:text-orange-600 transition-colors">
                {isRtl ? 'تحمل آلاف الزيارات بدون بطء' : 'High-Concurrency Memory Cache'}
              </h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {isRtl 
                  ? 'كاش متطور في الذاكرة يستجيب في 0ms ومُختبر لـ 1000 زائر متزامن.' 
                  : 'Advanced LRU memory cache delivers 0ms responses, stress-tested for 1,000+ simultaneous visitors.'}
              </p>
            </div>
          </div>

          <button 
            onClick={() => scrollToSlide(4)}
            className="mt-4 flex flex-col items-center animate-bounce text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-bold tracking-widest uppercase mb-0.5">
              {isRtl ? 'الأسعار' : 'PRICING'}
            </span>
            <ArrowDown size={14} />
          </button>
        </section>


        {/* =========================================================================
            SLIDE 5: PRICING & FINAL CTA (سلايد 5: الأسعار والاشتراك النهائي)
        ========================================================================= */}
        <section className="w-full relative flex flex-col justify-center items-center bg-gradient-to-b from-slate-50 to-orange-50/60 p-4 sm:p-6 py-12 md:py-0 md:h-[calc(100dvh-3.5rem)] md:min-h-[580px] md:snap-start md:snap-always">
          <div className="container mx-auto max-w-xl text-center">
            
            <div className="bg-white rounded-3xl border-2 border-orange-500 p-6 sm:p-8 shadow-2xl relative mb-6">
              <div className="absolute -top-3.5 right-1/2 translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-black shadow-sm">
                {isRtl ? 'الباقة الاحترافية الشاملة' : 'All-in-One Pro Plan'}
              </div>

              <h3 className="text-xl font-black text-slate-900 mt-2 mb-1">
                {isRtl ? 'خطة واحدة تشمل كل شيء' : 'One Plan That Covers Everything'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {isRtl ? 'بدون عمولات على المبيعات وبدون أجهزة إضافية' : '0% commission on orders and zero extra hardware'}
              </p>

              <div className="flex items-baseline justify-center gap-1 mb-5">
                <span className="text-4xl sm:text-5xl font-black text-slate-900">150</span>
                <span className="text-xl font-black text-orange-600">₪</span>
                <span className="text-xs text-slate-400 font-bold">
                  {isRtl ? '/ شهرياً' : '/ month'}
                </span>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 max-w-sm mx-auto mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>{isRtl ? 'منيو رقمي غير محدود' : 'Unlimited Digital Menu'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>{isRtl ? 'كود QR لكل طاولة' : 'QR Code per Table'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>{isRtl ? 'شاشة المطبخ (KDS)' : 'Kitchen Display (KDS)'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>{isRtl ? 'مساعد Menus AI' : 'Menus AI Assistant'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>{isRtl ? 'تحليلات المبيعات' : 'Sales Analytics'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>{isRtl ? 'دعم فني وتحديثات' : 'Tech Support & Updates'}</span>
                </div>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl font-black text-sm block shadow-md shadow-orange-500/25 transition-all"
              >
                {isRtl ? 'ابدأ تجربتك المجانية لمدة 14 يوم الآن 🚀' : 'Start 14-Day Free Trial Now 🚀'}
              </Link>
              <p className="text-[10px] text-slate-400 mt-2 font-bold">
                {isRtl ? 'إلغاء بأي وقت • بدون بطاقة ائتمان' : 'Cancel anytime • No credit card required'}
              </p>
            </div>

            {/* Direct links */}
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
              <Link href="/m" target="_blank" className="hover:text-orange-600 flex items-center gap-1">
                <Smartphone size={13} />
                <span>{isRtl ? 'ديمو منيو الزبون' : 'Customer Menu Demo'}</span>
              </Link>
              <span>•</span>
              <Link href="/staff" target="_blank" className="hover:text-orange-600 flex items-center gap-1">
                <ChefHat size={13} />
                <span>{isRtl ? 'شاشة المطبخ' : 'Kitchen Screen'}</span>
              </Link>
              <span>•</span>
              <Link href="/login" className="hover:text-orange-600 flex items-center gap-1">
                <BarChart3 size={13} />
                <span>{isRtl ? 'لوحة الإدارة' : 'Admin Login'}</span>
              </Link>
            </div>

          </div>
        </section>

      </div>

      {/* Hide Scrollbar for Pure Snap Effect */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </PublicLayout>
  );
}
