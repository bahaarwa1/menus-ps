'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ArrowLeft, ExternalLink, LogOut, Globe, Copy, Check } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function DemoSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t, language, direction } = useLanguage();

  // Get active restaurant slug from client query or fallback
  const [activeSlug, setActiveSlug] = useState('burger-house');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const created = params.get('created');
      if (created) {
        setActiveSlug(created);
      }
    }
  }, [pathname]);

  const liveUrl = `https://${activeSlug}.menus.cool`;
  const directMenuUrl = `/m?restaurant=${activeSlug}`;

  const copyLiveUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mainLinks = [
    { href: '/demo', label: t('demo.overview', 'نظرة عامة'), icon: '🏠' },
    { href: '/demo/orders', label: t('demo.orders', 'إدارة الطلبات الحية'), icon: '📋', badge: language === 'ar' ? '3 جديدة' : '3 New' },
    { href: '/demo/menu-editor', label: t('demo.menuEditor', 'تعديل قائمة الطعام'), icon: '🍔' },
    { href: '/demo/tables', label: t('demo.tables', 'إدارة الطاولات وQR'), icon: '🪑' },
    { href: directMenuUrl, label: t('demo.customerMenu', 'منيو العميل للجوال'), icon: '📱', targetBlank: true },
  ];

  const managementLinks = [
    { href: '/demo/dashboard', label: t('demo.analytics', 'التقارير والتحليلات'), icon: '📈' },
    { href: '/demo/offers', label: t('demo.offers', 'العروض والخصومات'), icon: '🎁' },
    { href: '/demo/branches', label: t('demo.branches', 'إدارة الفروع'), icon: '🏢' },
    { href: '/demo/settings', label: t('demo.settings', 'إعدادات المطعم'), icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    if (href === '/demo') return pathname === '/demo';
    return pathname.startsWith(href) && href !== '/demo';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const isRtl = direction === 'rtl';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white font-sans text-slate-800" dir={direction}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Logo size="sm" href="/demo" />
        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
          {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
        </span>
      </div>

      {/* Restaurant Info & Live Link Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs mb-2">
          <div>
            <p className="font-extrabold text-slate-900 capitalize">{activeSlug.replace(/-/g, ' ')}</p>
            <p className="text-[11px] text-slate-400">
              {language === 'ar' ? 'الفرع الرئيسي' : 'Main Branch'}
            </p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="متصل"></span>
        </div>

        {/* Live URL Pill */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-2 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Globe size={11} className="text-orange-500" />
              <span>رابط منيو الزبائن:</span>
            </span>
            <button
              onClick={copyLiveUrl}
              className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
            </button>
          </div>
          <a
            href={directMenuUrl}
            target="_blank"
            className="text-[11px] font-mono font-bold text-slate-700 hover:text-orange-600 truncate block transition-colors"
            dir="ltr"
            title="افتح منيو زبائن المطعم"
          >
            {liveUrl}
          </a>
        </div>
      </div>

      {/* Dedicated Staff Screen Launcher */}
      <div className="p-3 border-b border-slate-100 bg-orange-50/40">
        <Link
          href="/staff"
          target="_blank"
          className="flex items-center justify-between p-2.5 bg-white hover:bg-orange-500 hover:text-white text-slate-800 rounded-xl border border-orange-200/80 hover:border-orange-500 shadow-xs transition-all group"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">👨‍🍳</span>
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="text-xs font-black group-hover:text-white">
                {t('demo.staffScreen', 'شاشة موظفي التجهيز')}
              </p>
              <p className="text-[10px] text-orange-600 group-hover:text-white/80">
                {t('demo.staffScreenDesc', 'خالية من التقارير والمالية')}
              </p>
            </div>
          </div>
          <ExternalLink size={13} className="text-slate-400 group-hover:text-white shrink-0" />
        </Link>
      </div>

      {/* Main Nav */}
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        <p className="text-[11px] text-slate-400 font-bold px-3 mb-1">
          {language === 'ar' ? 'لوحة الإدارة والعمليات' : 'Operations & Live Orders'}
        </p>
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            target={link.targetBlank ? '_blank' : undefined}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              isActive(link.href)
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </div>
            {link.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${isActive(link.href) ? 'bg-white text-orange-600' : 'bg-rose-500 text-white animate-pulse'}`}>
                {link.badge}
              </span>
            )}
            {link.targetBlank && (
              <ExternalLink size={13} className="opacity-60" />
            )}
          </Link>
        ))}

        <div className="pt-3 mt-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-bold px-3 mb-1">
            {language === 'ar' ? 'التقارير والإعدادات المالية' : 'Analytics & Settings'}
          </p>
          {managementLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive(link.href)
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Language Switcher, Back to website and Logout */}
      <div className="p-3 border-t border-slate-100 space-y-1.5">
        {/* Switch Language */}
        <LanguageSwitcher variant="sidebar" />

        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors p-2 rounded-xl hover:bg-orange-50"
        >
          {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
          <span>{t('nav.backHome', 'العودة للموقع الرئيسي')}</span>
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors p-2 rounded-xl hover:bg-rose-50 ${isRtl ? 'text-right' : 'text-left'}`}
        >
          <LogOut size={15} />
          <span>{t('nav.logout', 'تسجيل الخروج')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between shadow-xs">
        <Logo size="sm" href="/demo" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="subtle" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed top-0 bottom-0 w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isRtl 
          ? `right-0 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}` 
          : `left-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
      }`}>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white shadow-xs z-30 ${
        isRtl ? 'right-0 border-l border-slate-200/80' : 'left-0 border-r border-slate-200/80'
      }`}>
        <SidebarContent />
      </div>
    </>
  );
}
