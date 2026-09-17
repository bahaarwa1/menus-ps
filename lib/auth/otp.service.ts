import { appCache } from '@/lib/cache/lru-cache';
import crypto from 'crypto';

interface OtpEntry {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

// In-memory fallback map for OTP storage
const otpStore = new Map<string, OtpEntry>();

/**
 * Generates a cryptographically secure 6-digit numeric OTP code.
 */
export function generateOtpCode(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Creates and stores a 6-digit verification code for the specified email.
 */
export async function createEmailOtp(email: string): Promise<{ code: string; expiresAt: number }> {
  const cleanEmail = email.trim().toLowerCase();
  const code = generateOtpCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const entry: OtpEntry = {
    code,
    email: cleanEmail,
    expiresAt,
    attempts: 0,
  };

  otpStore.set(cleanEmail, entry);
  appCache.set(`otp:${cleanEmail}`, entry, 600);

  // In production, we can also dispatch email via Resend, Supabase Auth, or Sendgrid
  console.log(`[AUTH-OTP] Generated 6-digit verification code for ${cleanEmail}: ${code}`);

  return { code, expiresAt };
}

/**
 * Validates the provided 6-digit verification code for the specified email.
 */
export async function verifyEmailOtp(email: string, enteredCode: string): Promise<{ valid: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const code = enteredCode.trim();

  let entry = otpStore.get(cleanEmail);
  if (!entry) {
    const cached = appCache.get<OtpEntry>(`otp:${cleanEmail}`);
    if (cached) entry = cached;
  }

  if (!entry) {
    return { valid: false, error: 'لم يتم العثور على رمز تحقق نشط أو انتهت صلاحيته. يرجى طلب رمز جديد.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(cleanEmail);
    appCache.delete(`otp:${cleanEmail}`);
    return { valid: false, error: 'انتهت صلاحية رمز التحقق (صالح لمدة 10 دقائق). يرجى طلب رمز جديد.' };
  }

  entry.attempts += 1;
  if (entry.attempts > 5) {
    otpStore.delete(cleanEmail);
    appCache.delete(`otp:${cleanEmail}`);
    return { valid: false, error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى طلب رمز جديد.' };
  }

  if (entry.code !== code) {
    return { valid: false, error: 'رمز التحقق غير صحيح. يرجى التأكد من الأرقام الستة وإعادة المحاولة.' };
  }

  // Verification successful: consume token
  otpStore.delete(cleanEmail);
  appCache.delete(`otp:${cleanEmail}`);

  return { valid: true };
}
