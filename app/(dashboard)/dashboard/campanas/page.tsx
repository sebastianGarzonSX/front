import { getAuthenticatedUser } from '@/lib/auth'
import { Header } from '@/components/dashboard/Header'
import { CampanasClient } from '@/components/dashboard/campanas/CampanasClient'

export const metadata = { title: 'Campañas — Diana Cortés' }

export default async function CampanasPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Campañas & Atribución"
        subtitle="Informe unificado Meta Ads + GoHighLevel"
        user={user}
      />
      <CampanasClient user={user} />
    </div>
  )
}
