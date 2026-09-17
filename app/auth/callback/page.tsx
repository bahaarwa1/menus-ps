'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

/**
 * OAuth Callback Handler — Client-Side PKCE Exchange
 *
 * Supabase redirects here after successful Google login.
 * We let the browser-side Supabase client exchange the code
 * (it handles PKCE natively), then we call our session API
 * to create our own JWT session cookie.
 *
 * Also handles the fallback case where the code lands at / 
 * and the middleware redirects it here.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Let Supabase JS client detect and exchange the code+verifier automatically
        // This works with both hash fragments (#access_token=...) and query codes (?code=...)
        const { data: { session }, error } = await supabase.auth.getSession();

        // If no session yet, try to exchange the code manually (PKCE)
        if (!session && !error) {
          const code = searchParams.get('code');
          if (code) {
            const { data: exchanged, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeErr || !exchanged.session) {
              setErrorMsg('فشل التحقق من رمز Google. يرجى المحاولة مرة أخرى.');
              setStatus('error');
              return;
            }
          }
        }

        // Get the final user
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user || !user.email) {
          setErrorMsg('لم يتم التعرف على حسابك. يرجى المحاولة مجدداً.');
          setStatus('error');
          return;
        }

        // Call our login API to create our custom session cookie
        const loginRes = await fetch('/api/auth/google-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'مستخدم جديد',
            avatarUrl: user.user_metadata?.avatar_url || '',
          }),
        });

        const loginData = await loginRes.json();

        if (loginData.success) {
          window.location.href = loginData.redirectTo || '/dashboard';
        } else {
          setErrorMsg(loginData.error || 'حدث خطأ أثناء إنشاء الجلسة');
          setStatus('error');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setErrorMsg('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-neutral-900 flex items-center justify-center p-4 font-sans"
    >
      <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700/60 rounded-3xl shadow-2xl p-8 text-center">
        {status === 'loading' ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-5">
              <Loader2 size={32} className="text-orange-400 animate-spin" />
            </div>
            <h1 className="text-lg font-black text-white mb-2">جارٍ التحقق من حسابك</h1>
            <p className="text-sm text-slate-400">يرجى الانتظار قليلاً...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400 text-3xl">
              ✗
            </div>
            <h1 className="text-lg font-black text-white mb-2">فشل تسجيل الدخول</h1>
            <p className="text-sm text-slate-400 mb-5">{errorMsg}</p>
            <a
              href="/login"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all"
            >
              العودة لتسجيل الدخول
            </a>
          </>
        )}
      </div>
    </div>
  );
}
