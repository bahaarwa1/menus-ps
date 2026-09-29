import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';

const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "خميس - شيشة ومنقوشة | قائمة الطعام الرقمية",
  description: "قائمة طعام مطعم وكافيه شيشة ومنقوشة - خميس منذ 1930. قائمة المأكولات والمشروبات والحلويات والشيشة.",
  icons: {
    icon: "/assets/logo.png",
  },
};

export default function KhameesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${tajawal.variable} ${tajawal.className}`} style={{ fontFamily: 'var(--font-tajawal), Tajawal, sans-serif' }}>
      {children}
    </div>
  );
}
