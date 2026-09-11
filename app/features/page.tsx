'use client';

import PublicLayout from '@/components/layout/PublicLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function FeaturesPage() {
  const { language, direction } = useLanguage();
  const isEn = language === 'en';

  const features = isEn ? [
    {
      icon: '📱',
      title: 'Digital QR Menu',
      description: 'Professional mobile-friendly digital menu showcasing dishes with vivid images, descriptions, allergens, and live prices without any app downloads.',
    },
    {
      icon: '📷',
      title: 'Dedicated Table QR Codes',
      description: 'Each table has a unique, tamper-proof QR code. Scanning directly locks in the table number and prevents outside fraudulent orders.',
    },
    {
      icon: '🛒',
      title: 'Direct Table Ordering',
      description: 'Guests place orders straight from their phone. Orders route to the kitchen immediately without having to wave down a waiter.',
    },
    {
      icon: '👥',
      title: 'Shared Table Sessions',
      description: 'Multiple guests at the same table can browse and add items into a unified table tab for clean group dining.',
    },
    {
      icon: '✨',
      title: 'Smart Upselling',
      description: 'AI-driven contextual recommendations suggest sauces, extra toppings, and drinks, boosting average check sizes by 20-35%.',
    },
    {
      icon: '📋',
      title: 'Live Kitchen Display (KDS)',
      description: 'Dedicated tablet screen for kitchen crew with color-coded ticket columns, preparation timers, and instant sound notifications.',
    },
    {
      icon: '🪑',
      title: 'Live Table Management',
      description: 'Real-time overview of occupied, empty, and reserved tables. Track active order times and turnaround rates instantly.',
    },
    {
      icon: '📊',
      title: 'Advanced Sales Analytics',
      description: 'Deep reporting on revenue, top-selling dishes, peak dining hours, customer retention, and staff fulfillment speed.',
    },
    {
      icon: '⚡',
      title: 'Zero Order Errors',
      description: 'Eliminates 100% of handwriting errors and misheard orders, saving food waste and dramatically accelerating kitchen speed.',
    },
    {
      icon: '🎁',
      title: 'Discounts & Promotions',
      description: 'Easily launch limited-time offers, happy hour discounts, and bundled combos displayed directly on the digital menu.',
    },
    {
      icon: '👤',
      title: 'Customer Intelligence',
      description: 'Understand guest preferences, repeat visits, and dish ratings to optimize your menu for maximum profitability.',
    },
    {
      icon: '🏢',
      title: 'Multi-Branch Management',
      description: 'Manage multiple restaurant branches, menus, and staff permissions from one unified command dashboard.',
    }
  ] : [
    {
      icon: '📱',
      title: 'المنيو الرقمي',
      description: 'منيو إلكتروني احترافي يعرض أصنافك مع صور وأسعار وتفاصيل. الزبون بيتصفحه من تلفونه بدون تطبيق.',
    },
    {
      icon: '📷',
      title: 'كود QR لكل طاولة',
      description: 'كل طاولة عندها كود QR خاص. الزبون بيمسح الكود وبيفتح المنيو مباشرة مع رقم الطاولة.',
    },
    {
      icon: '🛒',
      title: 'طلبات من الطاولة',
      description: 'الزبون بيطلب مباشرة من تلفونه. الطلب بيوصل للمطبخ فورًا بدون انتظار الجرسون.',
    },
    {
      icon: '👥',
      title: 'جلسات طاولة مشتركة',
      description: 'كل شخص على الطاولة بيقدر يضيف أصنافه على نفس الطلب. حساب واحد لكل الطاولة.',
    },
    {
      icon: '✨',
      title: 'Upselling ذكي',
      description: 'اقتراحات ذكية للإضافات بناءً على طلب الزبون. بيزيد متوسط الطلب بنسبة 20-35%.',
    },
    {
      icon: '📋',
      title: 'إدارة الطلبات الحية',
      description: 'لوحة فورية متطورة تتابع وتحدث حالات الطلبات لحظة بلحظة وبضغطة زر واحدة.',
    },
    {
      icon: '🪑',
      title: 'إدارة الطاولات',
      description: 'شوف حالة كل طاولة: فارغة، مشغولة، أو محجوزة. تابع الطلبات حسب الطاولة.',
    },
    {
      icon: '📊',
      title: 'تحليلات متقدمة',
      description: 'تقارير مفصّلة عن المبيعات، أكثر الأصناف مبيعًا، ساعات الذروة، ومتوسط الطلب.',
    },
    {
      icon: '⚡',
      title: 'سرعة ودقة التحضير',
      description: 'تقليل أخطاء الطلبات اليدوية والورقية بنسبة 100% وتسريع وقت التقديم للطاولات.',
    },
    {
      icon: '🎁',
      title: 'عروض وترويج',
      description: 'أنشئ عروض خاصة وخصومات واعرضها للزبائن مباشرة على المنيو.',
    },
    {
      icon: '👤',
      title: 'تحليلات الزبائن',
      description: 'تعرّف على عادات زبائنك، تفضيلاتهم، ومعدل تكرار زياراتهم.',
    },
    {
      icon: '🏢',
      title: 'إدارة فروع متعددة',
      description: 'أدر كل فروعك من لوحة تحكم واحدة وقارن الأداء بينها.',
    }
  ];

  return (
    <PublicLayout>
      <div className="py-10 md:py-20 px-4 md:px-8 max-w-7xl mx-auto" dir={direction}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3">
            {isEn ? 'Everything You Need in One Platform' : 'كل اللي بتحتاجه بمكان واحد'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            {isEn 
              ? 'MENUS.ps enterprise features tailored specifically for modern hospitality' 
              : 'مميزات Menus.ps المصممة خصيصًا لمطاعم فلسطين'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`bg-white p-8 rounded-2xl shadow-xs border border-slate-200/80 hover:shadow-md hover:border-orange-500 transition-all duration-300 group ${
                isEn ? 'text-left' : 'text-right'
              }`}
            >
              <div className="text-5xl mb-6">{feature.icon}</div>
              <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-20 text-center bg-orange-500 rounded-3xl p-12 text-white shadow-xl shadow-orange-500/20"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            {isEn ? 'Try All These Features Free' : 'جرّب كل هذه المميزات مجانًا'}
          </h2>
          <p className="text-white/90 text-sm md:text-base max-w-xl mx-auto mb-8">
            {isEn 
              ? 'Get a 14-day full-featured free trial. Zero setup fees, no credit card required.' 
              : 'احصل على نسخة تجريبية مجانية لمدة 14 يوم بدون أي بطاقة ائتمان أو التزام.'}
          </p>
          <Link href="/register" className="inline-block bg-white hover:bg-slate-50 text-orange-600 font-black py-4 px-10 rounded-2xl shadow-md transition-all active:scale-98 text-base">
            {isEn ? 'Start 14-Day Free Trial Now 🚀' : 'تواصل معنا للبدء الآن'}
          </Link>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
