'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'الأساسية',
      subtitle: 'للمقاهي وعربات الطعام',
      monthlyPrice: 99,
      yearlyPrice: 79,
      popular: false,
      features: [
        'منيو QR رقمي غير محدود الأصناف',
        'كود QR مخصص لكل طاولة',
        'تعديل فوري للأسعار والأطباق',
        'إدارة حالات التوفر ونفاد الكمية',
        'دعم فني سريع عبر واتساب'
      ],
      ctaText: 'ابدأ بالأساسية',
      ctaStyle: 'bg-slate-100 hover:bg-slate-200 text-slate-800'
    },
    {
      id: 'pro',
      name: 'برو المتكاملة',
      subtitle: 'الأكثر طلباً للمطاعم النشطة',
      monthlyPrice: 149,
      yearlyPrice: 119,
      popular: true,
      badge: 'الأكثر شعبية 🔥',
      features: [
        'كل ما في الباقة الأساسية',
        'طلب مباشر من الطاولة بدون انتظار',
        'جلسات طاولة مشتركة وحساب موحد',
        'نظام Upselling لزيادة متوسط الفاتورة',
        'لوحة إدارة الطلبات الحية الفورية',
        'نظام العروض والخصومات الخاصة'
      ],
      ctaText: 'ابدأ تجربة مجانية (14 يوم)',
      ctaStyle: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
    },
    {
      id: 'enterprise',
      name: 'سلاسل وفروع',
      subtitle: 'للمطاعم الكبيرة ومتعددة الفروع',
      monthlyPrice: 249,
      yearlyPrice: 199,
      popular: false,
      features: [
        'كل ما في باقة برو',
        'إدارة فروع متعددة من حساب واحد',
        'تقارير أداء وتحليلات مقارنة الفروع',
        'تخصيص كامل للهوية والشعار والألوان',
        'حسابات غير محدودة للمشرفين والموظفين',
        'مدير حساب مخصص وتدريب للطاقم'
      ],
      ctaText: 'تواصل مع المبيعات',
      ctaStyle: 'bg-slate-900 hover:bg-slate-800 text-white'
    }
  ];

  return (
    <PublicLayout>
      <div className="bg-[#f8fafc] min-h-[calc(100vh-64px)] pt-10 sm:pt-20 pb-12 px-4 flex flex-col justify-center">
        <div className="container mx-auto max-w-6xl">
          
          {/* Header & Billing Toggle */}
          <div className="text-center mb-6">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-4xl font-black text-slate-900 mb-2"
            >
              خطط أسعار واضحة بدون عمولات خفية
            </motion.h1>
            <p className="text-xs sm:text-base text-slate-600 mb-4 max-w-xl mx-auto">
              اختر الخطة المناسبة لحجم مطعمك وابدأ فوراً بتجربة مجانية كاملة لمدة 14 يوم.
            </p>

            {/* Toggle Billing */}
            <div className="inline-flex items-center bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                دفع شهري
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>دفع سنوي</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-md font-extrabold">
                  وفر 20%
                </span>
              </button>
            </div>
          </div>

          {/* 3 Plans Grid - Fully fitting without scroll */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {plans.map((plan, idx) => {
              const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white rounded-3xl p-5 border flex flex-col justify-between relative transition-all ${
                    plan.popular
                      ? 'border-orange-500 shadow-xl ring-2 ring-orange-500/20 md:-translate-y-1'
                      : 'border-slate-200/80 shadow-sm hover:shadow-md'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-md shadow-orange-500/30">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-4 mb-4">
                      <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{plan.subtitle}</p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">{price}</span>
                        <span className="text-lg font-bold text-orange-600">₪</span>
                        <span className="text-xs text-slate-400 font-medium">/ شهر</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2.5 mb-5 text-xs text-slate-700">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <div className={`p-0.5 rounded-full shrink-0 mt-0.5 ${plan.popular ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                            <Check size={13} strokeWidth={3} />
                          </div>
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div>
                    <Link
                      href="/contact"
                      className={`block w-full py-3 px-4 rounded-xl text-center text-xs font-black transition-all active:scale-98 ${plan.ctaStyle}`}
                    >
                      {plan.ctaText}
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Guarantee & Notes */}
          <div className="mt-6 text-center text-xs text-slate-400 flex flex-wrap justify-center items-center gap-4 font-medium">
            <span>✓ تجربة 14 يوم مجاناً</span>
            <span>•</span>
            <span>✓ بدون أي بطاقة بنكية</span>
            <span>•</span>
            <span>✓ إلغاء في أي وقت بنقرة واحدة</span>
            <span>•</span>
            <span>✓ إعداد القائمة خلال أقل من 10 دقائق</span>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
}
