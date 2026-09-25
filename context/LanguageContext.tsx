'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.howItWorks': 'كيف يعمل',
    'nav.features': 'المميزات',
    'nav.demo': 'الديمو',
    'nav.pricing': 'الأسعار',
    'nav.faq': 'الأسئلة الشائعة',
    'nav.login': 'تسجيل الدخول',
    'nav.startFree': 'ابدأ مجانًا',
    'nav.dashboard': 'لوحة التحكم',
    'nav.backHome': 'العودة للموقع الرئيسي',
    'nav.logout': 'تسجيل الخروج',

    // Hero & Landing
    'hero.badge': 'منصة المنيو الرقمي وإدارة المطاعم الأولى في فلسطين',
    'hero.title1': 'حوّل مطعمك لتجربة رقمية كاملة',
    'hero.title2': 'منيو QR ذكي، طلبات فورية، وإدارة شاملة',
    'hero.subtitle': 'ارفع مبيعاتك بنسبة تصل إلى 35% وخفّف الضغط على طاقم العمل من خلال تجربة طلب رقمية سريعة وسلسة بدون أي تطبيقات.',
    'hero.ctaDemo': 'جرّب الديمو التفاعلي',
    'hero.ctaContact': 'ابدأ تجربتك المجانية',
    'hero.stat1': '1000+ مطعم نشط',
    'hero.stat2': '50,000+ طلب شهري',
    'hero.stat3': '35% زيادة بمتوسط الطلب',

    // Demo Dashboard & Sidebar
    'demo.title': 'لوحة الإدارة والعمليات',
    'demo.overview': 'نظرة عامة',
    'demo.orders': 'إدارة الطلبات الحية',
    'demo.menuEditor': 'تعديل قائمة الطعام',
    'demo.tables': 'إدارة الطاولات وQR',
    'demo.customerMenu': 'منيو العميل للجوال',
    'demo.analytics': 'التقارير والتحليلات',
    'demo.offers': 'العروض والخصومات',
    'demo.branches': 'إدارة الفروع',
    'demo.settings': 'إعدادات المطعم',
    'demo.staffScreen': 'شاشة موظفي التجهيز (KDS)',
    'demo.staffScreenDesc': 'خالية من التقارير والمالية',
    'demo.branchName': 'فرع نابلس الرئيسي',
    'demo.activeOrders': 'الطلبات النشطة',
    'demo.todaySales': 'إجمالي مبيعات اليوم',
    'demo.completedOrders': 'الطلبات المكتملة',
    'demo.occupancy': 'إشغال الطاولات',
    'demo.qrRatio': 'نسبة طلبات كود QR',

    // Customer Menu (/m)
    'menu.welcome': 'أهلاً بكم في',
    'menu.table': 'طاولة',
    'menu.all': 'الكل',
    'menu.burgers': 'برغر',
    'menu.sides': 'مقبلات',
    'menu.drinks': 'مشروبات',
    'menu.desserts': 'حلويات',
    'menu.add': 'أضف',
    'menu.cart': 'السلة',
    'menu.viewCart': 'عرض الطلب',
    'menu.itemsCount': 'أصناف',
    'menu.total': 'الإجمالي',
    'menu.sendOrder': 'إرسال الطلب للمطبخ',
    'menu.notes': 'ملاحظات خاصة على الطلب...',
    'menu.orderSent': 'تم إرسال طلبك بنجاح! 🎉',
    'menu.orderSentDesc': 'المطبخ يقوم بتحضير وجبتك الآن، ستصلك بأسرع وقت.',
    'menu.customization': 'التخصيص',
    'menu.extras': 'إضافات مقترحة',
    'menu.currency': '₪',
    'menu.scanInstruction': 'امسح الكود بكاميرا الجوال للطلب مباشرة',

    // Staff & Kitchen
    'staff.title': 'إدارة الطلبات الحية',
    'staff.pending': 'بانتظار التأكيد',
    'staff.preparing': 'قيد التحضير',
    'staff.ready': 'جاهز للتسليم',
    'staff.completed': 'مكتمل',
    'staff.printReceipt': 'طباعة الفاتورة',
    'staff.acceptOrder': 'قبول الطلب وبدء التحضير فوراً 🔥',
    'staff.markReady': 'الطلب جاهز للتسليم ✅',
    'staff.markDelivered': 'تم التسليم وإغلاق الطلب 🚀',
    'staff.simOrder': '+ محاكاة طلب QR جديد',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.howItWorks': 'How It Works',
    'nav.features': 'Features',
    'nav.demo': 'Demo',
    'nav.pricing': 'Pricing',
    'nav.faq': 'FAQ',
    'nav.login': 'Sign In',
    'nav.startFree': 'Start Free Trial',
    'nav.dashboard': 'Dashboard',
    'nav.backHome': 'Back to Main Site',
    'nav.logout': 'Sign Out',

    // Hero & Landing
    'hero.badge': 'The #1 Digital Menu & Restaurant Management Platform in Palestine',
    'hero.title1': 'Transform Your Restaurant Digitally',
    'hero.title2': 'Smart QR Menu, Instant Orders & Complete Control',
    'hero.subtitle': 'Boost your average order value by up to 35% and streamline operations with a lightning-fast digital ordering experience—no app download needed.',
    'hero.ctaDemo': 'Explore Interactive Demo',
    'hero.ctaContact': 'Start 14-Day Free Trial',
    'hero.stat1': '1,000+ Active Restaurants',
    'hero.stat2': '50,000+ Monthly Orders',
    'hero.stat3': '35% Higher Order Size',

    // Demo Dashboard & Sidebar
    'demo.title': 'Operations & Management',
    'demo.overview': 'Overview',
    'demo.orders': 'Live Orders Management',
    'demo.menuEditor': 'Menu Editor',
    'demo.tables': 'Tables & QR Management',
    'demo.customerMenu': 'Customer Mobile Menu',
    'demo.analytics': 'Reports & Analytics',
    'demo.offers': 'Discounts & Offers',
    'demo.branches': 'Branches Management',
    'demo.settings': 'Restaurant Settings',
    'demo.staffScreen': 'Kitchen Display Screen (KDS)',
    'demo.staffScreenDesc': 'Dedicated for staff without financial reports',
    'demo.branchName': 'Nablus Main Branch',
    'demo.activeOrders': 'Active Orders',
    'demo.todaySales': 'Today\'s Total Sales',
    'demo.completedOrders': 'Completed Orders',
    'demo.occupancy': 'Table Occupancy',
    'demo.qrRatio': 'QR Order Ratio',

    // Customer Menu (/m)
    'menu.welcome': 'Welcome to',
    'menu.table': 'Table',
    'menu.all': 'All',
    'menu.burgers': 'Burgers',
    'menu.sides': 'Sides',
    'menu.drinks': 'Drinks',
    'menu.desserts': 'Desserts',
    'menu.add': 'Add',
    'menu.cart': 'Cart',
    'menu.viewCart': 'View Order',
    'menu.itemsCount': 'items',
    'menu.total': 'Total',
    'menu.sendOrder': 'Send Order to Kitchen',
    'menu.notes': 'Special instructions or notes...',
    'menu.orderSent': 'Order Placed Successfully! 🎉',
    'menu.orderSentDesc': 'Our kitchen is preparing your meal now and it will be served shortly.',
    'menu.customization': 'Customization',
    'menu.extras': 'Recommended Add-ons',
    'menu.currency': '₪',
    'menu.scanInstruction': 'Scan QR with your phone camera to order instantly',

    // Staff & Kitchen
    'staff.title': 'Live Orders Management',
    'staff.pending': 'Awaiting Confirmation',
    'staff.preparing': 'Preparing',
    'staff.ready': 'Ready to Serve',
    'staff.completed': 'Completed',
    'staff.printReceipt': 'Print Ticket',
    'staff.acceptOrder': 'Accept & Start Cooking 🔥',
    'staff.markReady': 'Order Ready to Serve ✅',
    'staff.markDelivered': 'Delivered & Closed 🚀',
    'staff.simOrder': '+ Simulate QR Order',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    // Read saved preference from localStorage
    const saved = localStorage.getItem('menus_lang') as Language;
    if (saved === 'en' || saved === 'ar') {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    } else {
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('menus_lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      language: 'ar' as Language,
      direction: 'rtl' as Direction,
      toggleLanguage: () => {},
      setLanguage: () => {},
      t: (key: string, fallback?: string) => fallback || key,
    };
  }
  return context;
}
