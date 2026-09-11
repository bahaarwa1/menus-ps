'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, ChefHat, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectFrom = searchParams.get('from') || '';
  const initialRole = searchParams.get('role') === 'staff' ? 'staff' : 'admin';

  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Admin (Email + Password) Login
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          redirectTo: redirectFrom || '/dashboard',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || '/dashboard');
      router.refresh();
    } catch {
      setErrorMsg('تعذر الاتصال بخادم المصادقة. يرجى المحاولة لاحقاً.');
      setIsLoading(false);
    }
  };

  // Handle Staff (6-digit Code or PIN) Login
  const handleStaffPinLogin = async (enteredPin?: string) => {
    const pinToSubmit = (enteredPin || pin).trim();
    if (!pinToSubmit || pinToSubmit.length < 4) {
      setErrorMsg('يرجى إدخال رمز الدخول المكون من 6 أرقام (أو 4 أرقام على الأقل)');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/staff-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToSubmit }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'رمز الدخول غير صالح أو منتهي الصلاحية.');
        setPin('');
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || '/staff');
      router.refresh();
    } catch {
      setErrorMsg('تعذر الاتصال بخادم المصادقة.');
      setIsLoading(false);
    }
  };

  // Keypad button click (supports 6-digit access code)
  const handleKeypadClick = (val: string) => {
    if (isLoading) return;
    if (val === 'back') {
      setPin((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setPin('');
    } else if (pin.length < 6) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 6) {
        handleStaffPinLogin(nextPin);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-white" dir="rtl">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-orange-500/5 blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-7 sm:p-9 z-10 relative overflow-hidden"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500"></div>

        {/* Logo / Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 mx-auto hover:scale-105 transition-transform font-black text-2xl">
              M
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">تسجيل الدخول</h1>
          <p className="text-xs font-medium text-slate-500">نظام إدارة ومطابخ المطاعم الذكية MENUS.ps</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={16} className={activeTab === 'admin' ? 'text-orange-500' : ''} />
            <span>لوحة الإدارة (مالك)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ChefHat size={16} className={activeTab === 'staff' ? 'text-orange-500' : ''} />
            <span>دخول الموظف (كود 6 أرقام)</span>
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-center gap-2 text-rose-900 text-xs font-bold"
            >
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: Admin Form (Email & Password) */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 mr-1">البريد الإلكتروني أو معرّف المطعم (Slug)</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@restaurant.ps أو معرف المطعم"
                  className="w-full pr-11 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 transition-all text-slate-800 placeholder-slate-400 text-left shadow-2xs"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between mr-1 ml-1">
                <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pr-11 pl-11 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 transition-all text-slate-800 placeholder-slate-400 text-left tracking-widest shadow-2xs"
                  dir="ltr"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white py-3.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>تسجيل الدخول إلى لوحة التحكم</span>
                    <ArrowRight size={16} className="rtl:rotate-180 group-hover:-translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Staff 6-Digit Access Code & PIN Keypad */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-600 font-bold mb-1">رمز الدخول المكون من 6 أرقام</p>
              <p className="text-[11px] text-slate-400 mb-3">أدخل الرمز السريع المسلم لك من المدير للدخول المباشر لشاشة المطبخ</p>
              
              {/* 6-Digit Dots / Input Display */}
              <div className="flex justify-center gap-2 my-2" dir="ltr">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={`w-9 sm:w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black font-mono transition-all ${
                      pin.length > index
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs scale-105'
                        : pin.length === index
                        ? 'border-slate-400 bg-white text-slate-400 ring-2 ring-orange-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-300'
                    }`}
                  >
                    {pin.length > index ? pin[index] : '•'}
                  </div>
                ))}
              </div>

              {/* Direct Input Field for keyboard typing / pasting */}
              <div className="mt-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPin(cleaned);
                    if (cleaned.length === 6) {
                      handleStaffPinLogin(cleaned);
                    }
                  }}
                  placeholder="أو اكتب الرمز من الكيبورد مباشرة"
                  className="w-full text-center text-xs py-2 px-3 border border-slate-200 rounded-xl font-mono focus:outline-none focus:border-orange-500 bg-slate-50/50"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 max-w-[280px] mx-auto" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadClick(num)}
                  disabled={isLoading}
                  className="h-11 bg-white hover:bg-orange-50 hover:border-orange-300 border border-slate-200 rounded-xl text-base font-black text-slate-800 transition-all active:scale-95 shadow-2xs cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadClick('clear')}
                className="h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => handleKeypadClick('0')}
                disabled={isLoading}
                className="h-11 bg-white hover:bg-orange-50 hover:border-orange-300 border border-slate-200 rounded-xl text-base font-black text-slate-800 transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadClick('back')}
                className="h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Submit button for entered PIN */}
            <button
              type="button"
              onClick={() => handleStaffPinLogin()}
              disabled={isLoading || pin.length < 4}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>دخول الموظف الآن</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Register Link Box */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            ليس لديك حساب مطعم بعد؟{' '}
            <Link href="/register" className="font-bold text-orange-600 hover:text-orange-700 hover:underline">
              سجل مطعمك الآن مجاناً
            </Link>
          </p>
        </div>

        {/* Security & Customer Menu Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center gap-1 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>اتصال آمن ومشفّر</span>
          </div>
          <Link href="/m" className="text-slate-600 hover:text-orange-600 font-bold">
            منيو الزبائن ←
          </Link>
        </div>

      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
