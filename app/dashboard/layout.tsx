import React from 'react';
import { cookies } from 'next/headers';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import ProductionSidebar from '@/components/layout/ProductionSidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  const restaurantName = session?.name || 'مطعمي';
  const restaurantSlug = session?.restaurantSlug || 'my-restaurant';

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-orange-500 selection:text-white" 
      dir="rtl"
    >
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
