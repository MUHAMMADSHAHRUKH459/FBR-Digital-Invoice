import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Muhammad Shahrukh Accounting | Dashboard',
  description: 'Manage your FBR and local invoices',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
