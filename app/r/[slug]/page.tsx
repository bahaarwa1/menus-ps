import { redirect } from 'next/navigation';

interface RestaurantRedirectProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function RestaurantRedirectPage({ params, searchParams }: RestaurantRedirectProps) {
  const { slug } = params;
  const queryParams = new URLSearchParams();
  queryParams.set('restaurant', slug);

  for (const [key, value] of Object.entries(searchParams)) {
    if (key !== 'restaurant' && typeof value === 'string') {
      queryParams.set(key, value);
    }
  }

  redirect(`/m?${queryParams.toString()}`);
}
