'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/common/Logo';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, direction } = useLanguage();

  const navLinks = [
    { href: '/', label: t('nav.home', 'الرئيسية') },
    { href: '/how-it-works', label: t('nav.howItWorks', 'كيف يعمل') },
    { href: '/features', label: t('nav.features', 'المميزات') },
    { href: '/pricing', label: t('nav.pricing', 'الأسعار') },
    { href: '/faq', label: t('nav.faq', 'الأسئلة الشائعة') },
  ];

  // Hide navbar on demo pages, dashboard, standalone mobile menu, and staff screen
  if (pathname.startsWith('/demo') || pathname.startsWith('/dashboard') || pathname === '/m' || pathname === '/staff') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-100 shadow-2xs" dir={direction}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Logo size="sm" />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === link.href
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Buttons + Language Switcher */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Switcher */}
            <LanguageSwitcher variant="pill" />

            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors"
            >
              {t('nav.login', 'تسجيل الدخول')}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-black text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20"
            >
              {t('nav.startFree', 'ابدأ مجانًا')}
            </Link>
          </div>

          {/* Mobile Actions: Language Switcher & Hamburger */}
          <div className="flex items-center gap-1.5 md:hidden">
            <LanguageSwitcher variant="subtle" />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  pathname === link.href
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-center text-sm font-bold text-slate-600 hover:text-orange-600"
              >
                {t('nav.login', 'تسجيل الدخول')}
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-center text-sm font-black text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-md shadow-orange-500/20"
              >
                {t('nav.startFree', 'ابدأ مجانًا')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
