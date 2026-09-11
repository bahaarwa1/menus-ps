import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Menus.ps — منيو رقمي وطلبات ذكية للمطاعم | Smart Restaurant QR Menus",
  description: "حوّل مطعمك لتجربة رقمية كاملة مع منيو QR، طلبات ذكية، شاشة مطبخ، وتحليلات متقدمة",
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
    <html lang="ar" dir="rtl" className={ibmPlexArabic.className}>
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
