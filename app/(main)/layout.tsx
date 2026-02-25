import { ProtectedMain } from '@/components/ProtectedMain'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedMain>{children}</ProtectedMain>
}
