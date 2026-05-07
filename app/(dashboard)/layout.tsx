import { getAuthenticatedUser } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
