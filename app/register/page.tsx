'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Globe, CheckCircle2, XCircle, Loader2, Phone, 
  MapPin, Lock, Mail, Sparkles, QrCode, 
  ExternalLink, Copy, Check, ChefHat, BarChart3, Eye, EyeOff, AlertTriangle, Lightbulb
} from 'lucide-react';
import { registerRestaurantAction } from '@/app/actions/register-restaurant';
import { RegisteredRestaurantResult } from '@/lib/db/repositories/restaurant.repository';
import Logo from '@/components/common/Logo';

// --- Validation helpers ---
function validateEmail(email: string): string {
  if (!email || !email.trim()) return 'البريد الإلكتروني للإدارة مطلوب (لتسجيل الدخول واستعادة الحساب)';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email.trim())) return 'البريد الإلكتروني غير صحيح (مثال: owner@restaurant.ps)';
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

const CITY_SLUG_MAP: Record<string, string> = {
  'نابلس': 'nablus',
  'رام الله والبيرة': 'ramallah',
  'القدس': 'quds',
  'الخليل': 'khalil',
  'بيت لحم': 'bethlehem',
  'جنين': 'jenin',
  'طولكرم': 'tulkarm',
  'قلقيلية': 'qalqilya',
  'أريحا': 'jericho',
  'سلفيت': 'salfit',
  'طوباس': 'tubas',
  'الداخل 48': '48',
  'غزة': 'gaza',
};

// Comprehensive Arabic dictionary for food & restaurant businesses
const ARABIC_WORD_DICT: Record<string, string> = {
  'برجر': 'burger', 'همبرغر': 'burger', 'همبرجر': 'burger',
  'بيتزا': 'pizza',
  'شاورما': 'shawarma', 'شاورمتنا': 'shawarma',
  'كافيه': 'cafe', 'مقهى': 'cafe', 'قهوة': 'coffee', 'كوفي': 'coffee',
  'مطعم': 'restaurant', 'مطاعم': 'restaurants',
  'مشاوي': 'mashawi', 'مشويات': 'grill', 'مشوي': 'grill',
  'فطاير': 'fatayer', 'فطائر': 'fatayer', 'معجنات': 'pastries',
  'طابون': 'taboon', 'فرن': 'bakery', 'مخبز': 'bakery',
  'فلافل': 'falafel', 'حمص': 'hummus', 'فول': 'foul',
  'دجاج': 'chicken', 'شيكن': 'chicken', 'بروستد': 'broasted', 'كرسبي': 'crispy',
  'سناك': 'snack', 'سناكات': 'snacks', 'سندويش': 'sandwich', 'سندويشات': 'sandwiches',
  'حلويات': 'sweets', 'حلو': 'sweet', 'كنافة': 'knafeh', 'وافل': 'waffle', 'بانكيك': 'pancake',
  'عصير': 'juice', 'عصائر': 'juice', 'كوكتيل': 'cocktail',
  'هاوس': 'house', 'بيت': 'house', 'دار': 'dar',
  'فاكتوري': 'factory', 'مصنع': 'factory',
  'سلطان': 'sultan', 'السلطان': 'sultan',
  'ملك': 'king', 'الملك': 'king', 'ملوك': 'kings', 'امير': 'prince',
  'شيف': 'chef', 'الشيف': 'chef',
  'رويال': 'royal', 'كلاسيك': 'classic', 'سبيشال': 'special',
  'سيتي': 'city', 'ستي': 'city', 'مدينة': 'city',
  'سنتر': 'center', 'كورنر': 'corner', 'زاوية': 'corner',
  'ستار': 'star', 'نجمة': 'star', 'نجوم': 'stars',
  'الذهبي': 'golden', 'ذهب': 'gold',
  'طازة': 'fresh', 'طازج': 'fresh', 'فريش': 'fresh',
  'زاكي': 'zaki', 'لذيذ': 'tasty', 'يم': 'yummy',
  'كيفك': 'kifak', 'على كيفك': 'alakifak',
  'ابو': 'abu', 'ام': 'om', 'ابن': 'ibn',
  'روما': 'roma', 'باريس': 'paris', 'ميلانو': 'milano',
  'القدس': 'alquds', 'قدس': 'quds',
  'نابلس': 'nablus', 'رام الله': 'ramallah', 'خليل': 'khalil',
  'جنين': 'jenin', 'طولكرم': 'tulkarm', 'يافا': 'yafa', 'حيفا': 'haifa', 'عكا': 'akka', 'غزة': 'gaza',
  'الريان': 'alrayan', 'البركة': 'albaraka', 'الريف': 'alreef', 'الاصيل': 'alaseel', 'النور': 'alnoor',
  'البلدة': 'albalad', 'الحارة': 'alhara', 'الياسمين': 'alyasmeen', 'الزيتون': 'alzeitoun',
  'برغرايزر': 'burgerizer', 'برجر كينج': 'burgerking',
};

// Arabic character phonetic transliteration map
const ARABIC_CHAR_MAP: Record<string, string> = {
  'أ': 'a', 'إ': 'e', 'آ': 'a', 'ا': 'a', 'ء': 'a', 'ئ': 'e', 'ؤ': 'o',
  'ب': 'b', 'ت': 't', 'ة': 'a', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'th', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'o', 'ي': 'i', 'ى': 'a',
  'پ': 'p', 'چ': 'ch', 'ڤ': 'v', 'گ': 'g',
};

// Smart Arabic-to-English Transliteration Engine
function convertNameToSlug(name: string): string {
  if (!name || !name.trim()) return '';

  const words = name.trim().toLowerCase().split(/\s+/);
  const translatedWords = words.map((rawWord) => {
    // Strip diacritics
    const word = rawWord.replace(/[\u064B-\u065F\u0670]/g, '');

    // Check direct dictionary match
    if (ARABIC_WORD_DICT[word]) {
      return ARABIC_WORD_DICT[word];
    }

    // Check if word has "ال" prefix
    let cleanWord = word;
    let hasAlPrefix = false;
    if (cleanWord.startsWith('ال') && cleanWord.length > 3) {
      hasAlPrefix = true;
      const rootWord = cleanWord.substring(2);
      if (ARABIC_WORD_DICT[rootWord]) {
        return 'al-' + ARABIC_WORD_DICT[rootWord];
      }
    }

    // Phonetic letter-by-letter transliteration
    let out = hasAlPrefix ? 'al-' : '';
    const toTransliterate = hasAlPrefix ? cleanWord.substring(2) : cleanWord;
    
    for (let i = 0; i < toTransliterate.length; i++) {
      const char = toTransliterate[i];
      if (ARABIC_CHAR_MAP[char]) {
        out += ARABIC_CHAR_MAP[char];
      } else {
        out += char;
      }
    }
    return out;
  });

  let slug = translatedWords.join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug || slug.length < 2) {
    slug = 'restaurant-' + Math.floor(100 + Math.random() * 900);
  }

  return slug.substring(0, 25);
}

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  // Detect if user came from Google OAuth (email prefilled from URL)
  const initialGoogleEmail = searchParams.get('email') || '';
  const initialGoogleName = searchParams.get('name') || '';

  // Form State
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManualEdit, setSlugManualEdit] = useState(false);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('نابلس');
  const [ownerEmail, setOwnerEmail] = useState(initialGoogleEmail);
  const [isGoogleSignup, setIsGoogleSignup] = useState(Boolean(initialGoogleEmail));
  const [password, setPassword] = useState(
    initialGoogleEmail ? `Gg_${Math.random().toString(36).slice(2, 8)}X9!` : ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [tablesCount, setTablesCount] = useState(10);

  // Sync Google params when hydrated / updated
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setOwnerEmail(emailParam);
      setIsGoogleSignup(true);
      setPassword(prev => (prev && prev.length >= 8 && /[A-Z]/.test(prev) ? prev : `Gg_${Math.random().toString(36).slice(2, 8)}X9!`));
    }
  }, [searchParams]);

  // Suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Inline field errors
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const pwdStrength = checkPasswordStrength(password);

  // Validation State
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugMessage, setSlugMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // OTP Verification State
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  // Success State
  const [createdRestaurant, setCreatedRestaurant] = useState<RegisteredRestaurantResult | null>(null);

  // Auto-generate slug and smart suggestions as user types restaurant name
  useEffect(() => {
    if (restaurantName.trim()) {
      const baseSlug = convertNameToSlug(restaurantName);
      if (!slugManualEdit) {
        setSlug(baseSlug);
      }

      // Generate 3 clever suggestions
      const cityCode = CITY_SLUG_MAP[city] || 'pal';
      const list = [
        baseSlug,
        `${baseSlug}-cafe`,
        `${baseSlug}-${cityCode}`,
      ].filter((v, i, a) => a.indexOf(v) === i && v.length >= 3);

      setSuggestions(list);
    } else {
      setSuggestions([]);
      if (!slugManualEdit) setSlug('');
    }
  }, [restaurantName, city, slugManualEdit]);

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
          setSlugMessage(data.reason || 'هذا الرابط محجوز، اختر اسماً آخر من الاقتراحات');
        }
      } catch {
        setSlugStatus('idle');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!restaurantName.trim() || restaurantName.trim().length < 2) {
      setFormError('يرجى إدخال اسم المطعم (حرفان على الأقل)');
      return;
    }
    if (restaurantName.trim().length > 60) {
      setFormError('اسم المطعم طويل جداً (60 حرف كحد أقصى)');
      return;
    }

    if (slugStatus === 'taken' || slug.length < 3) {
      setFormError('يرجى اختيار رابط متاح للمطعم (3 أحرف إنجليزية على الأقل)');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
      setFormError('الرابط يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وشرطات فقط');
      return;
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setFormError(phoneErr);
      setPhoneError(phoneErr);
      return;
    }

    const emailErr = validateEmail(ownerEmail.trim());
    if (emailErr) {
      setFormError(emailErr);
      setEmailError(emailErr);
      return;
    }

    // Google signup: ensure compliant password exists for DB record
    let finalPassword = password;
    if (isGoogleSignup && (!finalPassword || finalPassword.length < 8)) {
      finalPassword = `Gg_${Math.random().toString(36).slice(2, 8)}X9!`;
      setPassword(finalPassword);
    }

    // Standard signup: validate password rules
    if (!isGoogleSignup) {
      if (!finalPassword || finalPassword.length < 8) {
        setFormError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        return;
      }
      if (!/[A-Z]/.test(finalPassword)) {
        setFormError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)');
        return;
      }
      if (!/[0-9]/.test(finalPassword)) {
        setFormError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل (0-9)');
        return;
      }
    }

    const formPayload = {
      name: restaurantName.trim(),
      slug: slug.trim(),
      phone: phone.trim(),
      city,
      ownerEmail: ownerEmail.trim().toLowerCase(),
      password: finalPassword,
      tablesCount,
    };

    // ── GOOGLE SIGNUP: DIRECT ACTIVATION (NO OTP NEEDED) ──
    if (isGoogleSignup) {
      startTransition(async () => {
        try {
          const res = await registerRestaurantAction(formPayload);
          if (!res.success || !res.restaurant) {
            setFormError(res.error || 'حدث خطأ أثناء إنشاء المطعم، يرجى المحاولة ثانية');
            return;
          }
          setCreatedRestaurant(res.restaurant);
        } catch {
          setFormError('حدث خطأ غير متوقع أثناء إنشاء المطعم');
        }
      });
      return;
    }

    // ── STANDARD SIGNUP: OTP EMAIL VERIFICATION ──
    setPendingFormData(formPayload);
    setOtpError('');
    setOtpCode('');
    setOtpSending(true);
    try {
      const otpRes = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ownerEmail }),
      });
      const otpData = await otpRes.json();
      if (otpData.success) {
        setOtpSent(true);
        setShowOtpStep(true);
      } else {
        setFormError(otpData.error || 'تعذر إرسال رمز التحقق');
      }
    } catch {
      setFormError('خطأ في الاتصال بالسيرفر');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtpAndRegister = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('يرجى إدخال الرمز المكون من 6 أرقام كاملاً');
      return;
    }
    setOtpVerifying(true);
    setOtpError('');
    try {
      const verifyRes = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingFormData.ownerEmail, code: otpCode }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        setOtpError(verifyData.error || 'رمز التحقق غير صحيح');
        setOtpVerifying(false);
        return;
      }
      // OTP verified: register the restaurant
      startTransition(async () => {
        const res = await registerRestaurantAction(pendingFormData);
        setOtpVerifying(false);
        if (!res.success || !res.restaurant) {
          setOtpError(res.error || 'حدث خطأ أثناء إنشاء المطعم');
          setShowOtpStep(false);
          setFormError(res.error || 'حدث خطأ أثناء إنشاء المطعم');
          return;
        }
        setCreatedRestaurant(res.restaurant);
        setShowOtpStep(false);
      });
    } catch {
      setOtpError('خطأ في الاتصال بالسيرفر');
      setOtpVerifying(false);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-neutral-900 flex items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-white relative overflow-hidden py-10">
      
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[130px]" />
        <div className="absolute bottom-[10%] -left-[10%] w-[450px] h-[450px] rounded-full bg-amber-500/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="w-full max-w-6xl z-10 my-4">

        {/* OTP Verification Modal Overlay */}
        {showOtpStep && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-4 text-orange-400">
                  <Mail size={32} />
                </div>
                <h2 className="text-lg font-black text-white mb-1">تحقق من بريدك الإلكتروني</h2>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  تم إرسال رمز تحقق مكون من 6 أرقام إلى<br />
                  <span className="font-bold text-orange-400">{pendingFormData?.ownerEmail}</span>
                </p>

                {otpError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                    {otpError}
                  </div>
                )}

                <div className="mb-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    dir="ltr"
                    className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 px-4 rounded-2xl bg-slate-800 border-2 border-slate-700 focus:border-orange-500 focus:outline-none text-white transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-2">الرمز صالح لمدة 10 دقائق</p>
                </div>

                <button
                  onClick={handleVerifyOtpAndRegister}
                  disabled={otpVerifying || isPending || otpCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {otpVerifying || isPending ? (
                    <><Loader2 size={16} className="animate-spin" /> جارٍ التحقق والإنشاء...</>
                  ) : (
                    <><CheckCircle2 size={16} /> تحقق وأكمل التسجيل</>
                  )}
                </button>

                <button
                  onClick={() => setShowOtpStep(false)}
                  disabled={otpVerifying || isPending}
                  className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
                >
                  رجوع وتعديل البيانات
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!createdRestaurant ? (
            /* =============================================================
               REGISTRATION LAYOUT (DUAL COLUMN: FORM + BENEFITS SIDEBAR)
               ============================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* LEFT SIDEBAR: BENEFITS & LIVE PREVIEW (lg:col-span-5) */}
              <div className="hidden lg:flex lg:col-span-5 flex-col gap-4 text-white">
                
                {/* Brand & Setup Highlights */}
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
                  
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white">ماذا ستحصل فور التسجيل؟</h3>
                      <p className="text-xs text-slate-400">تفعيل فوري خلال 30 ثانية بدون أي التزام</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                        📱
                      </div>
                      <div>
                        <p className="font-bold text-white">منيو QR رقمي فائق السرعة</p>
                        <p className="text-[11px] text-slate-400">كود QR مخصص لكل طاولة تفتحه كاميرا الهاتف فوراً بدون تنزيل تطبيق.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                        👨‍🍳
                      </div>
                      <div>
                        <p className="font-bold text-white">شاشة مطبخ فورية (KDS)</p>
                        <p className="text-[11px] text-slate-400">الطلبات تنزل للمطبخ بلحظتها مع رنة تنبيه صوتي وإلغاء أخطاء الطلبات.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                        📈
                      </div>
                      <div>
                        <p className="font-bold text-white">زيادة المبيعات عبر AI</p>
                        <p className="text-[11px] text-slate-400">اقتراحات تلقائية للأطباق والإضافات ترفع متوسط فاتورة الزبائن حتى +35%.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 font-bold mt-0.5">
                        🎁
                      </div>
                      <div>
                        <p className="font-bold text-white">14 يوماً تجربة مجانية كاملة</p>
                        <p className="text-[11px] text-slate-400">بدون طلب بطاقة بنكية وبدون أي عمولات على مبيعات مطعمك.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subdomain Live Preview Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 text-xs">
                  <span className="text-slate-400 font-bold block mb-1.5 flex items-center gap-1.5">
                    <Globe size={14} className="text-orange-400" />
                    <span>معاينة رابط مطعمك المباشر:</span>
                  </span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-orange-400 text-xs font-bold truncate text-left" dir="ltr">
                    https://{slug || 'your-restaurant'}.menus.cool
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>🇵🇸 موثوق في فلسطين</span>
                    <span className="text-emerald-400 font-bold">جاهز للتفعيل الفوري ✓</span>
                  </div>
                </div>

              </div>

              {/* RIGHT / MAIN: REGISTRATION FORM (lg:col-span-7) */}
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="lg:col-span-7 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-9 relative overflow-hidden"
              >
                {/* Top Accent Gradient Line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600" />

              {/* Single Official Logo & Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <Logo size="md" href="/" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1.5">
                  تسجيل مطعم جديد
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-500 flex items-center justify-center gap-1.5">
                  <span>تفعيل فوري خلال 30 ثانية</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-orange-600 font-bold">تجربة مجانية 14 يوماً</span>
                </p>
              </div>

              {/* Google Verified Notice Banner */}
              {isGoogleSignup && (
                <div className="mb-5 p-3.5 rounded-2xl bg-orange-50 border border-orange-200/90 text-orange-950 text-xs font-bold flex items-center gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0 text-orange-600">
                    <Sparkles size={18} />
                  </div>
                  <div className="flex-1 text-right">
                    <span className="block font-black text-slate-900 text-xs mb-0.5">
                      تم تسجيل الدخول بواسطة Google بنجاح ✅
                    </span>
                    <span className="font-medium text-slate-600 text-[11px] block">
                      يرجى إكمال البيانات الأساسية التالية لتجهيز موقعك ومنيو مطعمك فوراً.
                    </span>
                  </div>
                </div>
              )}

              {formError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                  <XCircle size={16} className="shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4.5">
                
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
                      placeholder="مثال: كيفك أو برجر هاوس"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-2xs"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer shadow-2xs"
                    >
                      {PALESTINIAN_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-white text-slate-900">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Subdomain Slug Engine (STRICT LTR, PERFECT DESIGN) */}
                <div className="bg-gradient-to-b from-orange-50/50 to-slate-50/80 border border-orange-200/80 p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Globe size={15} className="text-orange-500" />
                      <span>رابط موقعك ومنيو الزبائن (Subdomain) *</span>
                    </label>
                    <span className="text-[10px] text-orange-700 bg-orange-100 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                      محول تلقائياً للإنجليزي ⚡
                    </span>
                  </div>

                  {/* STRICT LTR CONTAINER */}
                  <div dir="ltr" className="flex items-center rounded-xl bg-white border-2 border-orange-300 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/15 transition-all overflow-hidden shadow-xs">
                    <span className="px-3 py-2.5 bg-orange-500/10 text-orange-700 font-mono text-xs font-bold select-none border-r border-orange-200">
                      https://
                    </span>
                    <input
                      type="text"
                      dir="ltr"
                      required
                      value={slug}
                      onChange={(e) => {
                        setSlugManualEdit(true);
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      }}
                      placeholder="restaurant-name"
                      className="flex-1 px-3 py-2.5 bg-transparent text-slate-900 font-mono font-bold text-sm focus:outline-none placeholder-slate-400"
                    />
                    <span className="px-3 py-2.5 bg-orange-500/10 text-orange-800 font-mono text-xs font-extrabold select-none border-l border-orange-200">
                      .menus.cool
                    </span>
                  </div>

                  {/* Slug Status / Validation Feedback */}
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-bold">
                    <div className="flex items-center gap-1.5">
                      {slugStatus === 'checking' && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Loader2 size={13} className="animate-spin text-orange-500" />
                          <span>جاري فحص وتأكيد الرابط...</span>
                        </span>
                      )}
                      {slugStatus === 'available' && (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          <span>{slugMessage}</span>
                        </span>
                      )}
                      {slugStatus === 'taken' && (
                        <span className="text-rose-600 flex items-center gap-1">
                          <XCircle size={14} />
                          <span>{slugMessage}</span>
                        </span>
                      )}
                      {slugStatus === 'idle' && (
                        <span className="text-slate-400 text-[10px]">
                          رابط منيو حصري لكل مطعم يتم فتحه من الطاولات مباشرة.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Smart Suggestions Chips (When Arabic name is typed) */}
                  {suggestions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-orange-100 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                        <Lightbulb size={11} className="text-amber-500" />
                        <span>اقتراحات إنجليزية:</span>
                      </span>
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSlug(s);
                            setSlugManualEdit(true);
                          }}
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            slug === s
                              ? 'bg-orange-500 text-white shadow-xs scale-102 ring-2 ring-orange-400'
                              : 'bg-white hover:bg-orange-50 text-slate-700 border border-orange-200 hover:border-orange-300 shadow-2xs'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Live URL Badge */}
                  <div className="mt-2.5 p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium text-[10px]">الرابط الذي سيراه الزبون:</span>
                    <span dir="ltr" className="font-mono font-bold text-orange-600 text-xs truncate">
                      https://{slug || 'your-name'}.menus.cool
                    </span>
                  </div>
                </div>

                {/* 3. Phone & (Password only if non-Google) */}
                {isGoogleSignup ? (
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
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:ring-4 transition-all font-mono shadow-2xs ${
                        phoneError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/10'
                      }`}
                    />
                    {phoneError && (
                      <p className="text-rose-600 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> {phoneError}
                      </p>
                    )}
                  </div>
                ) : (
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
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:ring-4 transition-all font-mono shadow-2xs ${
                          phoneError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/10'
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
                          className="w-full px-3.5 py-2.5 pr-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      {/* Compact Password Strength Indicator */}
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
                )}

                {/* 4. Required Admin Email */}
                {isGoogleSignup ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">البريد الإلكتروني المعتمد للإدارة</span>
                        <span className="text-xs font-mono font-black text-slate-900" dir="ltr">{ownerEmail}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      موثق عبر Google
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail size={14} className="text-orange-500" />
                        <span>البريد الإلكتروني للإدارة *</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">لتسجيل الدخول واستعادة الحساب</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@restaurant.ps"
                      value={ownerEmail}
                      onChange={(e) => { setOwnerEmail(e.target.value); setEmailError(''); }}
                      onBlur={() => setEmailError(validateEmail(ownerEmail))}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 text-xs font-bold focus:bg-white focus:outline-none focus:ring-4 transition-all font-mono shadow-2xs ${
                        emailError ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/10'
                      }`}
                    />
                    {emailError && (
                      <p className="text-rose-600 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> {emailError}
                      </p>
                    )}
                  </div>
                )}

                {/* 5. Tables Count Selector */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">عدد طاولات البداية:</span>
                    <span className="text-[10px] text-slate-400 font-medium">توليد أكواد QR فورية للطاولات</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 15, 20].map((count) => (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setTablesCount(count)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          tablesCount === count
                            ? 'bg-orange-500 text-white shadow-sm scale-105'
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
                  disabled={isPending || otpSending || slugStatus === 'taken'}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-sm shadow-lg shadow-orange-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-3"
                >
                  {isPending || otpSending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{otpSending ? 'جارٍ إرسال رمز التحقق...' : 'جاري حجز الرابط وتهيئة الطاولات...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
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
            </div>
          ) : (
            /* =============================================================
               SUCCESS SCREEN (INSTANT AUTO-PROVISIONING COMPLETE)
               ============================================================= */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] text-center relative overflow-hidden"
            >
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600" />

              <div className="flex justify-center mb-3">
                <Logo size="md" href="/" />
              </div>

              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
                <CheckCircle2 size={30} />
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-700 font-black text-xs mb-2">
                تم التفعيل والحجز بنجاح 🎉
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                أهلاً بك في عائلة Menus، مطعم {createdRestaurant.name}!
              </h2>
              <p className="text-slate-500 text-xs mb-6 font-medium">
                تم حجز الرابط الحصري، وتوليد <strong className="text-slate-800">{createdRestaurant.tablesCount} طاولات</strong> بأكواد QR جاهزة للطباعة فوراً.
              </p>

              {/* Subdomain URL Box */}
              <div className="bg-gradient-to-b from-orange-50/70 to-slate-50 border-2 border-orange-200 rounded-2xl p-4 mb-6 text-right shadow-xs">
                <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                  🌐 رابط منيو مطعمك المباشر للزبائن:
                </span>
                <div className="flex items-center justify-between gap-2 bg-white border border-orange-200 rounded-xl p-2.5 shadow-2xs">
                  <span className="font-mono text-sm font-black text-orange-600 select-all truncate" dir="ltr">
                    https://{createdRestaurant.slug}.menus.cool
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        copyUrl(`https://${createdRestaurant.slug}.menus.cool`);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                    <a
                      href={`https://${createdRestaurant.slug}.menus.cool`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                      title="فتح منيو المطعم"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <Link
                  href={`/dashboard?created=${createdRestaurant.slug}`}
                  className="p-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all active:scale-98"
                >
                  <BarChart3 size={20} />
                  <span>لوحة التحكم</span>
                </Link>

                <Link
                  href="/dashboard/tables"
                  className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-200 transition-all active:scale-98"
                >
                  <QrCode size={20} className="text-orange-500" />
                  <span>طباعة باركودات QR</span>
                </Link>

                <Link
                  href="/dashboard/menu"
                  className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex flex-col items-center justify-center gap-1.5 border border-slate-200 transition-all active:scale-98"
                >
                  <ChefHat size={20} className="text-orange-500" />
                  <span>إضافة وتعديل الوجبات</span>
                </Link>
              </div>

              <p className="text-[11px] text-slate-400">
                بيانات الدخول تم حفظها، ويمكنك تسجيل الدخول في أي وقت باستخدام بريدك الإلكتروني وكلمة المرور.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
