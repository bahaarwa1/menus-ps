'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, Globe, Check, Save, Shield, Loader2, AlertCircle, 
  ExternalLink, Upload, Image as ImageIcon, Trash2, Clock, 
  MapPin, Phone
} from 'lucide-react';

const PRESET_LOGOS = [
  { label: 'برجر ووجبات سريعة', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
  { label: 'بيتزا ومعجنات', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80' },
  { label: 'كافيه ومشروبات', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80' },
  { label: 'مشاوي ومأكولات شرقية', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80' },
  { label: 'شاورما وساندوتشات', url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=200&auto=format&fit=crop&q=80' },
  { label: 'حلويات ومخبوزات', url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&auto=format&fit=crop&q=80' },
];

export default function ProductionSettingsPage() {
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('أشهى المأكولات والمشروبات بنكهات مميزة');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('نابلس');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('₪');
  const [staffPin, setStaffPin] = useState('1234');
  const [taxRate, setTaxRate] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');
  const [openingHours, setOpeningHours] = useState('يومياً من 11:00 صباحاً حتى 12:00 منتصف الليل');
  const [isOpen, setIsOpen] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real settings on mount
  useEffect(() => {
    async function initSettings() {
      try {
        const params = new URLSearchParams(window.location.search);
        let activeSlug = params.get('created') || params.get('restaurant') || '';

        // Try getting slug from session if not in URL
        if (!activeSlug) {
          try {
            const sessRes = await fetch('/api/auth/session');
            const sessData = await sessRes.json();
            if (sessData?.user?.restaurantSlug) {
              activeSlug = sessData.user.restaurantSlug;
            }
          } catch {}
        }

        const settingsUrl = `/api/v1/restaurant/settings${activeSlug ? `?slug=${encodeURIComponent(activeSlug)}` : ''}`;
        const res = await fetch(settingsUrl);
        const data = await res.json();

        if (data.success && data.settings) {
          setRestaurantName(data.settings.name || '');
          setSlug(data.settings.slug || activeSlug || '');
          setLogoUrl(data.settings.logoUrl || '');
          setPhone(data.settings.phone || '');
          setCity(data.settings.city || 'نابلس');
          setAddress(data.settings.address || '');
          setCurrency(data.settings.currency || '₪');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initSettings();
  }, []);

  // Handle Logo Upload via Supabase Storage API
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setLogoUrl(data.url);
        setSavedMessage('تم رفع شعار المطعم بنجاح! لا تنسَ حفظ التغييرات أسفل الصفحة.');
        setTimeout(() => setSavedMessage(''), 4000);
      } else {
        setErrorMessage(data.error || 'فشل رفع صورة الشعار');
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء رفع الشعار');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
          logoUrl,
          phone,
          city,
          address,
          currency,
          staffPin,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedMessage(data.message || 'تم حفظ جميع التعديلات وشعار المطعم بنجاح!');
        setTimeout(() => setSavedMessage(''), 4000);
        try {
          const effectiveSlug = slug || 'burger-house-nablus';
          sessionStorage.setItem(`restaurant_meta_${effectiveSlug}`, JSON.stringify({
            name: restaurantName,
            logoUrl: logoUrl || '',
            city: city || '',
          }));
        } catch {}
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
        <p className="text-xs font-bold">جاري تحميل إعدادات المطعم والهوية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans text-slate-900" dir="rtl">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">إعدادات وهوية المطعم</h1>
          <p className="text-xs text-slate-500 mt-1">تعديل شعار المطعم، الاسم التجاري، العنوان، العملة، ورموز أجهزة المطبخ</p>
        </div>
        <a
          href={menuPublicUrl}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all"
        >
          <span>معاينة المنيو الحي للزبائن</span>
          <ExternalLink size={13} className="text-orange-500" />
        </a>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 animate-in fade-in">
          <Check size={16} strokeWidth={3} />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 animate-in fade-in">
          <AlertCircle size={16} strokeWidth={3} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* Section 1: Restaurant Logo & Visual Identity */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ImageIcon size={16} className="text-orange-500" />
              <span>لوجو وشعار المطعم (يظهر في رأس المنيو والطلبات)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">يحل محل اللوجو الافتراضي</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            {/* Logo Preview Box */}
            <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative group">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={logoUrl} 
                  alt="شعار المطعم" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <Store size={28} className="text-slate-300 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 font-bold block">لا يوجد شعار</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>جاري الرفع...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>رفع لوجو من جهازك</span>
                    </>
                  )}
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>إزالة الشعار</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">أو أدخل رابط صورة مباشر (URL):</label>
                <input
                  type="url"
                  placeholder="https://example.com/my-logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 bg-white focus:outline-none focus:border-orange-500 dir-ltr"
                  dir="ltr"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5">شعارات جاهزة مقترحة بنقرة واحدة:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_LOGOS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLogoUrl(p.url)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        logoUrl === p.url
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Section 2: Basic Information & Tagline */}
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
                placeholder="مثال: مطعم سناك هاوس"
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">شعار أو وصف مختصر للمطعم</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="مثال: أشهى وجبات البرجر والمشاوي الطازجة يومياً"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-orange-500" />
                <span>المدينة / المحافظة</span>
              </label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone size={12} className="text-orange-500" />
                <span>رقم الهاتف / الواتساب للتواصل</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+970 59 000 0000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي للفرع</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: شارع رفيديا الرئيسي، عمارة الأمل، بجانب دوار الشهداء"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Currency, Taxes & Hours */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Globe size={16} className="text-orange-500" />
            <span>العملة، الرسوم، وأوقات العمل</span>
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
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={12} className="text-orange-500" />
                <span>أوقات وساعات العمل اليومية</span>
              </label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="مثال: يومياً من 11:00 صباحاً حتى 12:00 منتصف الليل"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">حالة استقبال الطلبات</label>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOpen 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span>{isOpen ? 'مفتوح لاستقبال الطلبات' : 'مغلق مؤقتاً'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Kitchen & Staff PIN */}
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
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري حفظ التغييرات والشعار...</span>
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
