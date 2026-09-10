'use client';

import { motion } from 'framer-motion';
import PublicLayout from '@/components/layout/PublicLayout';

export default function HowItWorksPage() {
  const steps = [
    { emoji: '📱', title: 'امسح كود QR', desc: 'الزبون بيمسح الكود الموجود على الطاولة عن طريق جواله بكل سهولة.' },
    { emoji: '📖', title: 'تصفّح المنيو', desc: 'منيو رقمي كامل مع صور جذابة وأسعار وتفاصيل لكل طبق.' },
    { emoji: '🛒', title: 'اطلب واختار', desc: 'اختار الأصناف وخصصها حسب ذوقك مع خيارات وإضافات متعددة.' },
    { emoji: '✨', title: 'اقتراحات ذكية', desc: 'النظام بيقترح إضافات مناسبة مع الطلب تزيد من مبيعات مطعمك.' },
    { emoji: '📋', title: 'استلام فوري للطلب', desc: 'الطلب بيوصل فوراً للوحة إدارة الطلبات لبدء التجهيز والتحضير بدون تأخير.' },
    { emoji: '📊', title: 'تحليلات فورية', desc: 'تابع أداء مطعمك والمبيعات لحظة بلحظة من خلال لوحة التحكم.' },
  ];

  return (
    <PublicLayout>
      <div className="bg-[#f8fafc] min-h-screen pt-12 sm:pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3"
            >
              كيف يعمل النظام؟
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm sm:text-base text-slate-600"
            >
              خطوات بسيطة وسلسة لتجربة مستخدم مميزة للزبون ولإدارة المطعم
            </motion.p>
          </div>

          <div className="relative">
            {/* Desktop Vertical Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-orange-300 -translate-x-1/2 rounded"></div>
            
            <div className="space-y-12">
              {steps.map((step, index) => {
                const isEven = index % 2 === 0;
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row-reverse' : ''}`}
                  >
                    <div className="flex-1 w-full flex justify-center md:justify-end">
                      <div className="w-full max-w-md bg-white p-7 rounded-3xl shadow-sm hover:shadow-xl border border-slate-200/80 transition-all text-right relative group">
                        <div className="text-4xl mb-3">{step.emoji}</div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">{step.title}</h3>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                    
                    {/* Circle on the line */}
                    <div className="hidden md:flex w-16 h-16 bg-white border-4 border-orange-500 rounded-full items-center justify-center font-bold text-xl text-orange-500 z-10 shrink-0">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 w-full hidden md:block"></div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
