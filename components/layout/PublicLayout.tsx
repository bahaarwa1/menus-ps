'use client';

import Navbar from '@/components/layout/Navbar';
import FloatingWhatsApp from '@/components/common/FloatingWhatsApp';
import { useLanguage } from '@/context/LanguageContext';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { direction } = useLanguage();

  return (
    <div dir={direction} className="min-h-screen transition-all">
      <Navbar />
      <main className="pt-14">
        {children}
      </main>
      <FloatingWhatsApp />
    </div>
  );
}
