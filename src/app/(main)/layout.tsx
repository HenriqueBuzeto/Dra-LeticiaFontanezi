import { ProtectedMain } from '@/components/ProtectedMain'

export const dynamic = 'force-dynamic'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedMain>{children}</ProtectedMain>
}
