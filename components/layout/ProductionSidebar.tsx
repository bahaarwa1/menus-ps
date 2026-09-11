'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Menu, X, ExternalLink, LogOut, 
  Globe, Copy, Check, ChefHat, 
  BarChart3, Utensils, QrCode, Settings, ShoppingBag, Key
} from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

interface ProductionSidebarProps {
  restaurantName?: string;
  restaurantSlug?: string;
  city?: string;
}

export default function ProductionSidebar({ 
  restaurantName = 'مطعمي', 
  restaurantSlug = 'my-restaurant',
  city = 'فلسطين'
}: ProductionSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { direction } = useLanguage();

  const [activeSlug, setActiveSlug] = useState(restaurantSlug);
  const [activeName, setActiveName] = useState(restaurantName);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const created = params.get('created');
      if (created) {
        setActiveSlug(created);
        setActiveName(created.replace(/-/g, ' '));
      }
    }
  }, [pathname]);

  const liveUrl = `https://${activeSlug}.menus-ps.vercel.app`;
  const directMenuUrl = `/m?restaurant=${activeSlug}`;

  const copyLiveUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navLinks = [
    { href: '/dashboard', label: 'لوحة القيادة والتقارير', icon: BarChart3, exact: true },
    { href: '/dashboard/orders', label: 'الطلبات الحية للمطبخ', icon: ShoppingBag, badge: 'مباشر' },
    { href: '/dashboard/menu', label: 'إدارة قائمة الطعام', icon: Utensils },
    { href: '/dashboard/tables', label: 'الطاولات وأكواد QR', icon: QrCode },
    { href: '/dashboard/staff/codes', label: 'رموز وصول الموظفين', icon: Key },
    { href: '/dashboard/settings', label: 'إعدادات المطعم', icon: Settings },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
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
      {/* Logo & Status */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Logo size="sm" href="/dashboard" />
        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>نظام الإنتاج</span>
        </span>
      </div>

      {/* Restaurant Info & Live Link Bar */}
      <div className="p-3.5 bg-gradient-to-b from-orange-50/40 to-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="min-w-0">
            <p className="font-black text-slate-900 truncate capitalize text-sm">{activeName}</p>
            <p className="text-[11px] text-slate-400 font-medium">
              الفرع الرئيسي — {city}
            </p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" title="النظام متصل"></span>
        </div>

        {/* Live URL Pill */}
        <div className="bg-white border border-orange-200/70 rounded-xl p-2.5 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Globe size={11} className="text-orange-500" />
              <span>رابط منيو الزبائن:</span>
            </span>
            <button
              onClick={copyLiveUrl}
              className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer bg-orange-50 px-1.5 py-0.5 rounded-md transition-colors"
            >
              {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
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

      {/* Quick Launchers */}
      <div className="px-3 pt-3 grid grid-cols-2 gap-2">
        <a
          href={directMenuUrl}
          target="_blank"
          className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
        >
          <span>منيو الزبائن</span>
          <ExternalLink size={12} />
        </a>
        <Link
          href="/staff"
          target="_blank"
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
        >
          <ChefHat size={13} className="text-emerald-400" />
          <span>شاشة المطبخ</span>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
          إدارة المطعم
        </p>

        {navLinks.map((link) => {
          const active = isActive(link.href, link.exact);
          const IconComponent = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconComponent size={16} className={active ? 'text-white' : 'text-slate-400'} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  active ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
              {activeName.slice(0, 1).toUpperCase()}
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-900 truncate max-w-[110px]">{activeName}</p>
              <p className="text-[10px] text-slate-400">مالك المطعم</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-400">
          <span>MENUS.ps v1.0</span>
          <LanguageSwitcher variant="subtle" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 px-4 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Logo size="sm" href="/dashboard" />
          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
            لوحة الإدارة
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
            title="تسجيل الخروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Fixed Drawer) */}
      <aside
        className={`hidden lg:block fixed top-0 bottom-0 w-64 border-slate-200 bg-white z-40 ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={`relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 ${
              isRtl ? 'mr-0' : 'ml-0'
            }`}
          >
            <div className="absolute top-3 left-3 z-20">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
