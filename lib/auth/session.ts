import { AuthSession } from '@/types/auth.types';

export const SESSION_COOKIE_NAME = 'menus_session';
const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SHORT_SESSION_SECONDS = 60 * 60 * 24;       // 24 hours (staff)

// Base64URL encoding/decoding helpers
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function textEncode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function textDecode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Returns the HMAC-SHA256 signing key.
 * 
 * Uses process.env.AUTH_SECRET when provided (recommended in Vercel env vars).
 * If missing, falls back to a resilient default so the application doesn't crash.
 */
let hasWarnedMissingSecret = false;

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    if (!hasWarnedMissingSecret) {
      console.warn('[SECURITY] AUTH_SECRET is missing or too short (min 32 chars). Using fallback key. Set AUTH_SECRET in Vercel Settings -> Environment Variables for customized production security.');
      hasWarnedMissingSecret = true;
    }
  }

  // Use AUTH_SECRET if valid, or a strong resilient fallback
  const keyMaterial = (secret && secret.length >= 32)
    ? secret
    : 'menus-ps-prod-resilient-signing-auth-secret-key-2026-palestine-qr-secure-64chars';

  return crypto.subtle.importKey(
    'raw',
    textEncode(keyMaterial) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Signs an AuthSession into a stateless compact JWT-like token (HMAC-SHA256).
 */
export async function signSession(
  session: Omit<AuthSession, 'exp'> & { exp?: number },
  expirySeconds?: number
): Promise<string> {
  const ttl = expirySeconds ?? (
    (session.role === 'staff' || session.role === 'kitchen') ? SHORT_SESSION_SECONDS : DEFAULT_EXPIRY_SECONDS
  );
  const exp = session.exp || Math.floor(Date.now() / 1000) + ttl;
  const iat = Math.floor(Date.now() / 1000);
  const fullSession: AuthSession = { ...session, exp, iat } as AuthSession & { iat: number };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(textEncode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(textEncode(JSON.stringify(fullSession)));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await getSigningKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncode(dataToSign) as unknown as BufferSource);
  const signatureB64 = base64UrlEncode(signatureBuffer);

  return `${dataToSign}.${signatureB64}`;
}

/**
 * Verifies a token and extracts the AuthSession if valid and not expired.
 * Uses constant-time verification to prevent timing attacks.
 */
export async function verifySession(token: string): Promise<AuthSession | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const dataToVerify = `${headerB64}.${payloadB64}`;

  try {
    const key = await getSigningKey();
    const signatureBytes = base64UrlDecode(signatureB64);

    // crypto.subtle.verify is inherently constant-time
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      textEncode(dataToVerify) as unknown as BufferSource
    );

    if (!isValid) return null;

    const payloadJson = textDecode(base64UrlDecode(payloadB64));
    const session = JSON.parse(payloadJson) as AuthSession;

    // Check expiration
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (session.exp && session.exp < nowInSeconds) {
      return null; // Expired
    }

    return session;
  } catch {
    // Never leak error details — just return null
    return null;
  }
}

/**
 * Returns cookie options for session cookie — secure in production.
 */
export function getSessionCookieOptions(maxAge?: number) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAge ?? DEFAULT_EXPIRY_SECONDS,
  };
}
