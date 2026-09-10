/**
 * Checks whether Supabase environment variables are properly configured with real values.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return false;
  if (url.includes('placeholder-project') || key.includes('placeholder-anon-key')) return false;
  if (url.includes('your-project') || key.includes('your-anon-key')) return false;

  return true;
}

export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return false;
  if (url.includes('placeholder-project') || serviceKey.includes('placeholder-service-role-key')) return false;
  if (url.includes('your-project') || serviceKey.includes('your-service-role-key')) return false;

  return true;
}
