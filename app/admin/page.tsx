'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Users, Utensils, DollarSign, TrendingUp, Search,
  ExternalLink, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  ShieldCheck, ArrowUpRight, Filter, Eye, Phone, MapPin,
  Calendar, Layers, Clock, Settings, Crown, Zap, Star,
  X, Save, PlusCircle, CalendarCheck, ToggleLeft, ToggleRight, LogIn,
  Download, Trash2, Key, Mail, Copy, Check, ArrowUpDown, AlertTriangle,
  UserCheck, ShieldAlert, Sparkles, Building2
} from 'lucide-react';
import Link from 'next/link';

interface SubscriptionInfo {
  plan: 'trial' | 'basic' | 'pro';
  planNameAr: string;
  expiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  status: 'active' | 'trial' | 'expired';
}

interface RestaurantItem {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string;
  ownerEmail?: string;
  address: string;
  currency: string;
  createdAt: string;
  subdomainUrl: string;
  branchId: string;
  tablesCount: number;
  isActive: boolean;
  subscription?: SubscriptionInfo;
  totalOrders: number;
  totalRevenue: number;
}

interface AdminStats {
  totalRestaurants: number;
  totalTables: number;
  totalOrders: number;
  totalRevenue: number;
  currency: string;
}

const PLAN_CONFIG = {
  trial: { icon: Zap, label: 'تجريبي (14 يوم)', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  basic: { icon: Star, label: 'أساسي', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  pro: { icon: Crown, label: 'احترافي VIP', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
};

const PALESTINIAN_CITIES = [
  'نابلس', 'رام الله والبيرة', 'الخليل', 'جنين', 'طولكرم',
  'بيت لحم', 'قلقيلية', 'أريحا', 'سلفيت', 'طوباس', 'القدس', 'غزة'
];

// Arabic transliteration dictionary for instant auto-slug
const ARABIC_WORD_DICT: Record<string, string> = {
  'برجر': 'burger', 'برغر': 'burger', 'شاورما': 'shawarma', 'بيتزا': 'pizza',
  'كافيه': 'cafe', 'مقهى': 'cafe', 'قهوة': 'coffee', 'مطعم': 'restaurant',
  'مشاوي': 'mashawi', 'مشويات': 'grill', 'فطاير': 'fatayer', 'معجنات': 'pastries',
  'فلافل': 'falafel', 'حمص': 'hummus', 'دجاج': 'chicken', 'سناك': 'snack',
  'حلويات': 'sweets', 'عصير': 'juice', 'هاوس': 'house', 'بيت': 'house',
  'رويال': 'royal', 'كلاسيك': 'classic', 'الذهبي': 'golden', 'نابلس': 'nablus',
  'رام الله': 'ramallah', 'الخليل': 'khalil', 'القدس': 'quds', 'جنين': 'jenin',
};

function autoGenerateSlug(name: string): string {
  if (!name.trim()) return '';
  const words = name.trim().toLowerCase().split(/\s+/);
  const translated = words.map(w => {
    const clean = w.replace(/[\u064B-\u065F\u0670]/g, '');
    if (ARABIC_WORD_DICT[clean]) return ARABIC_WORD_DICT[clean];
    // Remove "ال" prefix
    if (clean.startsWith('ال') && clean.length > 3) {
      const root = clean.substring(2);
      if (ARABIC_WORD_DICT[root]) return ARABIC_WORD_DICT[root];
    }
    // Simple phonetic replacement
    return clean
      .replace(/[أإآاىء]/g, 'a')
      .replace(/ب/g, 'b')
      .replace(/[تةط]/g, 't')
      .replace(/ث/g, 'th')
      .replace(/ج/g, 'j')
      .replace(/ح/g, 'h')
      .replace(/خ/g, 'kh')
      .replace(/[دض]/g, 'd')
      .replace(/ذ/g, 'th')
      .replace(/ر/g, 'r')
      .replace(/[زظ]/g, 'z')
      .replace(/[سص]/g, 's')
      .replace(/ش/g, 'sh')
      .replace(/ع/g, 'a')
      .replace(/غ/g, 'gh')
      .replace(/ف/g, 'f')
      .replace(/ق/g, 'q')
      .replace(/ك/g, 'k')
      .replace(/ل/g, 'l')
      .replace(/م/g, 'm')
      .replace(/ن/g, 'n')
      .replace(/ه/g, 'h')
      .replace(/و/g, 'w')
      .replace(/ي/g, 'y');
  });

  const slug = translated.join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug.substring(0, 25);
}

function SubscriptionBadge({ sub }: { sub?: SubscriptionInfo }) {
  if (!sub) return null;
  const cfg = PLAN_CONFIG[sub.plan] || PLAN_CONFIG.trial;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      <Icon size={10} />
      {cfg.label}
      {sub.daysRemaining > 0 && <span className="opacity-80">· {sub.daysRemaining}ي</span>}
    </span>
  );
}

// -------------------------------------------------------------
// 1. Manage & Reset Password Modal
// -------------------------------------------------------------
function ManageModal({ restaurant, onClose, onSaved }: {
  restaurant: RestaurantItem;
  onClose: () => void;
  onSaved: (updated: Partial<RestaurantItem>) => void;
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'auth'>('info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Info Tab state
  const [name, setName] = useState(restaurant.name);
  const [phone, setPhone] = useState(restaurant.phone);
  const [city, setCity] = useState(restaurant.city);
  const [tablesCount, setTablesCount] = useState(restaurant.tablesCount);
  const [isActive, setIsActive] = useState(restaurant.isActive);
  const [plan, setPlan] = useState<'trial' | 'basic' | 'pro'>(restaurant.subscription?.plan || 'trial');

  const currentExpiry = restaurant.subscription?.expiresAt
    ? new Date(restaurant.subscription.expiresAt).toISOString().split('T')[0]
    : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const [expiryDate, setExpiryDate] = useState(currentExpiry);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [pwdCopied, setPwdCopied] = useState(false);

  const addDays = (days: number) => {
    const base = expiryDate ? new Date(expiryDate) : new Date();
    if (base < new Date()) base.setTime(new Date().getTime());
    base.setDate(base.getDate() + days);
    setExpiryDate(base.toISOString().split('T')[0]);
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/restaurants/${restaurant.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, city, tablesCount, isActive, plan,
          expiresAt: new Date(expiryDate + 'T23:59:59Z').toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'فشل الحفظ'); return; }
      setSuccess('تم حفظ بيانات المطعم والاشتراك بنجاح ✓');
      onSaved({
        name, phone, city, tablesCount, isActive,
        subscription: {
          plan, planNameAr: PLAN_CONFIG[plan].label,
          expiresAt: new Date(expiryDate + 'T23:59:59Z').toISOString(),
          daysRemaining: Math.max(0, Math.ceil((new Date(expiryDate + 'T23:59:59Z').getTime() - Date.now()) / 86400000)),
          isExpired: new Date(expiryDate + 'T23:59:59Z') < new Date(),
          status: plan === 'trial' ? 'trial' : 'active',
        }
      });
      setTimeout(onClose, 1200);
    } catch { setError('خطأ في الاتصال بالسيرفر'); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('يرجى إدخال كلمة مرور لا تقل عن 6 أحرف أو أرقام');
      return;
    }
    setResettingPassword(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/restaurants/${restaurant.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'فشل إعادة تعيين كلمة المرور');
        return;
      }
      setSuccess(data.message || 'تم تحديث كلمة المرور بنجاح ✓');
      setNewPassword('');
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setResettingPassword(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Settings size={17} className="text-orange-400" />
                إدارة مطعم {restaurant.name}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5" dir="ltr">{restaurant.slug}.menus.cool</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all cursor-pointer">
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 px-5 pt-3 gap-2 bg-slate-950/40">
            <button
              onClick={() => { setActiveTab('info'); setError(''); setSuccess(''); }}
              className={`pb-3 px-3 text-xs font-black transition-all flex items-center gap-1.5 border-b-2 ${
                activeTab === 'info'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store size={14} />
              بيانات المطعم والاشتراك
            </button>
            <button
              onClick={() => { setActiveTab('auth'); setError(''); setSuccess(''); }}
              className={`pb-3 px-3 text-xs font-black transition-all flex items-center gap-1.5 border-b-2 ${
                activeTab === 'auth'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key size={14} />
              حساب المالك وكلمة المرور
            </button>
          </div>

          {/* Content Area */}
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Alerts */}
            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">{error}</div>}
            {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">{success}</div>}

            {activeTab === 'info' ? (
              <>
                {/* Basic Info */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">معلومات المطعم</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">اسم المطعم</label>
                      <input value={name} onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">رقم الهاتف</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">المدينة</label>
                      <input value={city} onChange={e => setCity(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">عدد الطاولات</label>
                      <input type="number" min={1} max={200} value={tablesCount} onChange={e => setTablesCount(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-white">حالة المطعم</p>
                    <p className="text-[11px] text-slate-400">إيقاف المطعم يحجب منيو الزبائن فوراً</p>
                  </div>
                  <button
                    onClick={() => setIsActive(prev => !prev)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {isActive ? 'نشط' : 'متوقف'}
                  </button>
                </div>

                {/* Subscription Settings */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">إعدادات الاشتراك</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {(['trial', 'basic', 'pro'] as const).map(p => {
                      const cfg = PLAN_CONFIG[p];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={p}
                          onClick={() => setPlan(p)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            plan === p
                              ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <Icon size={20} className="mx-auto mb-1" />
                          <p className="text-[10px] font-black">{cfg.label}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">تاريخ انتهاء الاشتراك</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                    />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[{label: '+30 يوم', days: 30}, {label: '+3 أشهر', days: 90}, {label: '+سنة', days: 365}].map(b => (
                        <button
                          key={b.days}
                          onClick={() => addDays(b.days)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-slate-800 hover:bg-orange-500/20 text-slate-400 hover:text-orange-300 border border-slate-700 hover:border-orange-500/40 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <PlusCircle size={11} />
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Auth & Password Management Tab */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-750 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">بريد حساب المالك المسجل</span>
                  <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                      <Mail size={14} className="text-slate-500 shrink-0" />
                      <span>{restaurant.ownerEmail || `${restaurant.slug}@menus.ps`}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(restaurant.ownerEmail || `${restaurant.slug}@menus.ps`);
                        setPwdCopied(true);
                        setTimeout(() => setPwdCopied(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all text-xs"
                      title="نسخ البريد"
                    >
                      {pwdCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">هذا البريد يُستخدم لتسجيل الدخول إلى لوحة التحكم الرئيسية واستلام الفواتير والإشعارات.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Key size={14} className="text-orange-400" />
                    تعيين كلمة مرور جديدة للمالك
                  </h4>
                  <p className="text-[11px] text-slate-400">يمكنك هنا تغيير كلمة مرور المالك مباشرة في قاعدة البيانات في حال نسيانها أو بطلب منه.</p>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="أدخل كلمة المرور الجديدة (6 خانات على الأقل)..."
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        dir="ltr"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-amber-300 transition-all shrink-0"
                      >
                        توليد كلمة مرور
                      </button>
                    </div>

                    <button
                      onClick={handleResetPassword}
                      disabled={resettingPassword || !newPassword}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-orange-600/20"
                    >
                      <Key size={14} />
                      {resettingPassword ? 'جارٍ تحديث كلمة المرور...' : 'تأكيد وحفظ كلمة المرور الجديدة'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/50">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer">
              إغلاق
            </button>
            {activeTab === 'info' && (
              <button
                onClick={handleSaveInfo}
                disabled={saving}
                className="px-6 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// -------------------------------------------------------------
// 2. Create New Restaurant Modal
// -------------------------------------------------------------
function CreateRestaurantModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (newRest: RestaurantItem) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [manualSlug, setManualSlug] = useState(false);
  const [city, setCity] = useState('نابلس');
  const [phone, setPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [tablesCount, setTablesCount] = useState(10);
  const [plan, setPlan] = useState<'trial' | 'basic' | 'pro'>('trial');
  const [customDays, setCustomDays] = useState(14);

  // Auto-slug when name changes
  useEffect(() => {
    if (!manualSlug && name.trim()) {
      const generated = autoGenerateSlug(name);
      if (generated) setSlug(generated);
    }
  }, [name, manualSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setError('يرجى إدخال اسم المطعم');
      return;
    }
    if (!slug.trim() || slug.trim().length < 3) {
      setError('يرجى كتابة رابط فرعي بالإنجليزية (3 أحرف على الأقل)');
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صالح للمالك');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const expiryDate = new Date(Date.now() + customDays * 86400000).toISOString();
      const res = await fetch('/api/v1/admin/restaurants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          city,
          phone: phone.trim() || '+970 59 000 0000',
          ownerEmail: ownerEmail.trim().toLowerCase(),
          password: password || 'password123',
          tablesCount,
          plan,
          expiresAt: expiryDate,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'فشل إنشاء المطعم');
        return;
      }

      setSuccess('تم إنشاء المطعم وتجهيز كافة الجداول والمنيو بنجاح ✓');
      const createdItem: RestaurantItem = {
        id: data.restaurant.id,
        name: data.restaurant.name,
        slug: data.restaurant.slug,
        phone: data.restaurant.phone,
        city: data.restaurant.city,
        ownerEmail: data.restaurant.ownerEmail || ownerEmail,
        address: data.restaurant.address || '',
        currency: '₪',
        createdAt: new Date().toISOString(),
        subdomainUrl: `https://${data.restaurant.slug}.menus.cool`,
        branchId: data.restaurant.branchId,
        tablesCount: data.restaurant.tablesCount || tablesCount,
        isActive: true,
        subscription: {
          plan,
          planNameAr: PLAN_CONFIG[plan].label,
          expiresAt: expiryDate,
          daysRemaining: customDays,
          isExpired: false,
          status: plan === 'trial' ? 'trial' : 'active',
        },
        totalOrders: 0,
        totalRevenue: 0,
      };

      onCreated(createdItem);
      setTimeout(onClose, 1200);
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="w-full max-w-xl bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                <PlusCircle size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-white">إضافة مطعم جديد للمنصة</h2>
                <p className="text-[11px] text-slate-400">إنشاء وتجهيز مطعم شريك وحساب مديره فوراً</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all cursor-pointer">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">{error}</div>}
            {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">{success}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  اسم المطعم بالعربية <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: برجر هاوس، شاورما الريان..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  الرابط الفرعي (Subdomain) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="burger-house"
                    value={slug}
                    onChange={e => { setSlug(e.target.value); setManualSlug(true); }}
                    dir="ltr"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    required
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono pointer-events-none">
                    .menus.cool
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">المدينة</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  {PALESTINIAN_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">رقم الهاتف أو الجوال</label>
                <input
                  type="text"
                  placeholder="+970 59 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  dir="ltr"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  البريد الإلكتروني للإدارة (تسجيل الدخول) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="owner@example.com"
                  value={ownerEmail}
                  onChange={e => setOwnerEmail(e.target.value)}
                  dir="ltr"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة مرور المدير</label>
                <input
                  type="text"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  dir="ltr"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">عدد الطاولات الافتراضية</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={tablesCount}
                  onChange={e => setTablesCount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">مدة الاشتراك الممنوحة</label>
                <select
                  value={customDays}
                  onChange={e => setCustomDays(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value={14}>14 يوم (فترة تجريبية)</option>
                  <option value={30}>شهر (30 يوم)</option>
                  <option value={90}>3 أشهر (90 يوم)</option>
                  <option value={180}>6 أشهر (180 يوم)</option>
                  <option value={365}>سنة كاملة (365 يوم)</option>
                </select>
              </div>
            </div>

            {/* Plan selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-2">نوع الباقة</label>
              <div className="grid grid-cols-3 gap-2">
                {(['trial', 'basic', 'pro'] as const).map(p => {
                  const cfg = PLAN_CONFIG[p];
                  const Icon = cfg.icon;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPlan(p)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        plan === p
                          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Icon size={18} className="mx-auto mb-1" />
                      <p className="text-[10px] font-black">{cfg.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between pt-4 -mx-5 -mb-5 bg-slate-950/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                <PlusCircle size={15} />
                {submitting ? 'جارٍ الإنشاء والتجهيز...' : 'إنشاء وتجهيز المطعم الآن'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// -------------------------------------------------------------
// 3. Delete Confirmation Modal
// -------------------------------------------------------------
function DeleteConfirmModal({ restaurant, onClose, onDeleted }: {
  restaurant: RestaurantItem;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const isConfirmed = confirmInput.trim().toLowerCase() === restaurant.slug.toLowerCase() || confirmInput.trim() === restaurant.name.trim();

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/v1/admin/restaurants/${restaurant.id}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'فشل حذف المطعم');
        return;
      }
      onDeleted(restaurant.id);
      onClose();
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <Trash2 size={24} />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="text-base font-black text-white">تأكيد حذف المطعم نهائياً</h3>
            <p className="text-xs text-rose-300 font-bold">
              سيتم حذف مطعم ({restaurant.name}) وكافة الطاولات والطلبات والمنيو والحساب نهائياً ولا يمكن التراجع!
            </p>
          </div>

          {error && <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">{error}</div>}

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <p className="text-slate-400">
              لتأكيد الحذف، يرجى كتابة اسم المطعم أو الرابط الفرعي:
            </p>
            <p className="text-center font-mono font-black text-orange-400 bg-slate-900 py-1.5 rounded-lg border border-slate-800">
              {restaurant.slug}
            </p>
            <input
              type="text"
              placeholder={`اكتب "${restaurant.slug}" هنا...`}
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              dir="ltr"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono text-center focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmed || deleting}
              className="flex-1 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
            >
              <Trash2 size={14} />
              {deleting ? 'جارٍ الحذف...' : 'حذف المطعم نهائياً'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// -------------------------------------------------------------
// MAIN SUPER ADMIN DASHBOARD
// -------------------------------------------------------------
export default function SuperAdminMasterDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'trial' | 'basic' | 'pro' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'revenue' | 'orders' | 'tables' | 'expiry'>('newest');

  // Modals & Active Actions
  const [managingRestaurant, setManagingRestaurant] = useState<RestaurantItem | null>(null);
  const [deletingRestaurant, setDeletingRestaurant] = useState<RestaurantItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/admin/overview');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'تعذر تحميل بيانات لوحة التحكم الرئيسية');
        setLoading(false);
        return;
      }
      setStats(data.stats);
      setRestaurants(data.restaurants || []);
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // 1-Click Impersonation: Log in as owner of this restaurant
  const handleImpersonate = async (restaurant: RestaurantItem) => {
    setImpersonatingId(restaurant.id);
    try {
      const res = await fetch(`/api/v1/admin/restaurants/${restaurant.id}/impersonate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        alert(data.error || 'تعذر تسجيل الدخول كمدير لهذا المطعم');
        setImpersonatingId(null);
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
      setImpersonatingId(null);
    }
  };

  // Toggle restaurant active status
  const handleToggleStatus = async (restaurantId: string, currentActive: boolean) => {
    setTogglingId(restaurantId);
    try {
      const res = await fetch(`/api/v1/admin/restaurants/${restaurantId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setRestaurants(prev =>
          prev.map(r => (r.id === restaurantId ? { ...r, isActive: !currentActive } : r))
        );
      } else {
        alert(data.error || 'فشل تعديل حالة المطعم');
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setTogglingId(null);
    }
  };

  // CSV Export with UTF-8 BOM
  const exportToCSV = () => {
    const headers = [
      'اسم المطعم',
      'الرابط الفرعي',
      'رابط المنيو',
      'البريد الإلكتروني للإدارة',
      'رقم الهاتف',
      'المدينة',
      'عدد الطاولات',
      'خطة الاشتراك',
      'حالة الاشتراك',
      'تاريخ انتهاء الاشتراك',
      'الأيام المتبقية',
      'إجمالي الطلبات',
      'إجمالي المبيعات (₪)',
      'حالة المطعم',
      'تاريخ الإنشاء'
    ];

    const rows = filteredRestaurants.map(r => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.slug}"`,
      `"${r.subdomainUrl}"`,
      `"${(r.ownerEmail || '').replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${r.city}"`,
      r.tablesCount,
      `"${r.subscription?.planNameAr || r.subscription?.plan || 'تجريبي'}"`,
      `"${r.subscription?.isExpired ? 'منتهي' : 'نشط'}"`,
      `"${r.subscription?.expiresAt ? new Date(r.subscription.expiresAt).toLocaleDateString('ar-EG') : '—'}"`,
      r.subscription?.daysRemaining ?? '—',
      r.totalOrders,
      r.totalRevenue,
      r.isActive ? 'نشط' : 'متوقف',
      `"${new Date(r.createdAt).toLocaleDateString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `menus_cool_restaurants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and Sort Restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter(r => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.city.includes(q) ||
          (r.ownerEmail && r.ownerEmail.toLowerCase().includes(q));

        // Status
        const matchesStatus =
          statusFilter === 'all' ? true : statusFilter === 'active' ? r.isActive : !r.isActive;

        // Plan
        let matchesPlan = true;
        if (planFilter === 'expired') {
          matchesPlan = Boolean(r.subscription?.isExpired);
        } else if (planFilter !== 'all') {
          matchesPlan = r.subscription?.plan === planFilter && !r.subscription?.isExpired;
        }

        return matchesSearch && matchesStatus && matchesPlan;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
        if (sortBy === 'tables') return b.tablesCount - a.tablesCount;
        if (sortBy === 'expiry') {
          const aDays = a.subscription?.daysRemaining ?? 9999;
          const bDays = b.subscription?.daysRemaining ?? 9999;
          return aDays - bDays;
        }
        return 0;
      });
  }, [restaurants, searchQuery, statusFilter, planFilter, sortBy]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-500 selection:text-white pb-24" dir="rtl">
      
      {/* Modals */}
      {managingRestaurant && (
        <ManageModal
          restaurant={managingRestaurant}
          onClose={() => setManagingRestaurant(null)}
          onSaved={(updated) => {
            setRestaurants(prev =>
              prev.map(r => r.id === managingRestaurant.id ? { ...r, ...updated } : r)
            );
          }}
        />
      )}

      {showCreateModal && (
        <CreateRestaurantModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newRest) => {
            setRestaurants(prev => [newRest, ...prev]);
            setStats(prev => prev ? { ...prev, totalRestaurants: prev.totalRestaurants + 1, totalTables: prev.totalTables + newRest.tablesCount } : null);
          }}
        />
      )}

      {deletingRestaurant && (
        <DeleteConfirmModal
          restaurant={deletingRestaurant}
          onClose={() => setDeletingRestaurant(null)}
          onDeleted={(id) => {
            setRestaurants(prev => prev.filter(r => r.id !== id));
            setStats(prev => prev ? { ...prev, totalRestaurants: Math.max(0, prev.totalRestaurants - 1) } : null);
          }}
        />
      )}

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-lg">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">Menus.cool</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Master Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">لوحة الإدارة المركزية للشبكة والاشتراكات والمطاعم</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <PlusCircle size={15} />
              <span>إضافة مطعم جديد</span>
            </button>

            <button
              onClick={exportToCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="تصدير كشف إكسل CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>

            <button
              onClick={fetchOverview}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer border border-slate-700"
              title="تحديث البيانات"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            <Link
              href="/login"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-all flex items-center gap-1.5"
            >
              <LogIn size={13} />
              <span className="hidden sm:inline">خروج</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Overview Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'إجمالي المطاعم', value: loading ? '...' : stats?.totalRestaurants || 0, sub: 'مطعم مفعل', Icon: Store, color: 'text-orange-400', bg: 'bg-orange-500/15' },
            { label: 'إجمالي الطاولات', value: loading ? '...' : stats?.totalTables || 0, sub: 'طاولة برمز QR نشط', Icon: Utensils, color: 'text-blue-400', bg: 'bg-blue-500/15' },
            { label: 'إجمالي الطلبات', value: loading ? '...' : stats?.totalOrders || 0, sub: 'طلب مباشر', Icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
            { label: 'حجم المبيعات الإجمالي', value: loading ? '...' : `${(stats?.totalRevenue || 0).toLocaleString()} ₪`, sub: 'إجمالي التداولات', Icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/15' },
          ].map(card => (
            <div key={card.label} className="p-4 sm:p-5 rounded-2xl bg-slate-800/60 border border-slate-750 backdrop-blur-sm hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">{card.label}</span>
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                  <card.Icon size={18} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{card.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Restaurant Directory */}
        <div className="bg-slate-850/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Building2 size={18} className="text-orange-400" />
                  سجل المطاعم الشريكة والحسابات
                </h2>
                <p className="text-xs text-slate-400">إجمالي المعروض: {filteredRestaurants.length} من أصل {restaurants.length} مطعم</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="بحث بالاسم، الرابط، الهاتف، بريد المالك..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Filters and Sorters Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
              
              {/* Status and Plan Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                  {(['all', 'active', 'inactive'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        statusFilter === f
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f === 'all' ? 'الكل' : f === 'active' ? 'النشطة' : 'المتوقفة'}
                    </button>
                  ))}
                </div>

                {/* Plan filter */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                  {(['all', 'trial', 'basic', 'pro', 'expired'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPlanFilter(p)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        planFilter === p
                          ? 'bg-slate-750 text-orange-400 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p === 'all' ? 'كل الخطط' : p === 'trial' ? 'تجريبي' : p === 'basic' ? 'أساسي' : p === 'pro' ? 'VIP' : 'منتهي'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <ArrowUpDown size={12} />
                  ترتيب حسب:
                </span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="newest">الأحدث انضماماً</option>
                  <option value="oldest">الأقدم</option>
                  <option value="revenue">الأعلى مبيعاً</option>
                  <option value="orders">الأكثر طلباً</option>
                  <option value="tables">الأكثر طاولات</option>
                  <option value="expiry">الأقرب انتهاء اشتراك</option>
                </select>
              </div>

            </div>
          </div>

          {/* Restaurants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs" dir="rtl">
              <thead className="border-b border-slate-800 bg-slate-900/50">
                <tr className="text-right text-[11px] text-slate-400 font-bold">
                  <th className="py-3.5 px-4">المطعم والرابط</th>
                  <th className="py-3.5 px-4">حساب المالك والتواصل</th>
                  <th className="py-3.5 px-4 text-center">الطاولات</th>
                  <th className="py-3.5 px-4 text-center">الاشتراك والصلاحية</th>
                  <th className="py-3.5 px-4 text-center">الطلبات</th>
                  <th className="py-3.5 px-4 text-center">المبيعات</th>
                  <th className="py-3.5 px-4 text-center">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRestaurants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      {loading ? 'جارٍ تحميل قائمة المطاعم...' : 'لا توجد مطاعم مطابقة لمعايير البحث والفلترة'}
                    </td>
                  </tr>
                ) : (
                  filteredRestaurants.map(restaurant => (
                    <tr key={restaurant.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Name & Subdomain */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-black text-orange-400 text-sm shrink-0">
                            {restaurant.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-white text-xs truncate max-w-[160px]">{restaurant.name}</p>
                            <a
                              href={restaurant.subdomainUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 mt-0.5"
                              dir="ltr"
                            >
                              <span className="truncate max-w-[130px]">{restaurant.slug}.menus.cool</span>
                              <ExternalLink size={9} />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Owner Email, Phone, City */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {restaurant.ownerEmail ? (
                            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]" dir="ltr">
                              <Mail size={11} className="text-amber-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{restaurant.ownerEmail}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">لا يوجد بريد مسجل</span>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin size={10} className="text-slate-500 shrink-0" />
                              {restaurant.city || 'نابلس'}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span dir="ltr">{restaurant.phone || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tables Count */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-300">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                          {restaurant.tablesCount} طاولة
                        </span>
                      </td>

                      {/* Subscription */}
                      <td className="py-3.5 px-4 text-center">
                        <SubscriptionBadge sub={restaurant.subscription} />
                        {restaurant.subscription?.isExpired && (
                          <p className="text-[9px] text-rose-400 font-bold mt-1">منتهي الصلاحية</p>
                        )}
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-200">
                        {restaurant.totalOrders}
                      </td>

                      {/* Revenue */}
                      <td className="py-3.5 px-4 text-center font-black text-emerald-400">
                        {restaurant.totalRevenue.toLocaleString()} ₪
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                          restaurant.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${restaurant.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {restaurant.isActive ? 'نشط' : 'متوقف'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          
                          {/* Impersonation 1-Click Login */}
                          <button
                            onClick={() => handleImpersonate(restaurant)}
                            disabled={impersonatingId === restaurant.id}
                            className="px-2 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 transition-all cursor-pointer font-bold text-[10px] flex items-center gap-1 shadow-sm disabled:opacity-50"
                            title="دخول لوحة تحكم هذا المطعم مباشرة كمدير"
                          >
                            <LogIn size={12} />
                            <span>{impersonatingId === restaurant.id ? 'جارٍ الدخول...' : 'دخول لوحة المطعم'}</span>
                          </button>

                          {/* Preview Customer Menu */}
                          <a
                            href={restaurant.subdomainUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-750 transition-all"
                            title="معاينة منيو الزبون"
                          >
                            <Eye size={13} />
                          </a>

                          {/* Settings & Password Modal */}
                          <button
                            onClick={() => setManagingRestaurant(restaurant)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-slate-750 transition-all cursor-pointer"
                            title="إدارة المطعم وتعيين كلمة المرور"
                          >
                            <Settings size={13} />
                          </button>

                          {/* Status Toggle */}
                          <button
                            onClick={() => handleToggleStatus(restaurant.id, restaurant.isActive)}
                            disabled={togglingId === restaurant.id}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                              restaurant.isActive
                                ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-750'
                                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border-emerald-500/40'
                            }`}
                            title={restaurant.isActive ? 'إيقاف مؤقت' : 'تفعيل'}
                          >
                            {restaurant.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                          </button>

                          {/* Delete Restaurant */}
                          <button
                            onClick={() => setDeletingRestaurant(restaurant)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-750 transition-all cursor-pointer"
                            title="حذف المطعم نهائياً"
                          >
                            <Trash2 size={13} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
