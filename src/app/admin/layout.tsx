import { AdminLayoutWrapper } from '@/components/admin/AdminLayoutWrapper'

export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
}
