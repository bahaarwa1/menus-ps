'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DemoSidebar from '@/components/layout/DemoSidebar';
import { 
  Minus, Square, X, Search, LogOut
} from 'lucide-react';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [liveTime, setLiveTime] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [isMaximized, setIsMaximized] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('ar-PS', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setLiveDate(now.toLocaleDateString('ar-PS', { day: 'numeric', month: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const taskbarApps = [
    { href: '/demo', label: 'لوحة الإدارة', icon: '🏠', active: pathname === '/demo' },
    { href: '/demo/orders', label: 'الطلبات الحية', icon: '📋', active: pathname.startsWith('/demo/orders') },
    { href: '/demo/menu-editor', label: 'تعديل المنيو', icon: '🍔', active: pathname.startsWith('/demo/menu-editor') },
    { href: '/demo/tables', label: 'إدارة الطاولات', icon: '🪑', active: pathname.startsWith('/demo/tables') },
    { href: '/demo/dashboard', label: 'التقارير المالية', icon: '📈', active: pathname.startsWith('/demo/dashboard') },
    { href: '/staff', label: 'شاشة المطبخ (KDS)', icon: '👨‍🍳', targetBlank: true },
    { href: '/m', label: 'منيو الجوال', icon: '📱', targetBlank: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-800 font-sans selection:bg-orange-500 selection:text-white" dir="rtl">
      
      {/* Sidebar on desktop */}
      <DemoSidebar />

      {/* Main OS Desktop Window Container */}
      <div className="lg:mr-64 flex flex-col min-h-screen bg-slate-100/95 pb-16">
        
        {/* ============================================================
            1. WINDOWS 11 MICA TITLE BAR (شريط عنوان نافذة ويندوز 11)
        ============================================================ */}
        <header className="sticky top-0 z-30 bg-slate-900 text-slate-200 border-b border-slate-800/90 px-3 sm:px-4 py-2 flex items-center justify-between shadow-md select-none">
          <div className="flex items-center gap-2 min-w-0">
            {/* Windows Logo Icon */}
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
              🪟
            </div>
            
            <div className="truncate flex items-center gap-2">
              <span className="text-xs font-black text-white truncate">
                Menus.ps OS 11 Pro — Burger House (فرع نابلس)
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                سحابي مباشر 100%
              </span>
            </div>
          </div>

          {/* Windows Title Bar Controls: Minimize, Maximize, Close */}
          <div className="flex items-center gap-1 shrink-0 -ml-1 sm:ml-0">
            <button 
              title="تصغير"
              className="w-8 h-6 flex items-center justify-center hover:bg-slate-800 active:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors text-xs"
            >
              <Minus size={13} />
            </button>
            <button 
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "استعادة" : "تكبير"}
              className="w-8 h-6 flex items-center justify-center hover:bg-slate-800 active:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors text-xs"
            >
              <Square size={11} />
            </button>
            <Link 
              href="/"
              title="إغلاق والعودة للرئيسية"
              className="w-8 h-6 flex items-center justify-center hover:bg-rose-600 active:bg-rose-700 text-slate-400 hover:text-white rounded transition-colors text-xs"
            >
              <X size={14} />
            </Link>
          </div>
        </header>

        {/* ============================================================
            2. MAIN WORKSPACE VIEWPORT
        ============================================================ */}
        <main className="flex-1 p-3 sm:p-5">
          {children}
        </main>
      </div>

      {/* ============================================================
          3. WINDOWS 11 TASKBAR (شريط مهام ويندوز 11 التفاعلي بالأسفل)
      ============================================================ */}
      <footer className="fixed bottom-0 inset-x-0 z-50 h-12 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-3 sm:px-4 flex items-center justify-between text-white shadow-2xl select-none">
        
        {/* Right / Center: Start Button + Pinned App Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Windows Start Button */}
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-black transition-all active:scale-95 shadow-xs ${
              startMenuOpen 
                ? 'bg-sky-500 text-white shadow-sky-500/30 ring-2 ring-sky-400/30' 
                : 'bg-sky-600/90 hover:bg-sky-500 text-white'
            }`}
          >
            <span className="text-sm">🪟</span>
            <span className="hidden sm:inline">ابدأ</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Quick Pinned Apps with active bottom indicator */}
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {taskbarApps.map((app, idx) => (
              <Link
                key={idx}
                href={app.href}
                target={app.targetBlank ? '_blank' : undefined}
                className={`relative px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  app.active
                    ? 'bg-white/15 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={app.label}
              >
                <span className="text-sm">{app.icon}</span>
                <span className="hidden md:inline text-[11px]">{app.label}</span>
                {app.active && (
                  <span className="absolute -bottom-1 inset-x-2 h-0.5 bg-sky-400 rounded-full" />
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Left: System Tray (الصوت، الشبكة، الساعة الحية) */}
        <div className="flex items-center gap-2 sm:gap-3 text-slate-300 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-slate-800/60 text-[11px]">
            <span title="سحابي متصل">📶</span>
            <span title="التنبيه الصوتي مفعّل">🔊</span>
            <span className="font-bold text-slate-300">🇵🇸 فلسطين</span>
          </div>

          <div className="text-left text-[11px] leading-tight font-medium px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors cursor-default">
            <p className="font-black text-white text-[11px]">{liveTime || '12:00:00 م'}</p>
            <p className="text-[10px] text-slate-400">{liveDate || '11/09/2026'}</p>
          </div>
        </div>
      </footer>

      {/* ============================================================
          4. WINDOWS 11 START MENU FLYOUT (قائمة ابدأ المنبثقة)
      ============================================================ */}
      {startMenuOpen && (
        <div 
          onClick={() => setStartMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-14 right-4 sm:right-10 w-[92vw] sm:w-[420px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white font-sans text-right animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            {/* Start Menu Header Search */}
            <div className="relative mb-4">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث عن تطبيق، إعداد، أو صنف..." 
                className="w-full bg-slate-800/90 border border-slate-700 text-xs font-bold text-white rounded-xl pl-3 pr-9 py-2 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Pinned Applications Grid */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-black text-slate-400 mb-2 px-1">
                <span>التطبيقات المثبتة في النظام</span>
                <span className="text-[10px] text-sky-400 cursor-pointer hover:underline">الكل (12)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <Link 
                  href="/demo" 
                  onClick={() => setStartMenuOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-1 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🏠</span>
                  <span className="text-[11px] font-bold text-slate-200">لوحة التحكم</span>
                </Link>

                <Link 
                  href="/demo/orders" 
                  onClick={() => setStartMenuOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-1 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
                  <span className="text-[11px] font-bold text-slate-200">الطلبات الحية</span>
                </Link>

                <Link 
                  href="/staff" 
                  target="_blank"
                  onClick={() => setStartMenuOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-1 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">👨‍🍳</span>
                  <span className="text-[11px] font-bold text-slate-200">شاشة المطبخ</span>
                </Link>

                <Link 
                  href="/m" 
                  target="_blank"
                  onClick={() => setStartMenuOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-1 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📱</span>
                  <span className="text-[11px] font-bold text-slate-200">منيو الجوال</span>
                </Link>

                <Link 
                  href="/demo/menu-editor" 
                  onClick={() => setStartMenuOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-1 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🍔</span>
                  <span className="text-[11px] font-bold text-slate-200">تعديل المنيو</span>
                </Link>

                <Link 
                  href="/demo/dashboard" 
                  onClick={() => setStartMenuOpen(false)}
                  className="p-2.5 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-1 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                  <span className="text-[11px] font-bold text-slate-200">التقارير</span>
                </Link>
              </div>
            </div>

            {/* Bottom User Bar & Power */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-xs shadow-inner">
                  BH
                </div>
                <div>
                  <p className="font-black text-white text-xs">Burger House نابلس</p>
                  <p className="text-[10px] text-slate-400">مدير النظام (Admin)</p>
                </div>
              </div>

              <Link
                href="/login"
                onClick={() => setStartMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut size={16} />
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
