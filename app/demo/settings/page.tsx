'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Store, Clock, DollarSign, QrCode, Check, Save 
} from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    restaurantName: 'Burger House',
    tagline: 'أشهى برجر وسماش في فلسطين',
    phone: '0599123456',
    city: 'نابلس',
    address: 'شارع رفيديا الرئيسي — مقابل المجمع التجاري',
    currency: '₪',
    taxRate: '0',
    serviceFee: '0',
    openTime: '11:00',
    closeTime: '23:30',
    qrColor: '#f97316'
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12 font-sans text-slate-800" dir="rtl">
      
      {/* Toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-slate-700"
          >
            <Check size={16} className="text-emerald-400" />
            <span>تم حفظ جميع التعديلات بنجاح!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">إعدادات المطعم والمنيو</h1>
            <p className="text-xs text-slate-400">تعديل بيانات المطعم الأساسية، العملة، ساعات العمل، وهوية كود QR</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Basic Info */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store size={18} className="text-orange-500" />
            <h2 className="font-extrabold text-sm text-slate-900">بيانات المطعم الأساسية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المطعم *</label>
              <input
                type="text"
                required
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الشعار النصي (الوصف القصير)</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للطلب والاستفسار</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800 font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours & Charges */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock size={18} className="text-orange-500" />
            <h2 className="font-extrabold text-sm text-slate-900">ساعات العمل والعملة</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ساعة الفتح</label>
              <input
                type="time"
                value={formData.openTime}
                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ساعة الإغلاق</label>
              <input
                type="time"
                value={formData.closeTime}
                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة المعتمدة</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 text-slate-800"
              >
                <option value="₪">شيكل (₪)</option>
                <option value="JOD">دينار أردني (JOD)</option>
                <option value="$">دولار ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-2xl font-black text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2"
          >
            <Save size={16} />
            <span>حفظ جميع التعديلات</span>
          </button>
        </div>

      </form>

    </div>
  );
}
