import { getAuthenticatedUser } from '@/lib/auth'
import { Header }              from '@/components/dashboard/Header'
import { UtmBuilderClient }    from '@/components/dashboard/utm/UtmBuilderClient'

export const metadata = { title: 'Generador UTM — Diana Cortés' }

export default async function UtmBuilderPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Generador UTM"
        subtitle="Crea URLs con tracking para tus campañas — aprende, configura y genera"
        user={user}
      />
      <UtmBuilderClient user={user} />
    </div>
  )
}
