if (typeof globalThis !== 'undefined' && !globalThis.WebSocket) {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = class DummyWebSocket {};
}

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

let cachedBrowserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (cachedBrowserClient) return cachedBrowserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  cachedBrowserClient = createBrowserClient<Database>(url, anonKey);
  return cachedBrowserClient;
}

