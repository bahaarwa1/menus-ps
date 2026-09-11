'use client';

import React, { useState, useEffect } from 'react';
import { Store, Globe, Check, Save, Shield, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

export default function ProductionSettingsPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('نابلس');
  const [currency, setCurrency] = useState('₪');
  const [staffPin, setStaffPin] = useState('1234');
  const [taxRate, setTaxRate] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch real settings on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSlug = params.get('created') || params.get('restaurant') || '';

    fetch(`/api/v1/restaurant/settings${urlSlug ? `?slug=${encodeURIComponent(urlSlug)}` : ''}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setRestaurantName(data.settings.name || '');
          setSlug(data.settings.slug || '');
          setPhone(data.settings.phone || '');
          setCity(data.settings.city || 'نابلس');
          setCurrency(data.settings.currency || '₪');
        }
      })
      .catch((err) => {
        console.error('Error fetching settings:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/v1/restaurant/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: restaurantName,
          phone,
          city,
          currency,
          staffPin,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedMessage(data.message || 'تم حفظ التعديلات بنجاح وتحديث بيانات المطعم فوراً!');
        setTimeout(() => setSavedMessage(''), 4000);
      } else {
        setErrorMessage(data.error || 'فشل حفظ الإعدادات');
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://menus-ps.vercel.app';
  const menuPublicUrl = `${origin}/r/${slug || 'burger-house-nablus'}`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 size={32} className="animate-spin text-orange-500" />
        <p className="text-xs font-bold">جاري تحميل إعدادات المطعم...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">إعدادات المطعم والهوية</h1>
          <p className="text-xs text-slate-500 mt-1">تعديل بيانات المطعم الأساسية، العملة، ورموز أجهزة المطبخ</p>
        </div>
        <a
          href={menuPublicUrl}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all"
        >
          <span>معاينة المنيو الحي</span>
          <ExternalLink size={13} className="text-orange-500" />
        </a>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-in fade-in">
          <Check size={16} strokeWidth={3} />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 animate-in fade-in">
          <AlertCircle size={16} strokeWidth={3} />
          <span>{errorMessage}</span>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المطعم التجاري *</label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رابط منيو المطعم للزبائن</label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-xs font-mono text-slate-600" dir="ltr">
                <span className="text-slate-400 select-none">/r/</span>
                <input
                  type="text"
                  disabled
                  value={slug}
                  className="bg-transparent font-bold text-slate-800 w-full outline-none"
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
                placeholder="+970 59 000 0000"
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
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رسوم الخدمة (%)</label>
              <input
                type="number"
                min="0"
                max="100"
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
            <label className="block text-xs font-bold text-slate-700 mb-1">رمز الـ PIN المكون من 4 إلى 6 أرقام</label>
            <input
              type="text"
              maxLength={6}
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
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري حفظ التغييرات...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>حفظ جميع التغييرات</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
