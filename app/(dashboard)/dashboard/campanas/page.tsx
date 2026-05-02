import { getAuthenticatedUser }  from '@/lib/auth'
import { Header }                from '@/components/dashboard/Header'
import { ClaseEnVivoClient }     from '@/components/dashboard/campanas/ClaseEnVivoClient'

export const metadata = { title: 'Clase en Vivo — Diana Cortés' }

export default async function CampanasPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Clase en Vivo"
        subtitle="Meta Ads + GoHighLevel — funnel semanal por clase"
        user={user}
      />
      <ClaseEnVivoClient user={user} />
    </div>
  )
}
