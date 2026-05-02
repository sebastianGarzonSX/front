import { getAuthenticatedUser } from '@/lib/auth'
import { Header }              from '@/components/dashboard/Header'
import { EmbudoClient }        from '@/components/dashboard/embudo/EmbudoClient'

export const metadata = { title: 'Embudo por Ciudad — Diana Cortés' }

export default async function EmbudoPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Embudo por Ciudad"
        subtitle="Meta Ads vs CRM · Pipeline por etapa · Costos reales"
        user={user}
      />
      <EmbudoClient user={user} />
    </div>
  )
}
