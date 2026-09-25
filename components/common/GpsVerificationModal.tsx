'use client';

import React from 'react';
import { MapPin, Navigation, AlertTriangle, ShieldCheck, RefreshCw, X, Loader2, UserCheck, HelpCircle } from 'lucide-react';
import { Coordinates } from '@/lib/geo/geofence';

export type GpsStatus = 'idle' | 'checking' | 'too_far' | 'permission_denied' | 'error' | 'success';

interface GpsVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: GpsStatus;
  distanceMeters?: number;
  allowedRadiusMeters?: number;
  restaurantName?: string;
  restaurantLocationText?: string;
  errorMessage?: string;
  onRetry: () => void;
  onCallWaiter?: () => void;
  onSimulateInside?: () => void; // for testing/preview in dev or authorized demo
}

export default function GpsVerificationModal({
  isOpen,
  onClose,
  status,
  distanceMeters,
  allowedRadiusMeters = 350,
  restaurantName = 'مطعم وكافيه شيشة ومنقوشة',
  restaurantLocationText = 'نابلس - رفيديا - الشارع الرئيسي',
  errorMessage,
  onRetry,
  onCallWaiter,
  onSimulateInside,
}: GpsVerificationModalProps) {
  if (!isOpen) return null;

  const formattedDistance =
    distanceMeters !== undefined
      ? distanceMeters >= 1000
        ? `${(distanceMeters / 1000).toFixed(1)} كم`
        : `${distanceMeters} متر`
      : '';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 text-center font-sans overflow-hidden">
        
        {/* Close Button */}
        {status !== 'checking' && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* 1. STATE: CHECKING */}
        {status === 'checking' && (
          <div className="py-4 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-[#7A1C30]/20 rounded-full animate-ping" />
              <div className="absolute inset-2 bg-[#7A1C30]/10 rounded-full animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-[#7A1C30] text-white flex items-center justify-center shadow-lg shadow-[#7A1C30]/30">
                <Navigation size={26} className="animate-spin text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                التحقق من موقعك الجغرافي (GPS) 📍
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                جاري التأكد من تواجدك داخل صالة <span className="font-bold text-slate-800">{restaurantName}</span> لإرسال طلب الطاولة فورياً للمطبخ.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#7A1C30] pt-2">
              <Loader2 size={15} className="animate-spin" />
              <span>جاري قراءة إحداثيات الموقع...</span>
            </div>
          </div>
        )}

        {/* 2. STATE: TOO FAR */}
        {status === 'too_far' && (
          <div className="py-3 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shadow-inner">
              <MapPin size={32} />
            </div>

            <div>
              <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-black px-3 py-0.5 rounded-full mb-2">
                خارج نطاق المطعم الجغرافي
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                عذراً، الطلب متاح فقط داخل المطعم 📍
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                خدمة الطلب المباشر من الطاولات مخصصة لزبائننا المتواجدين داخل المطعم في <strong className="text-slate-900">{restaurantLocationText}</strong>.
              </p>
              {distanceMeters !== undefined && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>المسافة التقديرية الحالية:</span>
                  <span className="text-[#7A1C30] font-black font-mono text-sm">{formattedDistance}</span>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2">
                (نطاق الطاولات المسموح به: حتى {allowedRadiusMeters} متر من موقع الصالة)
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3 rounded-2xl bg-[#7A1C30] hover:bg-[#631425] text-white text-xs font-black shadow-md shadow-[#7A1C30]/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <RefreshCw size={15} />
                <span>إعادة فحص الموقع (أنا داخل المطعم)</span>
              </button>

              {onCallWaiter && (
                <button
                  type="button"
                  onClick={onCallWaiter}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserCheck size={15} />
                  <span>طلب مساعدة الويتر لتأكيد الطلب يدوياً</span>
                </button>
              )}

              {onSimulateInside && (
                <button
                  type="button"
                  onClick={onSimulateInside}
                  className="w-full py-2 text-[10px] text-slate-400 hover:text-slate-600 underline font-medium"
                >
                  تأكيد تجريبي (أنا داخل الفرع للتجربة)
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3. STATE: PERMISSION DENIED OR ERROR */}
        {(status === 'permission_denied' || status === 'error') && (
          <div className="py-3 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center shadow-inner">
              <AlertTriangle size={32} />
            </div>

            <div>
              <span className="inline-block bg-rose-100 text-rose-800 text-[11px] font-black px-3 py-0.5 rounded-full mb-2">
                تحديد الموقع مطلوب (GPS)
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                يرجى السماح بالوصول لموقعك الجغرافي
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {errorMessage || 'لتأكيد طلبك على الطاولة وحمايتك من الطلبات العشوائية، يرجى تفعيل إذن الموقع الجغرافي (GPS) في متصفح هاتفك.'}
              </p>
              
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 text-right space-y-1">
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <HelpCircle size={13} className="text-[#7A1C30]" />
                  <span>كيفية التفعيل:</span>
                </div>
                <div>1. اضغط على أيقونة القفل أو الإعدادات بجانب شريط الرابط.</div>
                <div>2. اختر <strong>الموقع (Location)</strong> ثم اضغط <strong>سماح (Allow)</strong>.</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3 rounded-2xl bg-[#7A1C30] hover:bg-[#631425] text-white text-xs font-black shadow-md shadow-[#7A1C30]/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <RefreshCw size={15} />
                <span>إعادة المحاولة والموافقة على الموقع</span>
              </button>

              {onCallWaiter && (
                <button
                  type="button"
                  onClick={onCallWaiter}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserCheck size={15} />
                  <span>طلب مساعدة الويتر لتأكيد الطلب</span>
                </button>
              )}

              {onSimulateInside && (
                <button
                  type="button"
                  onClick={onSimulateInside}
                  className="w-full py-2 text-[10px] text-slate-400 hover:text-slate-600 underline font-medium"
                >
                  تخطي الفحص وتأكيد الطلب (وضع تجريبي)
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. STATE: SUCCESS */}
        {status === 'success' && (
          <div className="py-4 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-inner">
              <ShieldCheck size={34} />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                تم تأكيد تواجدك داخل المطعم بنجاح! ✅
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                جاري إرسال طلبك مباشرة للمطبخ...
              </p>
              {distanceMeters !== undefined && (
                <div className="mt-2 text-[11px] font-bold text-emerald-700 font-mono">
                  المسافة المؤكدة: {distanceMeters} متر
                </div>
              )}
            </div>

            <div className="flex items-center justify-center pt-2">
              <Loader2 size={18} className="animate-spin text-emerald-600" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
