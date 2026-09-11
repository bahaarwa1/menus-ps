'use client';

import React, { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, ChefHat, KeyRound, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectFrom = searchParams.get('from') || '';
  const initialRole = searchParams.get('role') === 'staff' ? 'staff' : 'admin';

  const [activeTab, setActiveTab] = useState<'admin' | 'staff'>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('admin@menus.ps');
  const [password, setPassword] = useState('123456');
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
          redirectTo: redirectFrom || '/demo',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
        setIsLoading(false);
        return;
      }

      router.push(data.redirectTo || '/demo');
      router.refresh();
    } catch {
      setErrorMsg('تعذر الاتصال بخادم المصادقة. يرجى المحاولة لاحقاً.');
      setIsLoading(false);
    }
  };

  // Handle Staff (PIN Code) Login
  const handleStaffPinLogin = async (enteredPin?: string) => {
    const pinToSubmit = enteredPin || pin;
    if (!pinToSubmit) {
      setErrorMsg('يرجى إدخال رمز الـ PIN');
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
        setErrorMsg(data.error || 'رمز الـ PIN غير صحيح.');
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

  // Keypad button click
  const handleKeypadClick = (val: string) => {
    if (isLoading) return;
    if (val === 'back') {
      setPin((prev) => prev.slice(0, -1));
    } else if (val === 'clear') {
      setPin('');
    } else if (pin.length < 4) {
      const nextPin = pin + val;
      setPin(nextPin);
      if (nextPin.length === 4) {
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
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-10 z-10 relative overflow-hidden"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>

        {/* Logo / Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-3">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl shadow-orange-500/20 mx-auto border-2 border-orange-200 hover:scale-105 transition-transform">
              <img src="/logo.png" alt="MENUS Logo" className="w-full h-full object-cover" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mb-1">تسجيل الدخول</h1>
          <p className="text-xs font-bold text-slate-700">نظام إدارة ومطابخ المطاعم الذكية</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={16} className={activeTab === 'admin' ? 'text-orange-500' : ''} />
            <span>لوحة الإدارة</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'staff'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChefHat size={16} className={activeTab === 'staff' ? 'text-orange-500' : ''} />
            <span>المطبخ والخدمة (PIN)</span>
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-rose-50 border border-rose-300 rounded-xl p-3 flex items-center gap-2 text-rose-900 text-xs font-black"
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
              <label className="text-xs font-black text-slate-900 mr-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@menus.ps"
                  className="w-full pr-11 pl-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 transition-all text-slate-950 placeholder-slate-400 text-left shadow-2xs"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between mr-2 ml-2">
                <label className="text-xs font-black text-slate-900">كلمة المرور</label>
                <Link href="#" className="text-[11px] font-black text-orange-600 hover:text-orange-700">نسيت الرمز؟</Link>
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pr-11 pl-11 py-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 transition-all text-slate-950 placeholder-slate-400 text-left tracking-widest shadow-2xs"
                  dir="ltr"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>تسجيل الدخول للإدارة</span>
                    <ArrowRight size={18} className="rtl:rotate-180 group-hover:-translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Kitchen Staff Keypad (4-Digit PIN) */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-700 font-bold mb-3">أدخل رمز الدخول السريع (الافتراضي: 1234)</p>
              
              {/* PIN Dots Display */}
              <div className="flex justify-center gap-3 my-2" dir="ltr">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${
                      pin.length > index
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs'
                        : 'border-slate-300 bg-white text-slate-300'
                    }`}
                  >
                    {pin.length > index ? '●' : '○'}
                  </div>
                ))}
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 max-w-[280px] mx-auto" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadClick(num)}
                  disabled={isLoading}
                  className="h-12 bg-white hover:bg-orange-50 hover:border-orange-400 border-2 border-slate-200 rounded-xl text-base font-black text-slate-950 transition-all active:scale-95 shadow-2xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadClick('clear')}
                className="h-12 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-700 transition-all"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => handleKeypadClick('0')}
                disabled={isLoading}
                className="h-12 bg-white hover:bg-orange-50 hover:border-orange-400 border-2 border-slate-200 rounded-xl text-base font-black text-slate-950 transition-all active:scale-95 shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadClick('back')}
                className="h-12 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 rounded-xl text-xs font-black text-slate-700 transition-all"
              >
                ←
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleStaffPinLogin('1234')}
                disabled={isLoading}
                className="text-xs text-orange-600 hover:text-orange-700 font-extrabold underline inline-flex items-center gap-1"
              >
                <KeyRound size={14} />
                <span>دخول تجريبي بـ PIN: 1234</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Badge */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-slate-600 font-bold">
          <div className="flex items-center gap-1.5 text-xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>جلسات مشفّرة عديمة الحالة (Stateless)</span>
          </div>
          <Link href="/m" className="text-xs text-slate-700 hover:text-orange-600 font-black">
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
