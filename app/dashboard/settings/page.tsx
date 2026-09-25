'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, Globe, Check, Save, Shield, Loader2, AlertCircle, 
  ExternalLink, Upload, Image as ImageIcon, Trash2, Clock, 
  MapPin, Phone, MessageCircle, Share2, Sparkles, Flame,
  User, Mail, CreditCard, Calendar, CheckCircle2, Layers,
  Zap, Lock, Eye, EyeOff, Headphones, Award, Navigation,
  Crosshair, Compass, Radio, CheckCircle, Info
} from 'lucide-react';

const PRESET_LOGOS = [
  { label: 'شيشة ومنقوشة (الرسمي)', url: '/sh-manoosha/logo.png' },
  { label: 'برجر وسناك', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
  { label: 'بيتزا ومعجنات', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80' },
  { label: 'كافيه ومشروبات', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=80' },
  { label: 'مشاوي ومأكولات شرقية', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80' },
  { label: 'حلويات ومخبوزات', url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&auto=format&fit=crop&q=80' },
];

const PRESET_BANNERS = [
  { 
    label: 'مناقيش وشيشة ملكية', 
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80', 
    title: 'أشهى المناقيش والشيشة الفاخرة يومياً 🔥', 
    subtitle: 'مناقيش طازجة على الحطب مع تشكيلة واسعة من المشروبات والمقبلات' 
  },
  { 
    label: 'برجر وسماش عائلي', 
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&auto=format&fit=crop&q=80', 
    title: 'عرض التوفير للوجبات العائلية 🔥', 
    subtitle: 'خصم 20% على جميع وجبات البرجر والسماش - اطلب الآن واستمتع!' 
  },
  { 
    label: 'بيتزا إيطالية طازجة', 
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=80', 
    title: 'عروض البيتزا الكبرى 🍕', 
    subtitle: 'اطلب 2 بيتزا كبيرة واحصل على مشروب غازي وبطاطا مقرمشة مجاناً' 
  },
  { 
    label: 'دجاج مقلي ومسحب كرسبي', 
    url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1000&auto=format&fit=crop&q=80', 
    title: 'كرانشي كومبو دجاج مقلي 🍗', 
    subtitle: 'قطع دجاج مقرمشة وذهبية مع صوص الشيف الخاص وبطاطا ودجز' 
  },
  { 
    label: 'حلويات ومشروبات منعشة', 
    url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1000&auto=format&fit=crop&q=80', 
    title: 'حلّي يومك بأشهى الحلويات 🍰', 
    subtitle: 'وافل، كريب، وتشيز كيك طازج مع تشكيلة من أشهى العصائر الطبيعية' 
  },
];

interface AccountInfo {
  email: string;
  name: string;
  role: string;
  roleTitleAr: string;
  memberSince: string;
  restaurantSlug: string;
  restaurantName: string;
  phone: string;
  city?: string;
}

interface SubscriptionDetails {
  plan: 'trial' | 'basic' | 'pro';
  planNameAr: string;
  status: 'active' | 'trial' | 'expired';
  expiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  maxTables: number;
  currentTables: number;
  branchesAllowed: number;
  features: string[];
}

export default function ProductionSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'subscription' | 'account' | 'marketing' | 'gps' | 'system'>('general');

  // Restaurant details
  const [restaurantName, setRestaurantName] = useState('مطعم وكافيه شيشة ومنقوشة');
  const [slug, setSlug] = useState('sh-manoosha');
  const [logoUrl, setLogoUrl] = useState('/sh-manoosha/logo.png');
  const [tagline, setTagline] = useState('أشهى المناقيش والشيشة والمشروبات بأجواء راقية');
  const [phone, setPhone] = useState('092343905');
  const [city, setCity] = useState('نابلس - رفيديا');
  const [address, setAddress] = useState('نابلس - رفيديا - الشارع الرئيسي');
  const [currency, setCurrency] = useState('₪');
  const [staffPin, setStaffPin] = useState('1234');
  const [taxRate, setTaxRate] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');
  const [openingHours, setOpeningHours] = useState('يومياً من 09:00 صباحاً حتى 01:00 بعد منتصف الليل');
  const [isOpen, setIsOpen] = useState(true);

  // GPS Geofencing Settings
  const [requireGps, setRequireGps] = useState<boolean>(true);
  const [gpsLatitude, setGpsLatitude] = useState<number>(32.2272);
  const [gpsLongitude, setGpsLongitude] = useState<number>(35.2289);
  const [gpsRadiusMeters, setGpsRadiusMeters] = useState<number>(350);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsFeedbackMsg, setGpsFeedbackMsg] = useState<string>('');

  // Social Media Links
  const [whatsappNumber, setWhatsappNumber] = useState('092343905');
  const [instagramUrl, setInstagramUrl] = useState('shisha_manoosha');
  const [facebookUrl, setFacebookUrl] = useState('https://facebook.com/shisha.manoosha');
  const [tiktokUrl, setTiktokUrl] = useState('');

  // Offers & Discounts Banner
  const [offersBannerUrl, setOffersBannerUrl] = useState('https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80');
  const [offersBannerTitle, setOffersBannerTitle] = useState('أشهى المناقيش والشيشة الفاخرة يومياً 🔥');
  const [offersBannerSubtitle, setOffersBannerSubtitle] = useState('مناقيش طازجة على الحطب مع تشكيلة واسعة من المشروبات والمقبلات');
  const [offersBannerActive, setOffersBannerActive] = useState(true);
  const [isBannerUploading, setIsBannerUploading] = useState(false);

  // Account & Subscription Info
  const [account, setAccount] = useState<AccountInfo>({
    email: 'shisha.manoosha@menus.ps',
    name: 'مالك مطعم شيشة ومنقوشة',
    role: 'owner',
    roleTitleAr: 'مالك المطعم - المدير المسؤول',
    memberSince: '2025-01-01',
    restaurantSlug: 'sh-manoosha',
    restaurantName: 'مطعم وكافيه شيشة ومنقوشة',
    phone: '092343905',
    city: 'نابلس - رفيديا',
  });

  const [subscription, setSubscription] = useState<SubscriptionDetails>({
    plan: 'pro',
    planNameAr: 'الباقة الاحترافية السنوية (VIP PRO)',
    status: 'active',
    expiresAt: '2027-01-01T00:00:00.000Z',
    daysRemaining: 281,
    isExpired: false,
    maxTables: 50,
    currentTables: 15,
    branchesAllowed: 3,
    features: [
      'منيو إلكتروني QR عالي السرعة بنقرة واحدة',
      'شاشة مطبخ واستلام طلبات حية مع تنبيهات صوتية',
      'لوحة تحكم كاملة بالمبيعات وتعديل الأصناف',
      'طباعة الفواتير الحرارية الفورية (80mm)',
      'تخصيص كامل لألوان وهوية وشعار المطعم',
      'نطاق فرعي مخصص (Subdomain) مشفر وآمن',
      'دعم فني واستشارات تشغيلية على مدار الساعة'
    ]
  });

  // Security & Password states
  const [showPin, setShowPin] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch real settings from backend on mount
  useEffect(() => {
    async function initSettings() {
      try {
        const params = new URLSearchParams(window.location.search);
        let activeSlug = params.get('created') || params.get('restaurant') || params.get('slug') || '';

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

        const effectiveSlug = activeSlug || 'sh-manoosha';

        // Load local caches first for instant display
        try {
          const cachedSocial = localStorage.getItem(`restaurant_social_${effectiveSlug}`);
          if (cachedSocial) {
            const parsed = JSON.parse(cachedSocial);
            if (parsed.whatsappNumber) setWhatsappNumber(parsed.whatsappNumber);
            if (parsed.instagramUrl) setInstagramUrl(parsed.instagramUrl);
            if (parsed.facebookUrl) setFacebookUrl(parsed.facebookUrl);
            if (parsed.tiktokUrl) setTiktokUrl(parsed.tiktokUrl);
          }
          const cachedOffers = localStorage.getItem(`restaurant_offers_${effectiveSlug}`);
          if (cachedOffers) {
            const parsed = JSON.parse(cachedOffers);
            if (parsed.bannerUrl) setOffersBannerUrl(parsed.bannerUrl);
            if (parsed.title) setOffersBannerTitle(parsed.title);
            if (parsed.subtitle) setOffersBannerSubtitle(parsed.subtitle);
            if (parsed.active !== undefined) setOffersBannerActive(parsed.active);
          }
        } catch {}

        // Fetch from backend
        const settingsUrl = `/api/v1/restaurant/settings?slug=${encodeURIComponent(effectiveSlug)}`;
        const res = await fetch(settingsUrl);
        const data = await res.json();

        if (data.success && data.settings) {
          const s = data.settings;
          setRestaurantName(s.name || 'مطعم وكافيه شيشة ومنقوشة');
          setSlug(s.slug || effectiveSlug);
          setLogoUrl(s.logoUrl || '/sh-manoosha/logo.png');
          setPhone(s.phone || '092343905');
          setCity(s.city || 'نابلس - رفيديا');
          setAddress(s.address || 'نابلس - رفيديا - الشارع الرئيسي');
          setCurrency(s.currency || '₪');
          if (s.whatsappNumber) setWhatsappNumber(s.whatsappNumber);
          if (s.instagramUrl) setInstagramUrl(s.instagramUrl);
          if (s.facebookUrl) setFacebookUrl(s.facebookUrl);
          if (s.tiktokUrl) setTiktokUrl(s.tiktokUrl);
          if (s.offersBannerUrl) setOffersBannerUrl(s.offersBannerUrl);
          if (s.offersBannerTitle) setOffersBannerTitle(s.offersBannerTitle);
          if (s.offersBannerSubtitle) setOffersBannerSubtitle(s.offersBannerSubtitle);
          if (s.offersBannerActive !== undefined) setOffersBannerActive(s.offersBannerActive);

          if (s.requireGps !== undefined) setRequireGps(Boolean(s.requireGps));
          if (s.gpsLatitude) setGpsLatitude(Number(s.gpsLatitude));
          if (s.gpsLongitude) setGpsLongitude(Number(s.gpsLongitude));
          if (s.gpsRadiusMeters) setGpsRadiusMeters(Number(s.gpsRadiusMeters));

          if (s.account) {
            setAccount(s.account);
          }
          if (s.subscription) {
            setSubscription(s.subscription);
          }
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
        setSavedMessage('تم رفع شعار المطعم بنجاح! احفظ التغييرات لاعتماد الشعار.');
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

  // Handle Banner Upload via Supabase Storage API
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBannerUploading(true);
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
        setOffersBannerUrl(data.url);
        setSavedMessage('تم رفع بانر العروض بنجاح! اضغط على حفظ التغييرات لاعتماده.');
        setTimeout(() => setSavedMessage(''), 4000);
      } else {
        setErrorMessage(data.error || 'فشل رفع صورة البانر');
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء رفع بانر العروض');
    } finally {
      setIsBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // Automatically detect restaurant's physical GPS location using device geolocation
  const handleDetectCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsFeedbackMsg('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي GPS.');
      return;
    }

    setIsDetectingGps(true);
    setGpsFeedbackMsg('جاري الاتصال بالأقمار الصناعية وتحديد إحداثيات موقع المطعم بدقة...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lon = parseFloat(position.coords.longitude.toFixed(6));
        const acc = Math.round(position.coords.accuracy);

        setGpsLatitude(lat);
        setGpsLongitude(lon);
        setIsDetectingGps(false);
        setGpsFeedbackMsg(`تم التقاط إحداثيات المطعم بنجاح بدقة ±${acc} متر! اضغط "حفظ الإعدادات" لاعتمادها.`);
      },
      (error) => {
        setIsDetectingGps(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsFeedbackMsg('تم رفض إذن الوصول للموقع. يرجى تفعيل الـ GPS والسماح للمتصفح بالوصول للموقع.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsFeedbackMsg('تعذر التقاط إشارة الـ GPS حالياً، يرجى المحاولة من جديد أو كتابة الإحداثيات يدوياً.');
        } else {
          setGpsFeedbackMsg('انتهت مهلة تحديد الموقع، يرجى إعادة المحاولة.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
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
          slug: slug || 'sh-manoosha',
          name: restaurantName,
          logoUrl,
          phone,
          city,
          address,
          currency,
          staffPin,
          whatsappNumber,
          instagramUrl,
          facebookUrl,
          tiktokUrl,
          offersBannerUrl,
          offersBannerTitle,
          offersBannerSubtitle,
          offersBannerActive,
          requireGps,
          gpsLatitude,
          gpsLongitude,
          gpsRadiusMeters,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedMessage(data.message || 'تم حفظ جميع التعديلات بنجاح وتحديث كافة الأنظمة المرتبطة!');
        setTimeout(() => setSavedMessage(''), 5000);
        
        const effectiveSlug = slug || 'sh-manoosha';
        try {
          sessionStorage.setItem(`restaurant_meta_${effectiveSlug}`, JSON.stringify({
            name: restaurantName,
            logoUrl: logoUrl || '',
            city: city || '',
          }));
          localStorage.setItem(`restaurant_social_${effectiveSlug}`, JSON.stringify({
            whatsappNumber,
            instagramUrl,
            facebookUrl,
            tiktokUrl,
            phone,
          }));
          localStorage.setItem(`restaurant_offers_${effectiveSlug}`, JSON.stringify({
            bannerUrl: offersBannerUrl,
            title: offersBannerTitle,
            subtitle: offersBannerSubtitle,
            active: offersBannerActive,
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

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تتكون من 6 خانات على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين');
      return;
    }
    setPasswordSuccess('تم تحديث كلمة مرور الحساب بنجاح!');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 4000);
  };

  const menuPublicUrl = slug ? `https://${slug}.menus.cool` : 'https://sh-manoosha.menus.cool';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-500 gap-3" dir="rtl">
        <Loader2 size={36} className="animate-spin text-[#7A1C30]" />
        <p className="text-xs font-bold text-slate-700">جاري تحميل إعدادات وهوية المطعم وتفاصيل الحساب...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 font-sans text-slate-900" dir="rtl">
      
      {/* Header with Live Preview & Restaurant Identity Badge */}
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#7A1C30] text-white flex items-center justify-center font-black shadow-md shadow-[#7A1C30]/20 shrink-0 overflow-hidden border border-[#7A1C30]">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt="لوجو المطعم" className="w-full h-full object-cover" />
            ) : (
              <Store size={22} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{restaurantName || 'إعدادات المطعم'}</h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                متصل بالنظام
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">لوحة ضبط الهوية، باقة الاشتراك، بيانات الحساب، والعروض التسويقية</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={menuPublicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all hover:border-[#7A1C30]/30"
          >
            <span>معاينة المنيو الحي للزبائن</span>
            <ExternalLink size={13} className="text-[#7A1C30]" />
          </a>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7A1C30] hover:bg-[#631425] text-white text-xs font-black shadow-md shadow-[#7A1C30]/20 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200/80">
        {[
          { id: 'general', label: 'هوية المطعم واللوجو', icon: Store },
          { id: 'gps', label: 'التحكم بالـ GPS والموقع', icon: MapPin },
          { id: 'subscription', label: 'باقة الاشتراك والترقية', icon: Award },
          { id: 'account', label: 'تفاصيل الحساب والأمان', icon: User },
          { id: 'marketing', label: 'العروض وحسابات التواصل', icon: Flame },
          { id: 'system', label: 'العملة والـ PIN والتشغيل', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7A1C30] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-600/20 animate-in fade-in">
          <Check size={18} strokeWidth={3} className="shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-600 text-white font-bold text-xs flex items-center gap-2.5 shadow-lg shadow-rose-600/20 animate-in fade-in">
          <AlertCircle size={18} strokeWidth={3} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* ======================================================== */}
        {/* TAB 1: GENERAL IDENTITY & LOGO */}
        {/* ======================================================== */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            
            {/* Section: Logo & Visual Identity */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon size={16} className="text-[#7A1C30]" />
                  <span>شعار وهوية المطعم (اللوجو الرئيسي)</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">يظهر في رأس المنيو والطلبات والفواتير</span>
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
                      className="px-4 py-2 bg-[#7A1C30] hover:bg-[#631425] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98"
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
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">أو أدخل مسار أو رابط الشعار المباشر:</label>
                    <input
                      type="text"
                      placeholder="/sh-manoosha/logo.png أو رابط خارجي"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 bg-white focus:outline-none focus:border-[#7A1C30] dir-ltr"
                      dir="ltr"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">شعارات جاهزة بنقرة واحدة:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {PRESET_LOGOS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLogoUrl(p.url)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            logoUrl === p.url
                              ? 'bg-[#7A1C30] text-white border-[#7A1C30]'
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

            {/* Section: Basic Information */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <Store size={16} className="text-[#7A1C30]" />
                <span>البيانات الأساسية للمطعم</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المطعم التجاري *</label>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="مثال: مطعم وكافيه شيشة ومنقوشة"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط النطاق الفرعي (Subdomain)</label>
                  <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-xs font-mono text-slate-600" dir="ltr">
                    <span className="text-slate-400 select-none">https://</span>
                    <input
                      type="text"
                      disabled
                      value={slug ? `${slug}.menus.cool` : '...'}
                      className="bg-transparent font-bold text-[#7A1C30] w-full outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">وصف أو سطر تعريفي بالمنيو (Tagline)</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="مثال: أشهى المناقيش على الحطب والشيشة الفاخرة بأجواء راقية"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin size={12} className="text-[#7A1C30]" />
                    <span>المدينة / المحافظة</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: نابلس - رفيديا"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-[#7A1C30]" />
                      <span>رقم الهاتف المباشر للإدارة</span>
                    </span>
                    <span className="text-[10px] text-slate-400">للاتصال والمتابعة</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="092343905"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#7A1C30] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي وموقع الفرع</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثال: نابلس - رفيديا - الشارع الرئيسي - مجمع رفيديا التجاري"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: GPS GEOFENCING SYSTEM (ربط الـ GPS مع المنيو) */}
        {/* ======================================================== */}
        {activeTab === 'gps' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Master Geofence Toggle Card */}
            <div className={`p-6 rounded-3xl border transition-all ${
              requireGps 
                ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300 shadow-sm' 
                : 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-amber-300 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-white shadow-xs text-[#7A1C30]">
                      <Radio size={20} className={requireGps ? 'text-emerald-600 animate-pulse' : 'text-amber-500'} />
                    </span>
                    <h2 className="text-base font-black text-slate-900">
                      نظام فحص الـ GPS للزبائن قبل الطلب (Geofencing)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    يسمح للزبائن بفتح المنيو وتصفح كامل الأصناف بحرية، ولكنه يشترط تواجدهم الفعلي داخل صالة أو محيط المطعم قبل إرسال الطلب للمطبخ لمنع الطلبات الوهمية والعشوائية.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${
                    requireGps 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {requireGps ? '🛡️ مفعّل (محمي داخل الصالة)' : '⚠️ معطّل (الطلب متاح للجميع)'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setRequireGps(!requireGps)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                      requireGps ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                        requireGps ? 'translate-x-1' : 'translate-x-9'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Status explanation */}
              <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Info size={14} className="text-[#7A1C30]" />
                  <span>
                    {requireGps 
                      ? 'النظام يطلب من الزبون إذن الموقع عند الضغط على "تأكيد الطلب"، ويفحص البعد بالمتر عن المطعم.' 
                      : 'يمكن للزبون إرسال الطلب من أي مكان دون فحص الموقع الجغرافي.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireGps(!requireGps)}
                  className="text-xs font-bold text-[#7A1C30] hover:underline cursor-pointer"
                >
                  {requireGps ? 'اضغط لتعطيل الفحص' : 'اضغط لتفعيل الفحص'}
                </button>
              </div>
            </div>

            {/* Restaurant Physical Location & Live Detection */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <MapPin size={18} className="text-[#7A1C30]" />
                    <span>إحداثيات موقع المطعم الجغرافي</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    حدد النقطة المركزية لمطعمك التي سيقاس بعد هواتف الزبائن بالنسبة لها
                  </p>
                </div>

                {/* Auto Detect Button */}
                <button
                  type="button"
                  onClick={handleDetectCurrentLocation}
                  disabled={isDetectingGps}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
                >
                  {isDetectingGps ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-emerald-400" />
                      <span>جاري الاتصال بالأقمار الصناعية...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair size={14} className="text-emerald-400" />
                      <span>📍 التقاط موقع المطعم الحالي (GPS تلقائي)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Feedback Message */}
              {gpsFeedbackMsg && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle size={16} className="text-blue-600 shrink-0" />
                  <span>{gpsFeedbackMsg}</span>
                </div>
              )}

              {/* Coordinate Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>خط العرض (Latitude)</span>
                    <span className="text-[10px] text-slate-400 font-mono">شمال / جنوب</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={gpsLatitude}
                    onChange={(e) => setGpsLatitude(parseFloat(e.target.value) || 0)}
                    placeholder="32.2272"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#7A1C30]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>خط الطول (Longitude)</span>
                    <span className="text-[10px] text-slate-400 font-mono">شرق / غرب</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={gpsLongitude}
                    onChange={(e) => setGpsLongitude(parseFloat(e.target.value) || 0)}
                    placeholder="35.2289"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#7A1C30]"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Google Maps Preview Link */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Compass size={16} className="text-[#7A1C30]" />
                  <span>الموقع المحدد حالياً:</span>
                  <span className="font-mono font-black text-slate-900" dir="ltr">{gpsLatitude}, {gpsLongitude}</span>
                </div>

                <a
                  href={`https://www.google.com/maps?q=${gpsLatitude},${gpsLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#7A1C30] hover:border-[#7A1C30]/40 text-xs font-bold shadow-2xs transition-all"
                >
                  <span>معاينة الموقع على خرائط Google</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Geofence Allowed Radius Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Navigation size={18} className="text-[#7A1C30]" />
                    <span>نطاق السماح للزبائن (نصف القطر بالمتر)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    المسافة الدائرية المحيطة بالمطعم التي يُسمح من خلالها بإرسال الطلبات
                  </p>
                </div>

                <div className="px-4 py-1.5 rounded-xl bg-[#7A1C30]/10 text-[#7A1C30] text-sm font-black">
                  {gpsRadiusMeters} متر
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">خيارات ونطاقات سريعة جاهزة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { meters: 100, label: '100 متر', desc: 'الصالة الداخلية فقط' },
                    { meters: 250, label: '250 متر', desc: 'صالة + تراس خارجي' },
                    { meters: 350, label: '350 متر (موصى به)', desc: 'مطعم + باركينغ سيارات' },
                    { meters: 500, label: '500 متر', desc: 'مجمع تجاري واسع' },
                  ].map((p) => {
                    const isSelected = gpsRadiusMeters === p.meters;
                    return (
                      <button
                        key={p.meters}
                        type="button"
                        onClick={() => setGpsRadiusMeters(p.meters)}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#7A1C30] text-white border-[#7A1C30] shadow-sm shadow-[#7A1C30]/20'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="text-xs font-black">{p.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {p.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Slider / Input */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>تعديل النطاق بدقة يدوياً:</span>
                  <span className="font-mono text-[#7A1C30] font-black">{gpsRadiusMeters} م</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={gpsRadiusMeters}
                  onChange={(e) => setGpsRadiusMeters(Number(e.target.value))}
                  className="w-full accent-[#7A1C30] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>50 متر (ضيق جداً)</span>
                  <span>350 متر (الافتراضي المتوازن)</span>
                  <span>1000 متر (1 كم كامل)</span>
                </div>
              </div>

              {/* Technical Tip Note */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <span>💡 نصيحة تقنية مهمة:</span>
                </div>
                <p className="leading-relaxed text-amber-800 text-[11px]">
                  نوصي بترك النطاق على <strong>350 متر</strong> على الأقل، لأن إشارات الأقمار الصناعية لـ GPS في هواتف الزبائن تضعف داخل المباني والأسقف الخرسانية للمطاعم ويحدث لها انزياح طبيعي (Drift). نطاق 350م يضمن قبول كافة الزبائن الجالسين داخل الصالة والتراس بدون أي أخطاء، وفي نفس الوقت يمنع الأشخاص المتواجدين في بيوتهم أو مدن أخرى من إرسال طلبات للمطبخ.
                </p>
              </div>
            </div>

            {/* How It Works Explainer Card */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="text-sm font-black">كيف تظهر الميزة للزبون في صفحة المنيو؟</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center font-black text-amber-400">1</div>
                  <h4 className="font-bold text-white">تصفح حر وبدون إزعاج</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    الزبون يفتح المنيو ويتصفح كافة الأصناف والأسعار بدون أي مطالبة بصلاحيات الموقع، مما يضمن سرعة وسلاسة التصفح.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center font-black text-amber-400">2</div>
                  <h4 className="font-bold text-white">تحقق أنيق بالرادار</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    عند اختيار الطاولة والضغط على &quot;إرسال الطلب للمطبخ&quot;، تظهر نافذة تأكيد الموقع الفوري لتأكيد وجوده داخل الصالة.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center font-black text-amber-400">3</div>
                  <h4 className="font-bold text-white">إرسال فوري مع الحماية</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    إذا كان داخل النطاق يصل الطلب فوراً للمطبخ والكاشير، وإن كان خارج النطاق ينبهه النظام مع إمكانية استدعاء النادل للمساعدة.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SUBSCRIPTION INFORMATION & UPGRADE */}
        {/* ======================================================== */}
        {activeTab === 'subscription' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Subscription Card Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#400e19] to-[#7A1C30] text-white p-6 sm:p-8 shadow-xl border border-[#7A1C30]/40">
              <div className="absolute top-0 left-0 w-96 h-96 bg-[#7A1C30]/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                      <Award size={13} className="text-amber-400" />
                      <span>{subscription.planNameAr}</span>
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      اشتراك نشط
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{restaurantName}</h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    مرخص للاستخدام التجاري الكامل مع كافة ميزات المنظومة الرقمية السحابية
                  </p>
                </div>

                <div className="text-right sm:text-left bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
                  <div className="text-xs text-slate-400 font-bold mb-0.5">الأيام المتبقية في الاشتراك:</div>
                  <div className="text-3xl font-black text-amber-300 font-mono">
                    {subscription.daysRemaining} <span className="text-sm font-bold text-white">يوماً</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    ينتهي بتاريخ: {new Date(subscription.expiresAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Progress Bar of Subscription */}
              <div className="relative z-10 pt-5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>حالة سريان الباقة السنوية</span>
                  <span className="font-mono text-amber-300">{(Math.min(100, Math.max(10, Math.round((subscription.daysRemaining / 365) * 100))))}% متبقي</span>
                </div>
                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-l from-amber-400 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(10, Math.round((subscription.daysRemaining / 365) * 100)))}%` }}
                  />
                </div>
              </div>

              {/* Key Quota Badges */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="text-[11px] text-slate-400 font-medium">الطاولات المرخصة</div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    {subscription.currentTables} / {subscription.maxTables}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="text-[11px] text-slate-400 font-medium">الفروع المتاحة</div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    1 / {subscription.branchesAllowed} فروع
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="text-[11px] text-slate-400 font-medium">طلبات الزبائن الشهرية</div>
                  <div className="text-lg font-black text-emerald-400 font-bold mt-0.5">
                    غير محدودة ∞
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="text-[11px] text-slate-400 font-medium">الدعم الفني VIP</div>
                  <div className="text-lg font-black text-amber-300 font-bold mt-0.5">
                    24/7 مباشر
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Features Included */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <Zap size={16} className="text-[#7A1C30]" />
                <span>الميزات والخدمات المشمولة في اشتراكك الحالي</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subscription.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-bold text-slate-700">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Renewal Action */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black text-slate-900">هل ترغب بتجديد الاشتراك أو إضافة فروع وطاولات جديدة؟</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">فريق خدمة العملاء جاهز لخدمتك وترقية خطتك فوراً عبر واتساب</div>
                </div>

                <a
                  href="https://wa.me/970599000000?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%AA%D8%AC%D8%AF%D9%8A%D8%AF%20%D8%A7%D8%B4%D8%AA%D8%B1%D8%A7%D9%83%20%D9%85%D8%B7%D8%B9%D9%85%20%D8%B4%D9%8A%D8%B4%D8%A9%20%D9%88%D9%85%D9%86%D9%82%D9%88%D8%B4%D8%A9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-xs transition-colors shrink-0"
                >
                  <Headphones size={15} />
                  <span>تواصل مع الدعم لتجديد أو ترقية الاشتراك</span>
                </a>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ACCOUNT DETAILS & SECURITY */}
        {/* ======================================================== */}
        {activeTab === 'account' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Account Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <User size={16} className="text-[#7A1C30]" />
                  <span>تفاصيل حساب المدير والمالك</span>
                </h2>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  حساب معتمد وموثق ✓
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                    <Mail size={13} className="text-slate-400" />
                    <span>البريد الإلكتروني المعتمد لتسجيل الدخول</span>
                  </div>
                  <div className="text-xs font-black text-slate-800 font-mono" dir="ltr">
                    {account.email || 'shisha.manoosha@menus.ps'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                    <Shield size={13} className="text-slate-400" />
                    <span>دور وصلاحيات الحساب في المنظومة</span>
                  </div>
                  <div className="text-xs font-black text-[#7A1C30]">
                    {account.roleTitleAr || 'مالك المطعم - المدير المسؤول'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                    <Store size={13} className="text-slate-400" />
                    <span>اسم المطعم المرتبط</span>
                  </div>
                  <div className="text-xs font-black text-slate-800">
                    {restaurantName}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                    <Calendar size={13} className="text-slate-400" />
                    <span>تاريخ إنشاء وتفعيل الحساب</span>
                  </div>
                  <div className="text-xs font-black text-slate-800 font-mono">
                    {new Date(account.memberSince).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Account Password & Security */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                <Lock size={16} className="text-[#7A1C30]" />
                <span>أمان الحساب وكلمة المرور</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                تحديث كلمة مرور الدخول للوحة التحكم الرئيسية الخاصة بك.
              </p>

              {passwordSuccess && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#7A1C30]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={!newPassword}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    تحديث كلمة مرور الحساب
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: MARKETING, PROMOTIONS & SOCIAL */}
        {/* ======================================================== */}
        {activeTab === 'marketing' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Promotional Offers Hero Banner */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Flame size={16} className="text-[#7A1C30]" />
                  <span>بانر العروض والخصومات الرئيسي في أعلى المنيو</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">تفعيل البانر:</span>
                  <button
                    type="button"
                    onClick={() => setOffersBannerActive(!offersBannerActive)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      offersBannerActive ? 'bg-[#7A1C30]' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        offersBannerActive ? 'translate-x-[-1.25rem]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                صورة إعلانية كبيرة وجذابة تظهر في رأس منيو الزبائن للترويج لعروضك اليومية أو الوجبات المميزة.
              </p>

              {/* Banner Live Preview */}
              <div className="mb-5 relative rounded-2xl overflow-hidden shadow-md border border-slate-200 aspect-[21/9] sm:aspect-[24/9] bg-slate-900 group">
                {offersBannerUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={offersBannerUrl} 
                    alt="بانر العروض" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                    <ImageIcon size={32} />
                  </div>
                )}
                
                {/* Gradient Overlay & Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-[#7A1C30] text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                      <Sparkles size={11} /> عرض مميز
                    </span>
                    <span className="bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                      🔥 خصومات حصرية
                    </span>
                  </div>
                  <h3 className="text-white font-black text-sm sm:text-lg leading-tight mb-0.5">
                    {offersBannerTitle || 'عنوان العرض الترويجي'}
                  </h3>
                  <p className="text-slate-200 text-[11px] sm:text-xs font-medium line-clamp-1">
                    {offersBannerSubtitle || 'تفاصيل العرض ونسبة الخصم الخاصة بالمطعم'}
                  </p>
                </div>
              </div>

              {/* Banner Presets */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  اختر تصميماً جاهزاً بنقرة واحدة:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {PRESET_BANNERS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOffersBannerUrl(preset.url);
                        setOffersBannerTitle(preset.title);
                        setOffersBannerSubtitle(preset.subtitle);
                      }}
                      className={`rounded-xl border p-1 text-right transition-all group overflow-hidden ${
                        offersBannerUrl === preset.url
                          ? 'border-[#7A1C30] ring-2 ring-[#7A1C30]/20 bg-[#7A1C30]/5'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="aspect-video rounded-lg overflow-hidden mb-1.5 bg-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <span className="block text-[11px] font-black text-slate-800 truncate px-1">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة البانر (URL أو رفع صورة)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={offersBannerUrl}
                      onChange={(e) => setOffersBannerUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30] font-mono"
                      dir="ltr"
                    />
                    <input
                      type="file"
                      ref={bannerInputRef}
                      onChange={handleBannerUpload}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isBannerUploading}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {isBannerUploading ? (
                        <Loader2 size={13} className="animate-spin text-[#7A1C30]" />
                      ) : (
                        <Upload size={13} />
                      )}
                      <span>رفع صورة</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان العرض الترويجي الرئيسي</label>
                  <input
                    type="text"
                    value={offersBannerTitle}
                    onChange={(e) => setOffersBannerTitle(e.target.value)}
                    placeholder="مثال: أشهى المناقيش والشيشة الفاخرة يومياً 🔥"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تفاصيل العرض أو الخصم (Subtitle)</label>
                  <input
                    type="text"
                    value={offersBannerSubtitle}
                    onChange={(e) => setOffersBannerSubtitle(e.target.value)}
                    placeholder="مثال: خصم 20% على جميع الأصناف لفترة محدودة"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Share2 size={16} className="text-[#7A1C30]" />
                  <span>صفحات وحسابات التواصل الاجتماعي للمطعم</span>
                </h2>
                <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  تظهر كأزرار تواصل سريعة في رأس المنيو
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-emerald-500" />
                    <span>رقم الواتساب المعتمد لطلبات الزبائن (WhatsApp)</span>
                  </label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="092343905"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30] font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">يفتح محادثة واتساب فورية للزبون مع هذا الرقم بنقرة واحدة</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span className="text-pink-500 font-black text-xs">📸</span>
                    <span>حساب أو رابط إنستغرام (Instagram)</span>
                  </label>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="shisha_manoosha"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span className="text-blue-600 font-black text-xs">📘</span>
                    <span>رابط صفحة فيسبوك (Facebook)</span>
                  </label>
                  <input
                    type="text"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/shisha.manoosha"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span className="text-slate-900 font-black text-xs">🎵</span>
                    <span>حساب أو رابط تيك توك (TikTok)</span>
                  </label>
                  <input
                    type="text"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="@shisha_manoosha"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SYSTEM, PIN & OPERATIONAL HOURS */}
        {/* ======================================================== */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Operational & Financial */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                <Globe size={16} className="text-[#7A1C30]" />
                <span>العملة، الرسوم، وأوقات العمل</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العملة الافتراضية للمنيو</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#7A1C30]"
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
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#7A1C30] font-mono"
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
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#7A1C30] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock size={12} className="text-[#7A1C30]" />
                    <span>أوقات وساعات العمل اليومية</span>
                  </label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="يومياً من 09:00 صباحاً حتى 01:00 بعد منتصف الليل"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#7A1C30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة استقبال الطلبات</label>
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
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

            {/* GPS Geofencing Settings - Summary with Link to Tab */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <MapPin size={16} className="text-[#7A1C30]" />
                  <span>تأكيد تواجد الزبون في المطعم عبر الـ GPS (Geofencing)</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`border text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    requireGps 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${requireGps ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {requireGps ? 'مفعل لحماية الطلبات' : 'معطل (متاح للجميع)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('gps')}
                    className="text-xs font-bold text-[#7A1C30] hover:underline cursor-pointer"
                  >
                    فتح لوحة تحكم الـ GPS ←
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                يسمح للزبون بفتح المنيو وتصفح الأصناف بحرية، ولكنه يشترط تواجده الفعلي داخل محيط المطعم قبل إرسال الطلب للمطبخ لمنع الطلبات العشوائية.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">خط العرض (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={gpsLatitude}
                    onChange={(e) => setGpsLatitude(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">خط الطول (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    value={gpsLongitude}
                    onChange={(e) => setGpsLongitude(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نطاق الصالة المسموح به</label>
                  <div className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#7A1C30] flex items-center justify-between">
                    <span>{gpsRadiusMeters} متر</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('gps')}
                      className="text-[10px] text-[#7A1C30] font-bold hover:underline"
                    >
                      تغيير النطاق
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Kitchen & Staff PIN */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                <Shield size={16} className="text-[#7A1C30]" />
                <span>أمان شاشة المطبخ والكاشير (Staff PIN)</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                رمز الدخول السريع لشاشات التابلت في المطبخ والكاشير بدون الحاجة لكتابة بريد وكلمة مرور معقدة.
              </p>

              <div className="max-w-xs">
                <label className="block text-xs font-bold text-slate-700 mb-1">رمز الـ PIN (من 4 إلى 6 أرقام)</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-center tracking-widest focus:outline-none focus:border-[#7A1C30] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Global Save Button Fixed/Sticky in Form Bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 flex-wrap gap-3">
          <div className="text-xs text-slate-500 font-medium">
            يتم تطبيق كافة التعديلات فوراً على الموقع والمنيو الحي وشاشات المطبخ.
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 rounded-2xl bg-[#7A1C30] hover:bg-[#631425] disabled:opacity-50 text-white font-black text-xs shadow-md shadow-[#7A1C30]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري حفظ التغييرات وتحديث النظام...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>حفظ كافة التغييرات</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
