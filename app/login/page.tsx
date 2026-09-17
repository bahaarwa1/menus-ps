'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ArrowLeft, ShieldCheck, ChefHat, AlertCircle, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import Logo from '@/components/common/Logo';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectFrom = searchParams.get('from') || '';
  const initialRole = searchParams.get('role') === 'staff' ? 'staff' : 'admin';
  const { language, direction } = useLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Admin (Email + Password) Login
  const handleAdminLogin = async (e?: React.FormEvent, overrideEmail?: string, overridePass?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const loginEmail = overrideEmail !== undefined ? overrideEmail : email;
    const loginPass = overridePass !== undefined ? overridePass : password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPass,
          redirectTo: redirectFrom || '/dashboard',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || (isEn ? 'Login failed. Please verify your credentials.' : 'فشل تسجيل الدخول. يرجى التحقق من البيانات.'));
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || '/dashboard');
      router.refresh();
    } catch {
      setErrorMsg(isEn ? 'Failed to connect to auth server. Please try again.' : 'تعذر الاتصال بخادم المصادقة. يرجى المحاولة لاحقاً.');
      setIsLoading(false);
    }
  };

  // Handle Google OAuth Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(isEn ? error.message : 'تعذر بدء تسجيل الدخول بواسطة Google. تأكد من تفعيل المزود.');
        setIsLoading(false);
      }
    } catch {
      setErrorMsg(isEn ? 'Failed to connect to Google' : 'فشل الاتصال بخدمة Google');
      setIsLoading(false);
    }
  };

  // Handle Staff (4-6 digit Code or PIN) Login
  const handleStaffPinLogin = async (enteredPin?: string) => {
    const pinToSubmit = (enteredPin || pin).trim();
    if (!pinToSubmit || pinToSubmit.length < 4) {
      setErrorMsg(isEn ? 'Please enter a PIN with at least 4 digits.' : 'يرجى إدخال رمز الدخول المكون من 4 أرقام على الأقل');
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
        setErrorMsg(data.error || (isEn ? 'Invalid or expired staff PIN code.' : 'رمز الدخول غير صالح أو منتهي الصلاحية.'));
        setPin('');
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || '/staff');
      router.refresh();
    } catch {
      setErrorMsg(isEn ? 'Failed to connect to auth server.' : 'تعذر الاتصال بخادم المصادقة.');
      setIsLoading(false);
    }
  };


  // Keypad button click
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans selection:bg-orange-500 selection:text-white" dir={direction}>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-orange-500/5 blur-[120px]"></div>
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-6 sm:p-9 z-10 relative overflow-hidden"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500"></div>

        {/* Top bar with Logo & Language Toggle */}
        <div className="flex items-center justify-between mb-4">
          <Logo size="sm" href="/" />
          <LanguageSwitcher variant="pill" />
        </div>

        {/* Header Title */}
        <div className={`mb-5 ${isEn ? 'text-left' : 'text-right'}`}>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            {isEn ? 'Sign In' : 'تسجيل الدخول'}
          </h1>
          <p className="text-xs font-medium text-slate-500">
            {isEn 
              ? 'MENUS.ps Smart Restaurant & Kitchen Management' 
              : 'نظام إدارة ومطابخ المطاعم الذكية MENUS.ps'}
          </p>
        </div>


        {/* Role Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={15} className={activeTab === 'admin' ? 'text-orange-500' : ''} />
            <span>{isEn ? 'Admin (Owner)' : 'لوحة الإدارة (مالك)'}</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ChefHat size={15} className={activeTab === 'staff' ? 'text-orange-500' : ''} />
            <span>{isEn ? 'Staff (PIN Code)' : 'دخول الموظف (كود PIN)'}</span>
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
          <form onSubmit={(e) => handleAdminLogin(e)} className="space-y-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-bold text-slate-700 block ${isEn ? 'text-left' : 'text-right'}`}>
                {isEn ? 'Email or Restaurant Slug' : 'البريد الإلكتروني أو معرّف المطعم (Slug)'}
              </label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isEn ? 'left-3.5' : 'right-3.5'}`} size={18} />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={isEn ? "admin@menus.ps or burger-house-nablus" : "admin@menus.ps أو معرف المطعم"}
                  className={`w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 transition-all text-slate-800 placeholder-slate-400 shadow-2xs ${
                    isEn ? 'pl-10 pr-4 text-left' : 'pr-10 pl-4 text-left'
                  }`}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-bold text-slate-700 block ${isEn ? 'text-left' : 'text-right'}`}>
                {isEn ? 'Password' : 'كلمة المرور'}
              </label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isEn ? 'left-3.5' : 'right-3.5'}`} size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 transition-all text-slate-800 placeholder-slate-400 tracking-widest shadow-2xs ${
                    isEn ? 'pl-10 pr-10 text-left' : 'pr-10 pl-10 text-left'
                  }`}
                  dir="ltr"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 focus:outline-none cursor-pointer ${
                    isEn ? 'right-3.5' : 'left-3.5'
                  }`}
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
                    <span>{isEn ? 'Sign In to Dashboard' : 'تسجيل الدخول إلى لوحة التحكم'}</span>
                    {isEn ? (
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    ) : (
                      <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Google OAuth Button */}
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-bold">
                  {isEn ? 'OR' : 'أو من خلال'}
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200 py-3 rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isEn ? 'Continue with Google' : 'المتابعة باستخدام Google'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Staff 4-6 Digit Access Code & PIN Keypad */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-700 font-bold mb-1">
                {isEn ? 'Staff Access PIN (4 to 6 Digits)' : 'رمز الدخول المكون من 4 إلى 6 أرقام'}
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                {isEn 
                  ? 'Enter the staff PIN provided by the manager for direct Kitchen Display access' 
                  : 'أدخل الرمز السريع المسلم لك للدخول المباشر لشاشة المطبخ (PIN 1234)'}
              </p>
              
              {/* 6-Digit Dots / Input Display */}
              <div className="flex justify-center gap-1.5 sm:gap-2 my-2" dir="ltr">
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
                    if (cleaned.length === 6 || cleaned.length === 4) {
                      // auto attempt on 4 or 6 if typed
                      if (cleaned.length === 4 || cleaned.length === 6) {
                        handleStaffPinLogin(cleaned);
                      }
                    }
                  }}
                  placeholder={isEn ? "Or type PIN from keyboard (e.g. 1234)" : "أو اكتب الرمز من الكيبورد مباشرة (مثال: 1234)"}
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
                {isEn ? 'Clear' : 'مسح'}
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
                  <span>{isEn ? 'Enter Staff Screen Now' : 'دخول الموظف الآن'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Register Link Box */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            {isEn ? "Don't have a restaurant account yet? " : "ليس لديك حساب مطعم بعد؟ "}
            <Link href="/register" className="font-bold text-orange-600 hover:text-orange-700 hover:underline">
              {isEn ? 'Register your restaurant free' : 'سجل مطعمك الآن مجاناً'}
            </Link>
          </p>
        </div>

        {/* Security & Customer Menu Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center gap-1 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>{isEn ? 'Secure Encrypted Connection' : 'اتصال آمن ومشفّر'}</span>
          </div>
          <Link href="/m" className="text-slate-600 hover:text-orange-600 font-bold flex items-center gap-1">
            <span>{isEn ? 'Customer Menu' : 'منيو الزبائن'}</span>
            {isEn ? '→' : '←'}
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
