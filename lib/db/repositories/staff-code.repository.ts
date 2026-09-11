
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
 * Saves a generated staff access code directly into Supabase staff_users table.
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

  // 1. Persist to Supabase staff_users table
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await (supabase as any)
        .from('staff_users')
        .insert({
          branch_id: input.branch_id,
          full_name: input.employee_name,
          role: input.role,
          pin_hash: input.code,
          is_active: true,
        })
        .select('id, branch_id, full_name, role, pin_hash')
        .single();

      if (!error && data) {
        newCode.id = data.id;
        memoryStore.set(newCode.id, newCode);
        return newCode;
      }
      console.warn('Supabase staff_users insert error:', error?.message);
    } catch (err) {
      console.warn('Supabase staff_users insert exception:', err);
    }
  }

  // 2. Resilient memory store fallback
  memoryStore.set(newCode.id, newCode);
  return newCode;
}

/**
 * Lists active staff access codes for a branch from staff_users.
 */
export async function listStaffAccessCodes(branchId?: string): Promise<StaffAccessCode[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let q = (supabase as any)
        .from('staff_users')
        .select('id, branch_id, full_name, role, pin_hash, is_active')
        .eq('is_active', true)
        .neq('role', 'owner')
        .limit(50);
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          branch_id: u.branch_id,
          code: u.pin_hash || '******',
          employee_name: u.full_name,
          role: u.role as 'staff' | 'kitchen' | 'branch_manager',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          is_used: false,
          created_at: new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase listStaffAccessCodes exception:', err);
    }
  }

  // Fallback to memory store
  const all = Array.from(memoryStore.values());
  const filtered = branchId ? all.filter((c) => c.branch_id === branchId) : all;
  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Finds a valid staff user/code by matching pin_hash in staff_users.
 */
export async function findStaffAccessCode(
  code: string,
  branchId?: string
): Promise<StaffAccessCode | null> {
  const cleanCode = String(code || '').trim();
  if (!cleanCode) return null;

  // 1. Try Supabase staff_users
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let q = (supabase as any)
        .from('staff_users')
        .select('id, branch_id, full_name, role, pin_hash, is_active')
        .eq('is_active', true)
        .eq('pin_hash', cleanCode);
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q.maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          branch_id: data.branch_id,
          code: data.pin_hash,
          employee_name: data.full_name,
          role: data.role as 'staff' | 'kitchen' | 'branch_manager',
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          is_used: false,
          created_at: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Supabase findStaffAccessCode exception:', err);
    }
  }

  // 2. Try Memory Store
  const found = Array.from(memoryStore.values()).find(
    (c) =>
      c.code === cleanCode &&
      !c.is_used &&
      (!branchId || c.branch_id === branchId)
  );

  return found || null;
}

/**
 * Marks a code as used when an employee logs in.
 */
export async function markStaffAccessCodeUsed(codeId: string): Promise<void> {
  const now = new Date().toISOString();
  const inMem = memoryStore.get(codeId);
  if (inMem) {
    inMem.is_used = true;
    inMem.used_at = now;
    memoryStore.set(codeId, inMem);
  }
}

/**
 * Deletes or deactivates a staff user/code.
 */
export async function deleteStaffAccessCode(codeId: string, branchId?: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      let q = (supabase as any).from('staff_users').delete().eq('id', codeId);
      if (branchId) q = q.eq('branch_id', branchId);
      await q;
    } catch {}
  }

  memoryStore.delete(codeId);
  return true;
}
