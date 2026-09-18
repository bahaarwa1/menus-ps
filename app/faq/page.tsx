'use client';

import { useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { faqItems as arabicFaqItems } from '@/data/demo-data';

const englishFaqItems = [
  {
    question: 'How do I get started with Menus.ps?',
    answer: 'Getting started takes less than 10 minutes: Register your account, input your menu items, print generated QR code stands for your tables, and start taking live orders! Our support team is always available to help.',
  },
  {
    question: 'Do I need special hardware or POS terminals?',
    answer: 'No! Menus.ps runs entirely in the cloud on any web browser. Guests order via their own smartphones, and you manage kitchen orders from any existing tablet, laptop, or phone.',
  },
  {
    question: 'How do customers order?',
    answer: 'Guests point their phone camera at the QR code stand on their table. The digital menu opens immediately with table number locked in. They customize their items and send the order straight to your kitchen without downloading an app.',
  },
  {
    question: 'What is a "Shared Table Session"?',
    answer: 'When a group of friends or a family sits at the same table, each person can scan the QR code and add their chosen dishes into a shared order tab, keeping group dining smooth and frictionless.',
  },
  {
    question: 'How does Smart Upselling work?',
    answer: 'Menus AI analyzes the cart in real-time and recommends matching sides, dips, and beverages (e.g. suggesting fries & a drink when a burger is selected), proven to boost average ticket size by 20% to 35%.',
  },
  {
    question: 'Can I view live reports and analytics?',
    answer: 'Yes! You have access to real-time sales dashboards, top-selling items, peak rush hours, table turnover metrics, and bilingual AI recommendations to grow restaurant revenue.',
  },
  {
    question: 'How much does the subscription cost?',
    answer: 'Menus.ps Pro is only 250 ₪ per month with zero sales commissions. It includes unlimited menu items, tables, orders, KDS kitchen screens, and a 14-day free trial.',
  },
  {
    question: 'Is technical support included?',
    answer: 'Yes! Dedicated support is available via WhatsApp and phone from 9:00 AM to 10:00 PM, alongside step-by-step setup guides and video tutorials.',
  },
  {
    question: 'Can I manage multiple branches?',
    answer: 'Absolutely. You can oversee and benchmark all branch locations from a single central master dashboard with separate or consolidated sales reports.',
  },
  {
    question: 'Is customer and financial data secure?',
    answer: 'Yes. Menus.ps adheres to enterprise cryptographic standards, including cryptographically signed table tokens, SSL encryption, rate limiting, and daily automated backups.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { language, direction } = useLanguage();
  const isEn = language === 'en';

  const items = isEn ? englishFaqItems : arabicFaqItems;

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PublicLayout>
      <div className="py-12 md:py-20 px-4 md:px-8 max-w-4xl mx-auto" dir={direction}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3">
            {isEn ? 'Frequently Asked Questions' : 'الأسئلة الشائعة'}
          </h1>
          <p className="text-sm md:text-lg text-slate-600">
            {isEn ? 'Answers to commonly asked questions about MENUS.ps' : 'إجابات على أكثر الأسئلة اللي بتسألوها'}
          </p>
        </motion.div>

        <div className="space-y-4">
          {items.map((item, index: number) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`bg-white border rounded-2xl overflow-hidden transition-colors duration-300 shadow-2xs ${
                  isOpen ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className={`w-full px-6 py-5 flex justify-between items-center focus:outline-none cursor-pointer ${
                    isEn ? 'text-left' : 'text-right'
                  }`}
                >
                  <span className={`font-black text-sm md:text-base ${isOpen ? 'text-orange-600' : 'text-slate-900'}`}>
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`shrink-0 ${isEn ? 'mr-0 ml-4' : 'ml-0 mr-4'} ${isOpen ? 'text-orange-500' : 'text-slate-400'}`}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className={`px-6 pb-6 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 pt-4 ${
                        isEn ? 'text-left' : 'text-right'
                      }`}>
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-14 text-center"
        >
          <p className="text-sm md:text-base text-slate-600 mb-4 font-medium">
            {isEn ? "Still have questions? We're here to help!" : 'ما لقيت جوابك؟ فريقنا بخدمتك دائماً'}
          </p>
          <Link 
            href="/contact" 
            className="inline-block bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-orange-500/25 hover:bg-orange-600 transition-all"
          >
            {isEn ? 'Contact Support' : 'تواصل معنا الآن'}
          </Link>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
