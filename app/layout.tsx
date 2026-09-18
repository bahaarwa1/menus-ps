import type { Metadata } from "next";
import { headers } from "next/headers";
import { Readex_Pro } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const readexPro = Readex_Pro({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-readex",
});

export const metadata: Metadata = {
  title: "Menus.cool — منيو رقمي وطلبات ذكية للمطاعم | Smart Restaurant QR Menus",
  description: "حوّل مطعمك لتجربة رقمية كاملة مع منيو QR، طلبات ذكية، شاشة مطبخ، وتحليلات متقدمة",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read request nonce propagated from middleware.ts for secure CSP script hydration
  // This ensures Next.js dynamically attaches the request nonce to hydration scripts
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html lang="ar" dir="rtl" className={`${readexPro.className} ${readexPro.variable}`}>
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
