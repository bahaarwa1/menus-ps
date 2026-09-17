import { redirect } from 'next/navigation';

interface RestaurantRedirectProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function RestaurantRedirectPage({ params, searchParams }: RestaurantRedirectProps) {
  // Sanitize restaurant slug (alphanumeric, dashes, and underscores only)
  const rawSlug = params?.slug || '';
  const cleanSlug = rawSlug.replace(/[^a-zA-Z0-9-_]/g, '');

  if (!cleanSlug) {
    redirect('/');
  }

  const queryParams = new URLSearchParams();

  // Whitelist safe query parameters for customer menu flow
  const allowedKeys = ['table', 'token', 't', 'lang'];
  for (const key of allowedKeys) {
    const val = searchParams[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      // Sanitize value (strip control chars, limit length)
      const cleanVal = val.trim().slice(0, 150);
      queryParams.set(key, cleanVal);
    }
  }

  const qs = queryParams.toString();
  redirect(`https://${cleanSlug}.menus.cool/${qs ? `?${qs}` : ''}`);
}
