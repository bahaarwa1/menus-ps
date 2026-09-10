import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { tables as fallbackTables } from '@/data/demo-data';

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get('branchId') || 'b0000000-0000-0000-0000-000000000001';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tables')
        .select('id, branch_id, table_number, seats, qr_token, status')
        .eq('branch_id', branchId)
        .order('table_number', { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          tables: (data as any[]).map((t) => ({
            id: t.table_number,
            dbId: t.id,
            seats: t.seats,
            status: t.status,
            qrToken: t.qr_token,
            qrUrl: `${appUrl}/m?t=${t.qr_token}`,
          })),
        });
      }
    } catch (err) {
      console.warn('Database tables list warning, using fallback:', err);
    }
  }

  // Fallback demo tables with tokens
  return NextResponse.json({
    success: true,
    tables: fallbackTables.map((t) => {
      const token = `qr_token_table_${t.id}_nablus`;
      return {
        id: t.id,
        seats: t.seats,
        status: t.status,
        qrToken: token,
        qrUrl: `${appUrl}/m?t=${token}`,
      };
    }),
  });
}
