'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Menu, X, ExternalLink, LogOut, 
  Copy, Check, ChefHat, 
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

  const [appOrigin, setAppOrigin] = useState('https://menus-ps.vercel.app');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppOrigin(window.location.origin);
      const params = new URLSearchParams(window.location.search);
      const created = params.get('created');
      if (created) {
        setActiveSlug(created);
        setActiveName(created.replace(/-/g, ' '));
      }
    }
  }, [pathname]);

  const liveUrl = `${appOrigin}/r/${activeSlug}`;
  const directMenuUrl = `/r/${activeSlug}`;

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
    <div className="flex flex-col h-full bg-white font-sans text-slate-800 select-none" dir={direction}>
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <Logo size="sm" href="/dashboard" />
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-bold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>متصل حي</span>
        </span>
      </div>

      {/* Restaurant Overview Card */}
      <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
            {activeName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-sm truncate capitalize leading-tight text-white">{activeName}</h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">الفرع الرئيسي — {city}</p>
          </div>
        </div>

        {/* Live URL Snippet */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/10 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 pr-1">
            <span className="text-[10px] text-white/60 block font-semibold">رابط المنيو السريع:</span>
            <span className="text-[11px] font-mono text-orange-200 truncate block dir-ltr" dir="ltr">
              /r/{activeSlug}
            </span>
          </div>
          <button
            onClick={copyLiveUrl}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer shrink-0"
            title="نسخ الرابط"
          >
            {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Quick Launch Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <a
            href={directMenuUrl}
            target="_blank"
            className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
          >
            <span>منيو الزبائن</span>
            <ExternalLink size={11} />
          </a>
          <Link
            href="/staff"
            target="_blank"
            className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all border border-white/10"
          >
            <ChefHat size={12} className="text-amber-300" />
            <span>المطبخ KDS</span>
          </Link>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
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
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  active 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800'
                }`}>
                  <IconComponent size={14} />
                </div>
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  active ? 'bg-orange-500 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User & Logout */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              {activeName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 truncate">{activeName}</p>
              <p className="text-[10px] text-slate-400">مالك المطعم</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono font-medium">MENUS.ps v1.0</span>
          <LanguageSwitcher variant="subtle" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 px-4 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open Menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Logo size="sm" href="/dashboard" />
          <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">
            لوحة الإدارة
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
          title="تسجيل الخروج"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 bottom-0 w-64 border-slate-200/80 bg-white z-40 ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
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
