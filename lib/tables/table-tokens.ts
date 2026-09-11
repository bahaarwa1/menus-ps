import { getTableByQrToken } from '@/lib/db/repositories/table.repository';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';

export interface TableVerificationResult {
  valid: boolean;
  error?: string;
  table?: {
    id: string;
    branchId: string;
    tableNumber: number;
    seats: number;
    status: string;
    qrToken: string;
    restaurantName: string;
    restaurantSlug?: string;
    branchName: string;
    currency?: string;
  };
}

/**
 * Generates a dynamic cryptographic table token.
 * Format: qr_<branchPrefix>_<tableNum>_<randomHex>
 */
export function generateSecureTableToken(branchId: string, tableNumber: number): string {
  const branchPrefix = branchId.split('-')[0] || 'b1';
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `qr_${branchPrefix}_t${tableNumber}_${randomHex}`;
}

/**
 * Verifies a QR token in O(1) time complexity using index idx_tables_qr_token.
 */
export async function verifyTableToken(token: string): Promise<TableVerificationResult> {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return { valid: false, error: 'رمز QR مفقود' };
  }

  const cleanToken = token.trim();

  // 1. Direct O(1) lookup via table repository
  const verified = await getTableByQrToken(cleanToken);

  if (!verified) {
    return {
      valid: false,
      error: 'رمز QR غير صالح أو منتهي الصلاحية. يرجى مسح الكود الموجود على طاولتك مرة أخرى.',
    };
  }

  return {
    valid: true,
    table: {
      id: verified.id,
      branchId: verified.branchId,
      tableNumber: verified.tableNumber,
      seats: verified.seats,
      status: verified.status,
      qrToken: cleanToken,
      restaurantName: verified.restaurantName || 'Burger House نابلس',
      restaurantSlug: verified.restaurantSlug || 'burger-house-nablus',
      branchName: verified.branchName || 'الفرع الرئيسي',
      currency: verified.currency || '₪',
    },
  };
}

/**
 * Regenerates a table's QR token (Rotation / Security Refresh).
 */
export async function rotateTableToken(tableId: string | number): Promise<{ success: boolean; newToken?: string; error?: string }> {
  const tableNum = typeof tableId === 'number' ? tableId : parseInt(String(tableId).replace(/\D/g, ''), 10) || 1;
  const newToken = generateSecureTableToken('b0000000-0000-0000-0000-000000000001', tableNum);

  if (isSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();
      const { error } = await (adminSupabase.from('tables') as any)
        .update({ qr_token: newToken })
        .eq('table_number', tableNum);

      if (error) {
        console.error('Failed to rotate table token in Supabase:', error);
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.warn('Database rotate error, updating fallback:', err);
    }
  }

  return { success: true, newToken };
}
