'use client';

import React from 'react';
import DemoSidebar from '@/components/layout/DemoSidebar';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800" dir="rtl">
      <DemoSidebar />
      <main className="lg:mr-64 pt-14 lg:pt-0 p-3 lg:p-4">
        {children}
      </main>
    </div>
  );
}
