import StaffOrdersManagementPage from '../page';

interface StaffSlugPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StaffSlugPage({ params }: StaffSlugPageProps) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug || '';
  const cleanSlug = rawSlug.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();

  return <StaffOrdersManagementPage initialSlug={cleanSlug} />;
}
