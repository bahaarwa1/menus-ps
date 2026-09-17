'use client';

import React, { useState } from 'react';
import { ShieldAlert, LogOut, ArrowRight } from 'lucide-react';

interface ImpersonationBannerProps {
  restaurantName: string;
  isImpersonating: boolean;
}

export default function ImpersonationBanner({ restaurantName, isImpersonating }: ImpersonationBannerProps) {
  const [exiting, setExiting] = useState(false);

  if (!isImpersonating) return null;

  const handleExit = async () => {
    setExiting(true);
    try {
      const res = await fetch('/api/v1/admin/impersonate/exit', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        window.location.href = data.redirectTo || '/admin';
      } else {
        window.location.href = '/admin';
      }
    } catch {
      window.location.href = '/admin';
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-lg sticky top-0 z-50 text-xs border-b border-orange-400/30">
      <div className="flex items-center gap-2 font-bold">
        <ShieldAlert size={16} className="text-amber-200 animate-pulse shrink-0" />
        <span>
          وضع التقمص: أنت تتصفح لوحة تحكم <span className="bg-black/20 px-2 py-0.5 rounded-md font-black">{restaurantName}</span> بصفتك مدير المنصة الرئيسي
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 border border-white/20 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-60"
      >
        <ArrowRight size={13} />
        <span>{exiting ? 'جارٍ العودة...' : 'العودة للوحة الإدارة العامة (Admin)'}</span>
      </button>
    </div>
  );
}
