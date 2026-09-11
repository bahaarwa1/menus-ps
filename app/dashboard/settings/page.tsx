'use client';

import React, { useState } from 'react';
import { Store, Globe, Check, Save, Shield } from 'lucide-react';

export default function ProductionSettingsPage() {
  const [restaurantName, setRestaurantName] = useState('Burger House نابلس');
  const [slug] = useState('burger-house-nablus');
  const [phone, setPhone] = useState('+970 59 900 0000');
  const [city, setCity] = useState('نابلس');
  const [currency, setCurrency] = useState('₪');
  const [staffPin, setStaffPin] = useState('1234');
  const [taxRate, setTaxRate] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">إعدادات المطعم والهوية</h1>
        <p className="text-xs text-slate-500 mt-1">تعديل بيانات المطعم الأساسية، العملة، ورموز أجهزة المطبخ</p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-in fade-in">
          <Check size={16} strokeWidth={3} />
          <span>تم حفظ التعديلات بنجاح وتحديث بيانات المطعم فوراً!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Store size={16} className="text-orange-500" />
            <span>معلومات وهوية المطعم</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المطعم التجاري</label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رابط المنيو (Subdomain)</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-mono text-slate-500" dir="ltr">
                <span>.menus-ps.vercel.app</span>
                <input
                  type="text"
                  disabled
                  value={slug}
                  className="bg-transparent font-bold text-slate-800 text-right w-full outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المدينة / المحافظة</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="نابلس">نابلس</option>
                <option value="رام الله والبيرة">رام الله والبيرة</option>
                <option value="الخليل">الخليل</option>
                <option value="القدس">القدس</option>
                <option value="بيت لحم">بيت لحم</option>
                <option value="جنين">جنين</option>
                <option value="طولكرم">طولكرم</option>
                <option value="قلقيلية">قلقيلية</option>
                <option value="أريحا">أريحا</option>
                <option value="غزة">غزة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف / الواتساب للتواصل</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Currency & Pricing */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Globe size={16} className="text-orange-500" />
            <span>العملة والرسوم</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">العملة الافتراضية</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="₪">شيكل (₪ ILS)</option>
                <option value="JOD">دينار أردني (JOD)</option>
                <option value="$">دولار أمريكي ($ USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رسوم الخدمة (%)</label>
              <input
                type="number"
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Kitchen & Staff PIN */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
            <Shield size={16} className="text-orange-500" />
            <span>أمان شاشة المطبخ والكاشير (Staff PIN)</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            رمز الدخول السريع لشاشات التابلت في المطبخ والكاشير بدون الحاجة لكتابة بريد وكلمة مرور معقدة.
          </p>

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-700 mb-1">رمز الـ PIN المكون من 4 أرقام</label>
            <input
              type="text"
              maxLength={4}
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-center tracking-widest focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Save size={16} />
            <span>حفظ جميع التغييرات</span>
          </button>
        </div>

      </form>
    </div>
  );
}
