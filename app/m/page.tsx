import { headers } from 'next/headers';
import { getRestaurantMenu, PublicMenuCategory } from '@/lib/db/repositories/menu.repository';
import { getRestaurantBySlug } from '@/lib/db/repositories/restaurant.repository';
import CustomerMenuClient from './CustomerMenuClient';
import { categories as fallbackCategories, menuItems as fallbackMenuItems } from '@/data/demo-data';

// Pre-compute fallback dataset for instant 0ms demo rendering
const precomputedDemoCategories = fallbackCategories.map((cat) => ({
  id: cat.id,
  name: cat.name,
  icon: cat.icon,
  items: fallbackMenuItems
    .filter((item) => item.category === cat.id)
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      imageUrl: item.imageUrl,
      popular: item.popular,
      spicy: item.spicy,
      category: item.category,
      extras: item.extras,
    })),
}));

const precomputedDemoItems = fallbackMenuItems.map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  image: item.image,
  imageUrl: item.imageUrl,
  popular: item.popular,
  spicy: item.spicy,
  category: item.category,
  extras: item.extras,
}));

interface MenuPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const headerTenant = headersList.get('x-tenant-subdomain') || '';

  // 1. Resolve restaurant slug from searchParams, tenant header, or hostname
  let rawSlug = '';
  if (typeof searchParams.restaurant === 'string') {
    rawSlug = searchParams.restaurant;
  } else if (headerTenant && headerTenant !== 'www' && headerTenant !== 'menus') {
    rawSlug = headerTenant;
  } else {
    const hostWithoutPort = host.split(':')[0].toLowerCase();
    if (hostWithoutPort.endsWith('.menus.cool')) {
      const parts = hostWithoutPort.slice(0, -'.menus.cool'.length).split('.');
      if (parts[0] && parts[0] !== 'www' && parts[0] !== 'menus') {
        rawSlug = parts[0];
      }
    } else if (hostWithoutPort.endsWith('.menus.ps')) {
      const parts = hostWithoutPort.slice(0, -'.menus.ps'.length).split('.');
      if (parts[0] && parts[0] !== 'www' && parts[0] !== 'menus') {
        rawSlug = parts[0];
      }
    }
  }

  // 2. Resolve table and QR token
  const qrTokenParam =
    (typeof searchParams.t === 'string' ? searchParams.t : '') ||
    (typeof searchParams.token === 'string' ? searchParams.token : '');

  if (!rawSlug && qrTokenParam) {
    const tokenSlugMatch = qrTokenParam.match(/^qr_([a-zA-Z0-9-]+)_t\d+/);
    if (tokenSlugMatch) rawSlug = tokenSlugMatch[1];
  }

  const tableParamStr = typeof searchParams.table === 'string' ? searchParams.table : '';
  const tableParam = tableParamStr ? parseInt(tableParamStr, 10) : 0;
  const tokenTableMatch = qrTokenParam ? qrTokenParam.match(/_t(\d+)_/) : null;
  const tableFromToken = tokenTableMatch ? parseInt(tokenTableMatch[1], 10) : 0;
  const tableNumber = tableParam || tableFromToken || 0;

  const cleanSlug = rawSlug.trim().toLowerCase();
  const isDemo = !cleanSlug || cleanSlug === 'burger-house-nablus' || cleanSlug === 'demo';

  // 3. Instant Demo Render (Zero-latency fallback)
  if (isDemo) {
    return (
      <CustomerMenuClient
        initialSlug="burger-house-nablus"
        initialSettings={{
          name: 'Burger House نابلس',
          slug: 'burger-house-nablus',
          city: 'نابلس',
          logoUrl: '',
          currency: '₪',
          isActive: true,
        }}
        initialCategories={precomputedDemoCategories}
        initialMenuItems={precomputedDemoItems}
        initialTable={tableNumber || 1}
        initialTokenVerified={true}
        qrTokenParam={qrTokenParam}
        isExplicitDemo={true}
      />
    );
  }

  // 4. Authoritative Server-Side Fetch (SSR)
  // Queries Supabase + appCache directly in parallel — NO client waterfall
  const [menu, restaurant] = await Promise.all([
    getRestaurantMenu(cleanSlug),
    getRestaurantBySlug(cleanSlug),
  ]);

  if (!menu && !restaurant) {
    return (
      <CustomerMenuClient
        initialSlug={cleanSlug}
        initialNotFound={true}
        initialCategories={[]}
        initialMenuItems={[]}
        initialTable={tableNumber}
        qrTokenParam={qrTokenParam}
        isExplicitDemo={false}
      />
    );
  }

  const isSuspended = restaurant ? (restaurant as any).isActive === false : false;

  const categories = (menu || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    items: (cat.items || []).map((it) => ({
      ...it,
      category: cat.id,
    })),
  }));
  const allItems = categories.flatMap((cat) => cat.items);

  const settings = restaurant
    ? {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logoUrl: (restaurant as any).logoUrl || '',
        city: restaurant.city || '',
        address: restaurant.address || '',
        currency: restaurant.currency || '₪',
        branchId: restaurant.branchId || '',
        branchName: restaurant.branchName || '',
        isActive: !isSuspended,
      }
    : null;

  return (
    <CustomerMenuClient
      initialSlug={cleanSlug}
      initialSettings={settings}
      initialCategories={categories}
      initialMenuItems={allItems}
      initialTable={tableNumber}
      initialTokenVerified={tableNumber > 0}
      initialSuspended={isSuspended}
      qrTokenParam={qrTokenParam}
      isExplicitDemo={false}
    />
  );
}
