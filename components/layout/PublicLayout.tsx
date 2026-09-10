import Navbar from '@/components/layout/Navbar';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-14">
        {children}
      </main>
    </>
  );
}
