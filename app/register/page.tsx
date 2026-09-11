'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Globe, CheckCircle2, XCircle, Loader2, Phone, 
  MapPin, Lock, Mail, Sparkles, QrCode, 
  ExternalLink, Copy, Check, ChefHat, BarChart3
} from 'lucide-react';
import { registerRestaurantAction } from '@/app/actions/register-restaurant';
import { RegisteredRestaurantResult } from '@/lib/db/repositories/restaurant.repository';

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

  // Remove remaining arabic or special characters, keep english alphanumeric and hyphens
  let slug = clean
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  // If arabic couldn't be mapped to english, generate fallback
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
  const [tablesCount, setTablesCount] = useState(10);

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

    if (!restaurantName.trim()) {
      setFormError('يرجى إدخال اسم المطعم');
      return;
    }

    if (slugStatus === 'taken' || slug.length < 3) {
      setFormError('يرجى اختيار رابط صالح ومتاح للمطعم');
      return;
    }

    if (!phone.trim()) {
      setFormError('يرجى إدخال رقم هاتف أو جوال للتواصل');
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
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white selection:bg-orange-500 selection:text-white flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Lighting Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Image src="/logo.png" alt="MENUS Logo" width={28} height={28} className="object-contain" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block leading-none">MENUS<span className="text-orange-500">.ps</span></span>
              <span className="text-[10px] text-slate-400 font-bold">نظام تشغيل المطاعم السحابي</span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="hidden sm:inline text-slate-400">لديك حساب بالفعل؟</span>
            <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/10">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full z-10 flex-1 flex flex-col justify-center">
        
        <AnimatePresence mode="wait">
          {!createdRestaurant ? (
            /* =============================================================
               REGISTRATION FORM
               ============================================================= */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl"
            >
              <div className="text-center max-w-xl mx-auto mb-8">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold mb-3">
                  <Sparkles size={14} />
                  <span>تفعيل فوري خلال 30 ثانية • تجربة مجانية 14 يوم</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                  سجّل مطعمك واحصل على رابطك الخاص فوراً
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm">
                  سيقوم النظام بإنشاء الرابط، منيو الزبائن، شاشة المطبخ، وأول 10 طاولات بـ QR تلقائياً.
                </p>
              </div>

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <XCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 1. Restaurant Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Store size={15} className="text-orange-400" />
                      <span>اسم المطعم أو الكافيه *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: برجر هاوس، بيتزا فاكتوري"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">يظهر هذا الاسم لزبائنك وفي شاشة المطبخ</span>
                  </div>

                  {/* 2. City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <MapPin size={15} className="text-orange-400" />
                      <span>المدينة *</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
                    >
                      {PALESTINIAN_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-slate-900 text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* 3. Automatic Subdomain Slug Engine */}
                <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Globe size={15} className="text-orange-400" />
                      <span>رابط موقعك الحصري (Subdomain) *</span>
                    </label>
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-bold">
                      يتم إنشاؤه تلقائياً
                    </span>
                  </div>

                  {/* URL Input Bar */}
                  <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 overflow-hidden focus-within:border-orange-500 transition-colors">
                    <div className="px-3 py-3 bg-slate-800/80 text-slate-400 text-xs font-bold border-l border-slate-700 select-none">
                      https://
                    </div>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => {
                        setSlugManualEdit(true);
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      }}
                      placeholder="اسم-المطعم"
                      className="flex-1 px-3 py-3 bg-transparent text-orange-400 font-mono font-bold text-sm focus:outline-none placeholder-slate-600"
                    />
                    <div className="px-3 py-3 bg-slate-800/80 text-slate-400 text-xs font-bold border-r border-slate-700 select-none">
                      .menus-ps.vercel.app
                    </div>
                  </div>

                  {/* Live Status Indicator */}
                  <div className="mt-2.5 flex items-center gap-2 text-xs font-bold">
                    {slugStatus === 'checking' && (
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Loader2 size={13} className="animate-spin text-orange-400" />
                        <span>جاري فحص توفر الرابط...</span>
                      </span>
                    )}
                    {slugStatus === 'available' && (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        <span>{slugMessage}</span>
                      </span>
                    )}
                    {slugStatus === 'taken' && (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <XCircle size={15} className="text-rose-400" />
                        <span>{slugMessage}</span>
                      </span>
                    )}
                    {slugStatus === 'idle' && (
                      <span className="text-slate-500 text-[11px]">
                        سيكون هذا الرابط المباشر لمنيو زبائنك وعلى ستاندات الطاولات.
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Contact & Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Phone size={15} className="text-orange-400" />
                      <span>رقم الهاتف أو الجوال للتواصل *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0599000000 أو 0569000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Mail size={15} className="text-slate-400" />
                      <span>البريد الإلكتروني للإدارة (اختياري)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="owner@restaurant.ps"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Lock size={15} className="text-orange-400" />
                      <span>كلمة المرور للوحة التحكم *</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                    />
                  </div>

                </div>

                {/* 5. Initial Tables Count */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">عدد الطاولات المبدئي للتوليد السريع:</span>
                    <span className="text-[11px] text-slate-400">سنقوم بإنشاء أكواد QR جاهزة للطباعة لكل طاولة.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[5, 10, 15, 20].map((count) => (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setTablesCount(count)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                          tablesCount === count
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-105'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {count} طاولات
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isPending || slugStatus === 'taken'}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-base shadow-xl shadow-orange-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>جاري حجز الرابط وتهيئة الطاولات...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>إنشاء موقع المطعم وتفعيل الرابط فوراً 🚀</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-500 font-medium">
                  بالتسجيل، أنت توافق على شروط الخدمة. تجربة مجانية 14 يوماً بدون بطاقة بنكية.
                </p>

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
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center max-w-2xl mx-auto"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold mb-2">
                جاهز أونلاين الآن 100%
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                تهانينا! أصبح موقع مطعمك متاحاً على الإنترنت 🎉
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-6">
                تم حجز الرابط، وإنشاء <strong className="text-white">{createdRestaurant.tablesCount} طاولات</strong> بأكواد QR مشفرة، وتجهيز لوحة التحكم بنجاح.
              </p>

              {/* Subdomain URL Card */}
              <div className="bg-slate-950 border border-orange-500/40 rounded-2xl p-4 mb-6 text-right">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  رابط موقعك ومنيو الزبائن الحصري:
                </span>
                <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="font-mono text-sm sm:text-base font-bold text-orange-400 select-all truncate" dir="ltr">
                    {`https://menus-ps.vercel.app/r/${createdRestaurant.slug}`}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyUrl(`https://menus-ps.vercel.app/r/${createdRestaurant.slug}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                    </button>
                    <a
                      href={`/r/${createdRestaurant.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="فتح منيو المطعم"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                
                <Link
                  href={`/dashboard?created=${createdRestaurant.slug}`}
                  className="p-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex flex-col items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-98"
                >
                  <BarChart3 size={20} />
                  <span>دخول لوحة التحكم</span>
                </Link>

                <Link
                  href={`/m?restaurant=${createdRestaurant.slug}`}
                  target="_blank"
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 border border-slate-700 transition-all"
                >
                  <QrCode size={20} className="text-orange-400" />
                  <span>معاينة منيو الزبون</span>
                </Link>

                <Link
                  href="/staff"
                  target="_blank"
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-2 border border-slate-700 transition-all"
                >
                  <ChefHat size={20} className="text-emerald-400" />
                  <span>فتح شاشة المطبخ</span>
                </Link>

              </div>

              {/* Table QR Sample */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0">
                    <QrCode size={24} className="text-slate-950" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white block">طاولة رقم 1 جاهزة للطباعة</span>
                    <span className="text-[10px] text-slate-500">كود QR آمن ومشفر جاهز للاستخدام المباشر</span>
                  </div>
                </div>
                <Link
                  href="/dashboard/tables"
                  className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 text-xs"
                >
                  <span>طباعة الستاندات</span>
                  <ExternalLink size={12} />
                </Link>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Menus.ps — منصة إدارة وقوائم طعام المطاعم الذكية في فلسطين</p>
      </footer>

    </div>
  );
}
