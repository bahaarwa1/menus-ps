import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface StaffAccessCode {
  id: string;
  branch_id: string;
  code: string;
  employee_name: string;
  role: 'staff' | 'kitchen' | 'branch_manager';
  created_by?: string | null;
  expires_at: string;
  is_used: boolean;
  used_at?: string | null;
  created_at: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __menusStaffCodesStore: Map<string, StaffAccessCode> | undefined;
}

if (!global.__menusStaffCodesStore) {
  global.__menusStaffCodesStore = new Map<string, StaffAccessCode>();
}

const memoryStore = global.__menusStaffCodesStore;

/**
 * Saves a generated staff access code with Supabase primary + memory store resilience.
 */
export async function saveStaffAccessCode(
  input: Omit<StaffAccessCode, 'id' | 'is_used' | 'created_at'>
): Promise<StaffAccessCode> {
  const newCode: StaffAccessCode = {
    id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    branch_id: input.branch_id,
    code: input.code,
    employee_name: input.employee_name,
    role: input.role,
    created_by: input.created_by,
    expires_at: input.expires_at,
    is_used: false,
    created_at: new Date().toISOString(),
  };

  // 1. Try Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await (supabase as any)
        .from('staff_access_codes')
        .insert({
          branch_id: input.branch_id,
          code: input.code,
          employee_name: input.employee_name,
          role: input.role,
          created_by: input.created_by || null,
          expires_at: input.expires_at,
        })
        .select('id, code, employee_name, role, expires_at, created_at')
        .single();

      if (!error && data) {
        newCode.id = data.id;
        memoryStore.set(newCode.id, newCode);
        return newCode;
      }
      console.warn('Supabase staff code insert failed, using memory store fallback:', error?.message);
    } catch (err) {
      console.warn('Supabase staff code insert exception, using memory store fallback:', err);
    }
  }

  // 2. Resilient memory store (guaranteed 100% success in serverless/demo/local)
  memoryStore.set(newCode.id, newCode);
  return newCode;
}

/**
 * Lists active & expired staff access codes for a branch.
 */
export async function listStaffAccessCodes(branchId?: string): Promise<StaffAccessCode[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let q = (supabase as any)
        .from('staff_access_codes')
        .select('id, code, employee_name, role, expires_at, is_used, used_at, created_at, branch_id')
        .order('created_at', { ascending: false })
        .limit(50);
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        return data as StaffAccessCode[];
      }
    } catch {}
  }

  // Fallback to memory store
  const all = Array.from(memoryStore.values());
  const filtered = branchId ? all.filter((c) => c.branch_id === branchId) : all;
  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Finds a valid, non-expired, unused access code.
 */
export async function findStaffAccessCode(
  code: string,
  branchId?: string
): Promise<StaffAccessCode | null> {
  const now = new Date().toISOString();

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let q = (supabase as any)
        .from('staff_access_codes')
        .select('id, branch_id, employee_name, role, expires_at, is_used, code')
        .eq('code', code)
        .eq('is_used', false)
        .gt('expires_at', now);
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q.maybeSingle();
      if (!error && data) {
        return data as StaffAccessCode;
      }
    } catch {}
  }

  // 2. Try Memory Store
  const found = Array.from(memoryStore.values()).find(
    (c) =>
      c.code === code &&
      !c.is_used &&
      new Date(c.expires_at) > new Date() &&
      (!branchId || c.branch_id === branchId)
  );

  return found || null;
}

/**
 * Marks a code as used when an employee logs in.
 */
export async function markStaffAccessCodeUsed(codeId: string): Promise<void> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      await (supabase as any)
        .from('staff_access_codes')
        .update({ is_used: true, used_at: now })
        .eq('id', codeId);
    } catch {}
  }

  const inMem = memoryStore.get(codeId);
  if (inMem) {
    inMem.is_used = true;
    inMem.used_at = now;
    memoryStore.set(codeId, inMem);
  }
}

/**
 * Deletes a staff access code.
 */
export async function deleteStaffAccessCode(codeId: string, branchId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let q = (supabase as any).from('staff_access_codes').delete().eq('id', codeId);
      if (branchId) q = q.eq('branch_id', branchId);
      await q;
    } catch {}
  }

  memoryStore.delete(codeId);
  return true;
}
