import { AuthSession } from '@/types/auth.types';

export const SESSION_COOKIE_NAME = 'menus_session';
const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

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
  while (base64.length % 4) {
    base64 += '=';
  }
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

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'menus-ps-default-dev-secret-key-2026';
  const keyData = textEncode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Signs an AuthSession into a stateless compact JWT-like token.
 */
export async function signSession(session: Omit<AuthSession, 'exp'> & { exp?: number }): Promise<string> {
  const exp = session.exp || Math.floor(Date.now() / 1000) + DEFAULT_EXPIRY_SECONDS;
  const fullSession: AuthSession = { ...session, exp };

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
  } catch (err) {
    console.error('Session verification error:', err);
    return null;
  }
}
