'use client';

import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Copy, Check, Clock, AlertCircle, ChefHat, Utensils, UserCog, RefreshCw, ExternalLink, QrCode } from 'lucide-react';

interface AccessCode {
  id: string;
  code: string;
  employee_name: string;
  role: string;
  expires_at: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  staff: 'موظف خدمة',
  kitchen: 'موظف مطبخ',
  branch_manager: 'مدير فرع',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  staff:          <Utensils size={14} />,
  kitchen:        <ChefHat size={14} />,
  branch_manager: <UserCog size={14} />,
};

const ROLE_COLORS: Record<string, string> = {
  staff:          'bg-blue-50 text-blue-700 border-blue-200',
  kitchen:        'bg-orange-50 text-orange-700 border-orange-200',
  branch_manager: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function StaffCodesPage() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [newCodeName, setNewCodeName] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const [employeeName, setEmployeeName] = useState('');
  const [role, setRole] = useState('staff');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [copiedLink, setCopiedLink] = useState<'kitchen' | 'menu' | null>(null);

  const loadCodes = async (slug?: string) => {
    setIsLoading(true);
    try {
      const activeSlug = slug || restaurantSlug || (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('created') || new URLSearchParams(window.location.search).get('slug')) : '') || 'sh-manoosha';
      const res = await fetch(`/api/auth/staff-codes/list?slug=${encodeURIComponent(activeSlug)}`);
      const data = await res.json();
      if (data.success) setCodes(data.codes || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const searchSlug = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('created') || new URLSearchParams(window.location.search).get('slug')) : '';
    const initial = searchSlug || 'sh-manoosha';
    setRestaurantSlug(initial);
    loadCodes(initial);

    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          const s = d.user.restaurantSlug || initial;
          setRestaurantSlug(s);
          if (d.user.restaurantName) setRestaurantName(d.user.restaurantName);
          loadCodes(s);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!employeeName.trim() || employeeName.trim().length < 2) {
      setFormError('يرجى إدخال اسم الموظف (حرفان على الأقل)');
      return;
    }

    setIsGenerating(true);
    setNewCode(null);
    try {
      const activeSlug = restaurantSlug || (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('created') || new URLSearchParams(window.location.search).get('slug')) : '') || 'sh-manoosha';
      const res = await fetch('/api/auth/staff-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employeeName: employeeName.trim(), 
          role, 
          expiresInHours,
          restaurantSlug: activeSlug,
          branchId: activeSlug === 'sh-manoosha' ? 'a84f5ec9-714f-44fe-980d-82a78eb4f9b9' : undefined
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCode(data.code);
        setNewCodeName(data.employeeName);
        setEmployeeName('');
        await loadCodes(activeSlug);
      } else {
        setFormError(data.error || 'فشل توليد الرمز');
      }
    } catch {
      setFormError('خطأ في الاتصال بالخادم');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (codeId: string) => {
    await fetch('/api/auth/staff-codes/list', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeId }),
    });
    setCodes(prev => prev.filter(c => c.id !== codeId));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'منتهي الصلاحية';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `${h} ساعة ${m} دقيقة`;
    return `${m} دقيقة`;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 font-sans" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Key size={22} className="text-orange-500" />
            رموز وصول الموظفين {restaurantName ? `— ${restaurantName}` : ''}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            أنشئ رمزاً مكوناً من 6 أرقام لكل موظف — صالح لمدة محددة ويُستخدم مرة واحدة فقط
          </p>
        </div>
        <button
          onClick={() => loadCodes()}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
          title="تحديث القائمة"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Direct Links for this Restaurant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kitchen Screen Link */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ChefHat size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">رابط شاشة المطبخ والطلبات لمطعمك</h3>
                <p className="text-[11px] text-slate-500">للشاشات والتابلت — تظهر فقط طلبات مطعمك</p>
              </div>
            </div>
            <a
              href={restaurantSlug ? `/staff/${restaurantSlug}` : '/staff'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
              title="فتح في علامة تبويب جديدة"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="flex items-center gap-2 mt-3 bg-white border border-amber-200 rounded-xl p-2">
            <code className="text-[11px] font-mono text-slate-700 font-bold truncate flex-1 dir-ltr text-left">
              {typeof window !== 'undefined'
                ? `${window.location.origin}/staff/${restaurantSlug || ''}`
                : `https://menus.cool/staff/${restaurantSlug || ''}`}
            </code>
            <button
              onClick={() => {
                const url = `${window.location.origin}/staff/${restaurantSlug || ''}`;
                navigator.clipboard.writeText(url);
                setCopiedLink('kitchen');
                setTimeout(() => setCopiedLink(null), 2000);
              }}
              className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              {copiedLink === 'kitchen' ? <><Check size={12} /> تم النسخ</> : <><Copy size={12} /> نسخ</>}
            </button>
          </div>
        </div>

        {/* Customer Menu Link */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">رابط منيو المطعم للزبائن</h3>
                <p className="text-[11px] text-slate-500">القائمة الرقمية التفاعلية لمطعمك</p>
              </div>
            </div>
            <a
              href={restaurantSlug ? `https://${restaurantSlug}.menus.cool` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="معاينة المنيو"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="flex items-center gap-2 mt-3 bg-white border border-emerald-200 rounded-xl p-2">
            <code className="text-[11px] font-mono text-slate-700 font-bold truncate flex-1 dir-ltr text-left">
              {restaurantSlug ? `https://${restaurantSlug}.menus.cool` : 'https://menus.cool'}
            </code>
            <button
              onClick={() => {
                const url = restaurantSlug ? `https://${restaurantSlug}.menus.cool` : 'https://menus.cool';
                navigator.clipboard.writeText(url);
                setCopiedLink('menu');
                setTimeout(() => setCopiedLink(null), 2000);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              {copiedLink === 'menu' ? <><Check size={12} /> تم النسخ</> : <><Copy size={12} /> نسخ</>}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Generate Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
            <Plus size={16} className="text-orange-500" />
            إنشاء رمز وصول جديد
          </h2>

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14} />
              {formError}
            </div>
          )}

          {newCode && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center">
              <p className="text-xs text-emerald-700 font-bold mb-2">✅ تم إنشاء الرمز لـ &quot;{newCodeName}&quot;</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-black tracking-[0.3em] text-emerald-800 font-mono">{newCode}</span>
                <button
                  onClick={() => handleCopy(newCode, 'new')}
                  className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors cursor-pointer"
                >
                  {copiedId === 'new' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-emerald-600 mt-2">⚠️ احفظ هذا الرمز — لن يظهر مجدداً</p>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم الموظف *</label>
              <input
                type="text"
                value={employeeName}
                onChange={e => setEmployeeName(e.target.value)}
                placeholder="مثال: أحمد محمد، مطبخ 1"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">الدور الوظيفي</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ROLE_LABELS).map(([val, label]) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setRole(val)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      role === val
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    {ROLE_ICONS[val]}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">صلاحية الرمز</label>
              <div className="flex gap-2">
                {[8, 24, 48, 72].map(h => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setExpiresInHours(h)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      expiresInHours === h
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {h}س
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <><RefreshCw size={15} className="animate-spin" /> جاري التوليد...</>
              ) : (
                <><Key size={15} /> إنشاء رمز الوصول</>
              )}
            </button>
          </form>
        </div>

        {/* Codes List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
            <Clock size={16} className="text-slate-500" />
            الرموز النشطة والمنتهية
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-slate-400" />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Key size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-xs font-bold">لا توجد رموز بعد</p>
              <p className="text-[11px] mt-1">أنشئ أول رمز وصول للموظفين</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {codes.map(code => {
                const expired = isExpired(code.expires_at) || code.is_used;
                return (
                  <div
                    key={code.id}
                    className={`rounded-xl border p-3 transition-all ${
                      expired
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-orange-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${ROLE_COLORS[code.role] || ROLE_COLORS.staff}`}>
                          {ROLE_ICONS[code.role]}
                          {ROLE_LABELS[code.role] || code.role}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{code.employee_name}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-black tracking-widest text-lg ${expired ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {code.code}
                        </span>
                        {!expired && (
                          <button
                            onClick={() => handleCopy(code.code, code.id)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                          >
                            {copiedId === code.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold ${expired ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {code.is_used ? '✓ تم الاستخدام' : timeLeft(code.expires_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
