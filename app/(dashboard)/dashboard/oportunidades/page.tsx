import { getAuthenticatedUser } from '@/lib/auth'
import { Header } from '@/components/dashboard/Header'
import { PipelineFunnel } from '@/components/dashboard/PipelineFunnel'

export const metadata = { title: 'Oportunidades — Diana Cortés' }

export default async function OportunidadesPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Oportunidades"
        subtitle="Pipeline y estado de oportunidades en GoHighLevel."
        user={user}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-6">
            <p className="text-sm font-medium text-[var(--color-ink)] mb-1">Pipeline por etapa</p>
            <p className="text-xs text-[var(--color-ink-3)] mb-5">Oportunidades abiertas agrupadas por stage.</p>
            <PipelineFunnel user={user} />
          </div>
        </div>
      </div>
    </div>
  )
}
