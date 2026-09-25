import React from 'react';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import ProductionSidebar from '@/components/layout/ProductionSidebar';
import ImpersonationBanner from '@/components/layout/ImpersonationBanner';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  const restaurantName = session?.name || 'مطعمي';
  const restaurantSlug = session?.restaurantSlug || 'my-restaurant';

  const isMasterOwner =
    session?.email === 'almhtrf.information22@gmail.com' ||
    session?.email === 'admin@menus.ps' ||
    (session?.userId && session.userId.startsWith('superadmin-impersonate-'));

  const isImpersonating = Boolean(isMasterOwner && restaurantSlug !== 'platform-master');
  const isManoosha = restaurantSlug === 'sh-manoosha';

  return (
    <div 
      className={`min-h-screen bg-[#F8FAFC] text-slate-900 font-sans ${
        isManoosha
          ? 'selection:bg-[#7A1C30] selection:text-white brand-sh-manoosha'
          : 'selection:bg-orange-500 selection:text-white'
      }`}
      data-brand={isManoosha ? 'sh-manoosha' : undefined}
      dir="rtl"
    >
      {/* Super Admin Impersonation Indicator */}
      <ImpersonationBanner
        restaurantName={restaurantName}
        isImpersonating={isImpersonating}
      />

      {/* Production Sidebar */}
      <ProductionSidebar 
        restaurantName={restaurantName}
        restaurantSlug={restaurantSlug}
        city="فلسطين"
      />

      {/* Main Viewport */}
      <div className="flex flex-col min-h-screen pt-14 lg:pt-0 lg:mr-64">
        <main className="flex-1 p-3 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
