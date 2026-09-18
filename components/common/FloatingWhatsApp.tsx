'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { X, MessageCircle } from 'lucide-react';

const WHATSAPP_LINK = 'https://api.whatsapp.com/message/OOPIRMKVJC46J1';

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const { language, direction } = useLanguage();
  const isRtl = direction === 'rtl';

  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Automatically show the greeting tooltip after 2.5s and hide after 12s on first visit
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2500);

    const autoHide = setTimeout(() => {
      setShowTooltip(false);
    }, 14000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHide);
    };
  }, []);

  // Do not display on standalone customer menus, staff KDS, or full-screen embed pages
  if (
    pathname.startsWith('/r/') ||
    pathname === '/m' ||
    pathname.startsWith('/staff')
  ) {
    return null;
  }

  return (
    <aside
      aria-label="WhatsApp Contact"
      className={`fixed bottom-5 sm:bottom-6 z-50 flex items-end gap-3 ${
        isRtl ? 'left-4 sm:left-6 flex-row' : 'right-4 sm:right-6 flex-row-reverse'
      }`}
    >
      {/* Interactive Floating Tooltip / Speech Bubble */}
      {showTooltip && (
        <div 
          className="relative bg-white text-slate-900 rounded-2xl shadow-xl shadow-slate-900/15 border border-slate-100 p-3 max-w-[240px] sm:max-w-[270px] animate-in fade-in slide-in-from-bottom-3 duration-200"
          dir={direction}
        >
          {/* Close tiny button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="absolute top-2 left-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="إغلاق التنبيه"
          >
            <X size={12} />
          </button>

          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <MessageCircle size={16} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900">
                  {language === 'ar' ? 'فريق Menus.cool' : 'Menus.cool Team'}
                </span>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {language === 'ar' ? 'متصل الآن' : 'Online'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 leading-snug">
                {language === 'ar'
                  ? 'أي استفسار عن مميزات المنيو والأسعار؟ تواصل معنا مباشرة عبر واتساب!'
                  : 'Have questions about features or pricing? Chat directly with us on WhatsApp!'}
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-300 pt-0.5"
              >
                <span>{language === 'ar' ? 'ابدأ المحادثة الآن ←' : 'Start chat now →'}</span>
              </a>
            </div>
          </div>

          {/* Speech Bubble Arrow */}
          <div 
            className={`absolute bottom-3 w-2.5 h-2.5 bg-white border-b border-slate-100 rotate-45 ${
              isRtl ? '-left-1.5 border-l' : '-right-1.5 border-r'
            }`}
          />
        </div>
      )}

      {/* Main Floating WhatsApp Action Button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا عبر واتساب"
        onMouseEnter={() => setShowTooltip(true)}
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#2bd96e] text-white shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        {/* Glowing Pulse Ring */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-40 animate-ping pointer-events-none group-hover:opacity-0" />

        {/* Live Status Green Dot */}
        <span className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-400 border-2 border-white shadow-xs"></span>
        </span>

        {/* Official WhatsApp SVG Icon */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current drop-shadow-sm group-hover:rotate-6 transition-transform duration-200"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </aside>
  );
}
