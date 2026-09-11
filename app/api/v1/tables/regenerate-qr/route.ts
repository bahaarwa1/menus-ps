import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { cookies } from 'next/headers';

function generateQrToken(branchId: string, tableNumber: number): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `tbl_${branchId.slice(0, 8)}_${tableNumber}_${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;

    if (!session || !['owner', 'admin', 'branch_manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const { tableId } = await request.json();
    if (!tableId) {
      return NextResponse.json({ success: false, error: 'معرف الطاولة مطلوب' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch the table
    const { data: table, error: fetchErr } = await (supabase as any)
      .from('tables')
      .select('id, branch_id, table_number')
      .eq('id', tableId)
      .single();

    if (fetchErr || !table) {
      return NextResponse.json({ success: false, error: 'الطاولة غير موجودة' }, { status: 404 });
    }

    const t = table as { id: string; branch_id: string; table_number: number };
    const newToken = generateQrToken(t.branch_id, t.table_number);

    const { error: updateErr } = await (supabase as any)
      .from('tables')
      .update({ qr_token: newToken })
      .eq('id', tableId);

    if (updateErr) {
      return NextResponse.json({ success: false, error: 'فشل تحديث رمز QR' }, { status: 500 });
    }

    return NextResponse.json({ success: true, qrToken: newToken, tableId });
  } catch (error) {
    console.error('regenerate-qr error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}
