import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { appCache } from '@/lib/cache/lru-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const configured = isSupabaseConfigured();

  let dbStatus: 'connected' | 'unconfigured' | 'error' = 'unconfigured';
  let dbLatencyMs: number | null = null;
  let dbError: string | null = null;

  if (configured) {
    try {
      const supabase = createClient();
      const dbStart = Date.now();
      const { error } = await supabase.from('restaurants').select('id').limit(1);
      dbLatencyMs = Date.now() - dbStart;

      if (error) {
        dbStatus = 'error';
        dbError = error.message;
      } else {
        dbStatus = 'connected';
      }
    } catch (err: unknown) {
      dbStatus = 'error';
      dbError = err instanceof Error ? err.message : String(err);
    }
  }

  const memoryUsage = process.memoryUsage();

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    system: {
      memoryRssMb: (memoryUsage.rss / 1024 / 1024).toFixed(1),
      heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(1),
      heapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(1),
    },
    cache: appCache.getStats(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      configured,
      poolerConfigured: Boolean(process.env.DATABASE_POOLER_URL),
      error: dbError,
    },
    latencyMs: Date.now() - startTime,
  });
}
