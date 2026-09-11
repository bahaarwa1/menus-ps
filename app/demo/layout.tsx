'use client';

import React from 'react';
import DemoSidebar from '@/components/layout/DemoSidebar';
import { useLanguage } from '@/context/LanguageContext';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useLanguage();

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-orange-500 selection:text-white" 
      dir={direction}
    >
      {/* Sidebar navigation */}
      <DemoSidebar />

      {/* Main Workspace Viewport without any simulated OS window frames or taskbars */}
      <div className={`flex flex-col min-h-screen pt-14 lg:pt-0 ${direction === 'rtl' ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <main className="flex-1 p-3 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
