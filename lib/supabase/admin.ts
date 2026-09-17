if (typeof globalThis !== 'undefined' && !globalThis.WebSocket) {
  // Polyfill dummy WebSocket for server-side Node runtimes < 22
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = class DummyWebSocket {};
}

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-service-role-key';

  // لا تحفظ client إذا كان يستخدم قيم placeholder
  const isRealConfig = !url.includes('placeholder') && !serviceRoleKey.includes('placeholder') &&
    !url.includes('your-project') && !serviceRoleKey.includes('your-');

  if (isRealConfig && cachedAdminClient) return cachedAdminClient;

  const client = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (isRealConfig) {
    cachedAdminClient = client;
  }

  return client;
}

