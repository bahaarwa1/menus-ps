'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Globe, CheckCircle2, XCircle, Loader2, Phone, 
  MapPin, Lock, Mail, Sparkles, QrCode, 
  ExternalLink, Copy, Check, ChefHat, BarChart3, Eye, EyeOff, AlertTriangle
} from 'lucide-react';
import { registerRestaurantAction } from '@/app/actions/register-restaurant';
import { RegisteredRestaurantResult } from '@/lib/db/repositories/restaurant.repository';
import Logo from '@/components/common/Logo';

// --- Validation helpers ---
function validateEmail(email: string): string {
  if (!email) return '';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return 'البريد الإلكتروني غير صحيح (مثال: owner@restaurant.ps)';
  return '';
}

function validatePhone(phone: string): string {
  if (!phone) return 'رقم الهاتف مطلوب';
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const palLocal = /^05[0-9]{8}$/;
  const palIntl = /^\+9725[0-9]{8}$/;
  const palIntl2 = /^00972[0-9]{9}$/;
  if (!palLocal.test(cleaned) && !palIntl.test(cleaned) && !palIntl2.test(cleaned)) {
    return 'رقم الهاتف غير صحيح. صيغ مقبولة: 0599000000 أو +972599000000';
  }
  return '';
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  errors: string[];
}

function checkPasswordStrength(password: string): PasswordStrength {
  const errors: string[] = [];
  if (password.length < 8) errors.push('8 أحرف على الأقل');
  if (!/[A-Z]/.test(password)) errors.push('حرف كبير واحد على الأقل');
  if (!/[0-9]/.test(password)) errors.push('رقم واحد على الأقل');
  const score = 4 - errors.length - (password.length < 6 ? 1 : 0);
  const safeScore = Math.max(0, Math.min(4, score));
  const labels = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جداً'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-600'];
  return { score: safeScore, label: labels[safeScore], color: colors[safeScore], errors };
}

const PALESTINIAN_CITIES = [
  'نابلس',
  'رام الله والبيرة',
  'القدس',
  'الخليل',
  'بيت لحم',
  'جنين',
  'طولكرم',
  'قلقيلية',
  'أريحا',
  'سلفيت',
  'طوباس',
  'الداخل 48',
  'غزة',
];

// Simple helper to auto-convert common Arabic words to clean english slugs
function convertNameToSlug(name: string): string {
  if (!name) return '';

  // Arabic phonetic dictionary for common words
  const dict: Record<string, string> = {
    'برجر': 'burger',
    'بيتزا': 'pizza',
    'شاورما': 'shawarma',
    'كافيه': 'cafe',
    'قهوة': 'coffee',
    'مطعم': 'restaurant',
    'هاوس': 'house',
    'فاكتوري': 'factory',
    'سناك': 'snack',
    'جريل': 'grill',
    'شيف': 'chef',
    'طابون': 'taboon',
    'القدس': 'quds',
    'نابلس': 'nablus',
    'رام': 'ram',
    'الله': 'allah',
    'خليل': 'khalil',
    'رويال': 'royal',
    'كنج': 'king',
    'كلاسيك': 'classic',
  };

  let clean = name.trim().toLowerCase();
  for (const [ar, en] of Object.entries(dict)) {
    clean = clean.replace(new RegExp(ar, 'g'), en);
  }

  let slug = clean
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  if (!slug || slug.length < 2) {
    slug = 'restaurant-' + Math.floor(100 + Math.random() * 900);
  }

  return slug.substring(0, 25);
}

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();

  // Form State
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManualEdit, setSlugManualEdit] = useState(false);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('نابلس');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tablesCount, setTablesCount] = useState(10);

  // Inline field errors
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const pwdStrength = checkPasswordStrength(password);

  // Validation State
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugMessage, setSlugMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Success State
  const [createdRestaurant, setCreatedRestaurant] = useState<RegisteredRestaurantResult | null>(null);


  // Auto-generate slug as user types restaurant name
  useEffect(() => {
    if (!slugManualEdit && restaurantName.trim()) {
      const generated = convertNameToSlug(restaurantName);
      setSlug(generated);
    }
  }, [restaurantName, slugManualEdit]);

  // Debounced check for slug availability
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      setSlugMessage('');
      return;
    }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (data.available) {
          setSlugStatus('available');
          setSlugMessage('الرابط متاح وجاهز للحجز والتفعيل فوراً');
        } else {
          setSlugStatus('taken');
          setSlugMessage(data.reason || 'هذا الرابط غير متاح، يرجى تجربة اسم آخر');
        }
      } catch {
        setSlugStatus('idle');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // --- Client-side validation ---
    if (!restaurantName.trim() || restaurantName.trim().length < 2) {
      setFormError('يرجى إدخال اسم المطعم (حرفان على الأقل)');
      return;
    }
    if (restaurantName.trim().length > 60) {
      setFormError('اسم المطعم طويل جداً (60 حرف كحد أقصى)');
      return;
    }

    if (slugStatus === 'taken' || slug.length < 3) {
      setFormError('يرجى اختيار رابط صالح ومتاح للمطعم (3 أحرف على الأقل)');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
      setFormError('الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط');
      return;
    }

    // Phone validation
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setFormError(phoneErr);
      setPhoneError(phoneErr);
      return;
    }

    // Email validation (if provided)
    if (ownerEmail.trim()) {
      const emailErr = validateEmail(ownerEmail.trim());
      if (emailErr) {
        setFormError(emailErr);
        setEmailError(emailErr);
        return;
      }
    }

    // Password validation
    if (!password || password.length < 8) {
      setFormError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setFormError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setFormError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل (0-9)');
      return;
    }

    startTransition(async () => {
      const res = await registerRestaurantAction({
        name: restaurantName,
        slug,
        phone,
        city,
        ownerEmail,
        password,
        tablesCount,
      });

      if (!res.success || !res.restaurant) {
        setFormError(res.error || 'حدث خطأ أثناء إنشاء المطعم');
        return;
      }

      setCreatedRestaurant(res.restaurant);
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-white relative overflow-hidden">
      
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -right-[10%] w-[60%] h-[60%] rounded-full bg-orange-500/5 blur-[120px]"></div>
        <div className="absolute top-[50%] -left-[10%] w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      <main className="w-full max-w-xl z-10 my-6">
        <AnimatePresence mode="wait">
          {!createdRestaurant ? (
            /* =============================================================
               REGISTRATION FORM (COMPACT, EYE-FRIENDLY & MODERN)
               ============================================================= */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] border border-slate-100 p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500"></div>

              {/* Single Official Logo & Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <Logo size="md" href="/" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                  تسجيل مطعم جديد
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  تفعيل فوري خلال 30 ثانية • تجربة مجانية 14 يوماً بدون بطاقة
                </p>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <XCircle size={15} className="shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 1. Restaurant Name & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Store size={14} className="text-orange-500" />
                      <span>اسم المطعم أو الكافيه *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: برجر هاوس"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin size={14} className="text-orange-500" />
                      <span>المدينة *</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 text-xs font-bold focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all cursor-pointer"
                    >
                      {PALESTINIAN_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-white text-slate-900">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Subdomain Slug Engine */}
                <div className="bg-slate-50/90 border border-slate-200/80 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Globe size={14} className="text-orange-500" />
                      <span>رابط موقعك الحصري (Subdomain) *</span>
                    </label>
                    <span className="text-[10px] text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-full font-bold">
                      تلقائي
                    </span>
                  </div>

                  <div className="flex items-center rounded-xl bg-white border border-slate-200 overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/15 transition-all">
                    <span className="px-2.5 py-2 bg-slate-100/80 text-slate-500 text-xs font-bold border-l border-slate-200 select-none">
                      https://
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => {
                        setSlugManualEdit(true);
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      }}
                      placeholder="اسم-المطعم"
                      className="flex-1 px-2.5 py-2 bg-transparent text-orange-600 font-mono font-bold text-xs focus:outline-none placeholder-slate-400"
                    />
                    <span className="px-2.5 py-2 bg-slate-100/80 text-slate-500 text-[11px] font-bold border-r border-slate-200 select-none">
                      .menus-ps.vercel.app
                    </span>
                  </div>

                  {/* Slug Status */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold">
                    {slugStatus === 'checking' && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin text-orange-500" />
                        <span>جاري فحص الرابط...</span>
                      </span>
                    )}
                    {slugStatus === 'available' && (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        <span>{slugMessage}</span>
                      </span>
                    )}
                    {slugStatus === 'taken' && (
                      <span className="text-rose-600 flex items-center gap-1">
                        <XCircle size={13} />
                        <span>{slugMessage}</span>
                      </span>
                    )}
                    {slugStatus === 'idle' && (
                      <span className="text-slate-400 text-[10px]">
                        رابط مباشر لمنيو الزبائن على الطاولات.
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Phone & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Phone size={14} className="text-orange-500" />
                      <span>رقم الهاتف للتواصل *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0599000000"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                      onBlur={() => setPhoneError(validatePhone(phone))}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 border text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono ${
                        phoneError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/15'
                      }`}
                    />
                    {phoneError && (
                      <p className="text-rose-600 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> {phoneError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Lock size={14} className="text-orange-500" />
                      <span>كلمة المرور للوحة التحكم *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {/* Compact Password Strength */}
                    {password.length > 0 && (
                      <div className="mt-1.5">
                        <div className="flex gap-1 mb-1">
                          {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                              i < pwdStrength.score ? pwdStrength.color : 'bg-slate-200'
                            }`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          قوة كلمة المرور: <span className="text-slate-800">{pwdStrength.label}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" />
                    <span>البريد الإلكتروني للإدارة (اختياري)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="owner@restaurant.ps"
                    value={ownerEmail}
                    onChange={(e) => { setOwnerEmail(e.target.value); setEmailError(''); }}
                    onBlur={() => ownerEmail.trim() && setEmailError(validateEmail(ownerEmail.trim()))}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50/80 border text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      emailError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/15'
                    }`}
                  />
                  {emailError && (
                    <p className="text-rose-600 text-[10px] font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} /> {emailError}
                    </p>
                  )}
                </div>

                {/* 4. Tables Count Selector */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">عدد طاولات البداية:</span>
                    <span className="text-[10px] text-slate-400">توليد أكواد QR فورية للطاولات</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 15, 20].map((count) => (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setTablesCount(count)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          tablesCount === count
                            ? 'bg-orange-500 text-white shadow-xs scale-105'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending || slugStatus === 'taken'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري حجز الرابط وتهيئة الطاولات...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>إنشاء موقع المطعم وتفعيل الرابط 🚀</span>
                    </>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500 font-medium">
                    لديك حساب بالفعل؟{' '}
                    <Link href="/login" className="text-orange-600 hover:text-orange-700 font-black hover:underline">
                      تسجيل الدخول
                    </Link>
                  </p>
                </div>

              </form>
            </motion.div>
          ) : (
            /* =============================================================
               SUCCESS SCREEN (INSTANT AUTO-PROVISIONING COMPLETE)
               ============================================================= */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] text-center relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500"></div>

              <div className="flex justify-center mb-3">
                <Logo size="md" href="/" />
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CheckCircle2 size={26} />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                تهانينا! موقع مطعمك متاح الآن 🎉
              </h2>
              <p className="text-slate-500 text-xs mb-5 font-medium">
                تم حجز الرابط، وإنشاء <strong className="text-slate-800">{createdRestaurant.tablesCount} طاولات</strong> بأكواد QR جاهزة للاستخدام.
              </p>

              {/* Subdomain URL Box */}
              <div className="bg-slate-50 border border-orange-200 rounded-xl p-3 mb-5 text-right">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  رابط منيو مطعمك المباشر:
                </span>
                <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2 shadow-xs">
                  <span className="font-mono text-xs font-bold text-orange-600 select-all truncate" dir="ltr">
                    {`https://menus-ps.vercel.app/r/${createdRestaurant.slug}`}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyUrl(`https://menus-ps.vercel.app/r/${createdRestaurant.slug}`)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                    <a
                      href={`/r/${createdRestaurant.slug}`}
                      target="_blank"
                      className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                      title="فتح منيو المطعم"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
                <Link
                  href={`/dashboard?created=${createdRestaurant.slug}`}
                  className="p-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98"
                >
                  <BarChart3 size={18} />
                  <span>لوحة التحكم</span>
                </Link>

                <Link
                  href={`/m?restaurant=${createdRestaurant.slug}`}
                  target="_blank"
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-200 transition-all shadow-xs"
                >
                  <QrCode size={18} className="text-orange-500" />
                  <span>معاينة المنيو</span>
                </Link>

                <Link
                  href="/staff"
                  target="_blank"
                  className="p-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-200 transition-all shadow-xs"
                >
                  <ChefHat size={18} className="text-emerald-600" />
                  <span>شاشة المطبخ</span>
                </Link>
              </div>

              {/* Table QR Link */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-bold text-slate-700">الأكواد جاهزة للطباعة على الطاولات</span>
                <Link
                  href={`/dashboard/tables?created=${createdRestaurant.slug}`}
                  className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 text-xs"
                >
                  <span>طباعة الستاندات</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}
