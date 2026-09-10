'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import Logo from '@/components/common/Logo';

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/how-it-works', label: 'كيف يعمل' },
  { href: '/features', label: 'المميزات' },
  { href: '/demo', label: 'الديمو' },
  { href: '/pricing', label: 'الأسعار' },
  { href: '/faq', label: 'الأسئلة الشائعة' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide navbar on demo pages, standalone mobile menu, and staff screen
  if (pathname.startsWith('/demo') || pathname === '/m' || pathname === '/staff') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 shadow-2xs">
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

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 text-xs font-black text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20"
            >
              ابدأ مجانًا
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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
                className="block px-4 py-3 text-center text-sm font-medium text-slate-600 hover:text-orange-600"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-center text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600"
              >
                ابدأ مجانًا
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
