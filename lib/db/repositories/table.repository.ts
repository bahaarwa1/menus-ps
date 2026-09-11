import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { tables as fallbackTables } from '@/data/demo-data';
import { TableStatus } from '@/types/database.types';

export interface VerifiedTable {
  id: string;
  branchId: string;
  tableNumber: number;
  seats: number;
  status: TableStatus;
  restaurantName?: string;
  restaurantSlug?: string;
  branchName?: string;
  currency?: string;
}

/**
 * Validates a table by QR token in O(1) using index idx_tables_qr_token.
 */
export async function getTableByQrToken(qrToken: string): Promise<VerifiedTable | null> {
  if (!isSupabaseConfigured()) {
    // Check if token follows the valid format: qr_... or tbl_...
    if (!qrToken.startsWith('qr_') && !qrToken.startsWith('tbl_') && !qrToken.startsWith('table_')) {
      return null;
    }
    const match = qrToken.match(/(?:_t|table_)(\d+)/i) || qrToken.match(/(\d+)/);
    if (!match) return null;
    const tableNum = parseInt(match[1], 10);
    const found = fallbackTables.find((t) => t.id === tableNum);
    if (!found) return null;
    return {
      id: `table-mock-${found.id}`,
      branchId: 'b0000000-0000-0000-0000-000000000001',
      tableNumber: found.id,
      seats: found.seats,
      status: found.status as TableStatus,
      restaurantName: 'Burger House نابلس',
      restaurantSlug: 'burger-house-nablus',
      branchName: 'فرع رفيديا — نابلس',
      currency: '₪',
    };
  }

  try {
    const supabase = createClient();
    const { data: rawData, error } = await supabase
      .from('tables')
      .select(`
        id, branch_id, table_number, seats, status,
        branches (
          id, name,
          restaurants (
            id, name, slug, currency
          )
        )
      `)
      .eq('qr_token', qrToken)
      .single();

    if (error || !rawData) {
      return null;
    }

    const data = rawData as unknown as {
      id: string;
      branch_id: string;
      table_number: number;
      seats: number;
      status: TableStatus;
      branches?: {
        id: string;
        name: string;
        restaurants?: {
          id: string;
          name: string;
          slug: string;
          currency: string;
        };
      };
    };

    return {
      id: data.id,
      branchId: data.branch_id,
      tableNumber: data.table_number,
      seats: data.seats,
      status: data.status,
      restaurantName: data.branches?.restaurants?.name || 'مطعم Menus.ps',
      restaurantSlug: data.branches?.restaurants?.slug || 'burger-house-nablus',
      branchName: data.branches?.name || 'الفرع الرئيسي',
      currency: data.branches?.restaurants?.currency || '₪',
    };
  } catch (error) {
    console.error('Error fetching table by token:', error);
    return null;
  }
}
