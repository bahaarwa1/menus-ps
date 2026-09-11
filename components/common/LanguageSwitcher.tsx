'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'subtle' | 'pill' | 'sidebar';
}

export default function LanguageSwitcher({ 
  className = '', 
  variant = 'pill' 
}: LanguageSwitcherProps) {
  const { language, toggleLanguage } = useLanguage();

  if (variant === 'sidebar') {
    return (
      <button
        onClick={toggleLanguage}
        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
          language === 'ar' 
            ? 'text-slate-600 hover:text-orange-600 hover:bg-orange-50' 
            : 'text-orange-600 bg-orange-50 font-black'
        } ${className}`}
        title="تغيير اللغة / Switch Language"
      >
        <div className="flex items-center gap-2">
          <Languages size={15} className="text-orange-500" />
          <span>{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold">
          {language.toUpperCase()}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 border ${
        variant === 'pill'
          ? 'bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border-slate-200 hover:border-orange-200 shadow-2xs'
          : 'text-slate-600 hover:text-orange-600 border-transparent hover:bg-slate-100'
      } ${className}`}
      title="Switch Language / تبديل اللغة"
    >
      <Languages size={14} className="text-orange-500" />
      <span>{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}
