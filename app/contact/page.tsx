'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PublicLayout from '@/components/layout/PublicLayout';
import { Phone, Mail, MapPin, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    restaurantName: '',
    managerName: '',
    phone: '',
    city: '',
    tablesCount: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const cities = ['نابلس', 'رام الله', 'الخليل', 'بيت لحم', 'جنين', 'طولكرم', 'قلقيلية', 'أريحا', 'غزة', 'أخرى'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.restaurantName && formData.phone && formData.city) {
      setIsSubmitted(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <PublicLayout>
      <div className="bg-[#f8fafc] min-h-screen pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black text-slate-900 mb-4"
            >
              ابدأ تجربتك المجانية
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600"
            >
              سجّل بيانات مطعمك الآن واستلم حسابك التجريبي الفوري لمدة 14 يوم
            </motion.p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-2/3 bg-white p-8 rounded-3xl shadow-sm border border-slate-200/80"
            >
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-slate-800 mb-4">تم استلام طلبك بنجاح!</h3>
                  <p className="text-lg text-slate-600">سنتواصل معك في أقرب وقت لتفعيل حسابك والبدء بالتجربة.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-700 font-medium mb-2">اسم المطعم *</label>
                      <input 
                        type="text" 
                        name="restaurantName"
                        required
                        value={formData.restaurantName}
                        onChange={handleChange}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="أدخل اسم المطعم"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-2">اسم المسؤول</label>
                      <input 
                        type="text" 
                        name="managerName"
                        value={formData.managerName}
                        onChange={handleChange}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="الاسم الكامل"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-2">رقم الهاتف *</label>
                      <input 
                        type="tel" 
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="059xxxxxxx"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-2">المدينة *</label>
                      <select 
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none"
                      >
                        <option value="">اختر المدينة</option>
                        {cities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-700 font-medium mb-2">عدد الطاولات المتوقع</label>
                      <input 
                        type="number" 
                        name="tablesCount"
                        value={formData.tablesCount}
                        onChange={handleChange}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="مثال: 15"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 px-6 bg-orange-500 text-white rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-md shadow-orange-500/25 active:scale-98"
                  >
                    اطلب تجربة مجانية فورية
                  </button>
                </form>
              )}
            </motion.div>

            {/* Side Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full lg:w-1/3 space-y-6"
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">تواصل معنا</h4>
                  <p className="text-slate-600" dir="ltr">+970 599 000 000</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">البريد الإلكتروني</h4>
                  <p className="text-slate-600">info@menus.ps</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">الموقع</h4>
                  <p className="text-slate-600">نابلس، فلسطين</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
