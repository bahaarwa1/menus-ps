'use client';

import { useState } from 'react';
import PublicLayout from '@/components/layout/PublicLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { faqItems } from '@/data/demo-data';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PublicLayout>
      <div className="py-20 px-4 md:px-8 max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">الأسئلة الشائعة</h1>
          <p className="text-xl text-slate-600">إجابات على أكثر الأسئلة اللي بتسألوها</p>
        </motion.div>

        <div className="space-y-4">
          {faqItems.map((item: { question: string; answer: string }, index: number) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`bg-white border rounded-xl overflow-hidden transition-colors duration-300 ${isOpen ? 'border-orange-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-right px-6 py-5 flex justify-between items-center focus:outline-none"
                >
                  <span className={`font-bold text-lg ${isOpen ? 'text-orange-600' : 'text-slate-800'}`}>
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex-shrink-0 ml-4 ${isOpen ? 'text-orange-500' : 'text-slate-400'}`}
                  >
                    <ChevronDown size={24} />
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
                      <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
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
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-slate-600 mb-4">ما لقيت جوابك؟</p>
          <Link href="/contact" className="inline-block bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50 font-bold py-2 px-6 rounded-lg transition-colors">
            تواصل معنا
          </Link>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
