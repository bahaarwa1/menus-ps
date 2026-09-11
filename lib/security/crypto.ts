/**
 * MENUS.ps — Secure Cryptographic Utilities & Customer Privacy Protection
 * 
 * All hashing & encryption uses the Web Crypto API (standard, built-in, zero external dependencies).
 * - PBKDF2-SHA256 for passwords and PINs
 * - AES-256-GCM authenticated encryption for sensitive customer PII & secrets
 * - Constant-time comparison to prevent timing attacks
 * - Cryptographically secure pseudo-random generators (CSPRNG)
 * - PII Masking for privacy-first display
 */

const PBKDF2_ITERATIONS = 100_000; // OWASP recommended minimum
const PBKDF2_HASH = 'SHA-256';
const SALT_LENGTH = 32; // 256 bits

function bufferToHex(buffer: ArrayBuffer | ArrayBufferView | any): string {
  const bytes = buffer instanceof Uint8Array
    ? buffer
    : new Uint8Array(buffer.buffer || buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function generateSalt(length = SALT_LENGTH): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PASSWORD & PIN HASHING (PBKDF2-SHA256)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hashes a password using PBKDF2-SHA256 with a random salt.
 * Returns: "pbkdf2:<iterations>:<saltHex>:<hashHex>"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    256 // 32 bytes
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(derivedBits);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verifies a password against a stored hash (constant-time).
 * Supports PBKDF2 hashes and legacy plain-text fallback.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !password) return false;

  // PBKDF2 format: "pbkdf2:<iterations>:<saltHex>:<hashHex>"
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 4) return false;

    const iterations = parseInt(parts[1], 10);
    const salt = hexToBuffer(parts[2]);
    const expectedHashHex = parts[3];

    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        { 
          name: 'PBKDF2', 
          salt: salt as unknown as BufferSource, 
          iterations, 
          hash: PBKDF2_HASH 
        },
        keyMaterial,
        256
      );

      const candidateHex = bufferToHex(derivedBits);
      return constantTimeEqual(candidateHex, expectedHashHex);
    } catch {
      return false;
    }
  }

  // Legacy plain-text fallback
  return constantTimeEqual(password, storedHash);
}

/**
 * Hashes a PIN (4-6 digits) using PBKDF2 with 50,000 iterations.
 * Returns: "pin_pbkdf2:<iterations>:<saltHex>:<hashHex>"
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = generateSalt(16);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { 
      name: 'PBKDF2', 
      salt: salt as unknown as BufferSource, 
      iterations: 50_000, 
      hash: PBKDF2_HASH 
    },
    keyMaterial,
    256
  );

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(derivedBits);
  return `pin_pbkdf2:50000:${saltHex}:${hashHex}`;
}

/**
 * Verifies a PIN against a stored hash (constant-time).
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !pin) return false;

  if (storedHash.startsWith('pin_pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 4) return false;

    const iterations = parseInt(parts[1], 10);
    const salt = hexToBuffer(parts[2]);
    const expectedHashHex = parts[3];

    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(pin),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const derivedBits = await crypto.subtle.deriveBits(
        { 
          name: 'PBKDF2', 
          salt: salt as unknown as BufferSource, 
          iterations, 
          hash: PBKDF2_HASH 
        },
        keyMaterial,
        256
      );

      const candidateHex = bufferToHex(derivedBits);
      return constantTimeEqual(candidateHex, expectedHashHex);
    } catch {
      return false;
    }
  }

  // Legacy plain-text PIN comparison
  return constantTimeEqual(pin, storedHash);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AES-256-GCM AUTHENTICATED ENCRYPTION (Data-at-rest & Customer PII)
// ─────────────────────────────────────────────────────────────────────────────

async function getAesGcmKey(secret?: string): Promise<CryptoKey> {
  const baseSecret = secret || process.env.AUTH_SECRET || 'menus-ps-default-encryption-key-must-be-changed-in-prod-32c!';
  // Hash the secret with SHA-256 to ensure exactly 256 bits (32 bytes)
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(baseSecret));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypts a string using AES-256-GCM with a random 96-bit initialization vector.
 * Returns: "enc:v1:<ivHex>:<ciphertextHex>"
 */
export async function encryptData(plaintext: string, customSecret?: string): Promise<string> {
  if (!plaintext) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for GCM
  const key = await getAesGcmKey(customSecret);
  const encoded = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoded
  );

  const ivHex = bufferToHex(iv);
  const ctHex = bufferToHex(encryptedBuffer);
  return `enc:v1:${ivHex}:${ctHex}`;
}

/**
 * Decrypts a string previously encrypted with encryptData.
 */
export async function decryptData(ciphertext: string, customSecret?: string): Promise<string> {
  if (!ciphertext || !ciphertext.startsWith('enc:v1:')) return ciphertext;
  const parts = ciphertext.split(':');
  if (parts.length !== 4) throw new Error('Invalid ciphertext format');

  const iv = hexToBuffer(parts[2]);
  const ct = hexToBuffer(parts[3]);
  const key = await getAesGcmKey(customSecret);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ct as unknown as BufferSource
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SECURE RANDOM GENERATORS (CSPRNG)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure numeric code (e.g. 6-digit PIN or OTP).
 */
export function generateSecurePin(digits = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const range = max - min + 1;

  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const val = min + (array[0] % range);
  return String(val);
}

/**
 * Generates a cryptographically secure random token (hex string).
 * @param bytes Number of random bytes (default 32 = 256 bits)
 */
export function generateSecureToken(bytes = 32): string {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  return bufferToHex(buffer);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TIMING-ATTACK RESISTANT COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constant-time string comparison to prevent timing attacks.
 * Never short-circuits — always compares all characters.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let dummy = 0;
    const safeLen = b.length || 1;
    for (let i = 0; i < a.length; i++) {
      dummy |= a.charCodeAt(i) ^ (b.charCodeAt(i % safeLen) || 0);
    }
    return dummy === -999999; // Never true, but uses dummy to prevent unused-var lint
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. INPUT SANITIZATION & PRIVACY MASKING (PII Protection)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitizes user input: strips dangerous tags, script injections, and caps length.
 */
export function sanitizeInput(input: string, maxLength = 500): string {
  return String(input || '')
    .replace(/<[^>]*>/g, '')           // Strip all HTML tags
    .replace(/[<>'"`;]/g, '')          // Strip dangerous XSS characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes customer order notes while allowing basic punctuation.
 */
export function sanitizeCustomerNote(note: string, maxLength = 300): string {
  return String(note || '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>{}[\]\\]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Masks a phone number to protect customer privacy on displays or receipts.
 * Example: "0599123456" -> "0599***456"
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length <= 6) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-3);
  return `${start}***${end}`;
}

/**
 * Masks an email address for display.
 * Example: "ahmad.k@gmail.com" -> "a***k@gmail.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  const maskedLocal = local[0] + '***' + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

/**
 * Masks customer name for public or shared screens (KDS / Kitchen).
 * Example: "أحمد عبد الله" -> "أحمد ع."
 */
export function maskCustomerName(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[1][0]}.`;
}

/**
 * Validates email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Validates that a password meets minimum security requirements.
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل');
  if (!/[A-Z]/.test(password)) errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  if (!/[0-9]/.test(password)) errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  return { valid: errors.length === 0, errors };
}
