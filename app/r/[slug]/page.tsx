import { redirect } from 'next/navigation';

interface RestaurantRedirectProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function RestaurantRedirectPage({ params, searchParams }: RestaurantRedirectProps) {
  const { slug } = params;
  const token = searchParams.t || searchParams.token;
  
  const queryParams = new URLSearchParams();
  queryParams.set('restaurant', slug);
  if (token && typeof token === 'string') {
    queryParams.set('t', token);
  }

  redirect(`/m?${queryParams.toString()}`);
}
