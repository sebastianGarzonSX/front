import { getAuthenticatedUser } from '@/lib/auth'
import { Header } from '@/components/dashboard/Header'
import { LeadsTable } from '@/components/dashboard/LeadsTable'

export const metadata = { title: 'Leads — Diana Cortés' }

export default async function LeadsPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Leads"
        subtitle="Listado completo de contactos en GoHighLevel."
        user={user}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <LeadsTable />
      </div>
    </div>
  )
}
