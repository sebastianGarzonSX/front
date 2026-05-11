import { getAuthenticatedUser } from '@/lib/auth'
import { Header }               from '@/components/dashboard/Header'
import { PixelesClient }        from '@/components/dashboard/pixeles/PixelesClient'

export const metadata = { title: 'Gestión de Píxeles — Diana Cortés' }

export default async function PixelesPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Gestión de Píxeles"
        subtitle="Visitas a landing · eventos del Meta Pixel"
        user={user}
      />
      <PixelesClient user={user} />
    </div>
  )
}
