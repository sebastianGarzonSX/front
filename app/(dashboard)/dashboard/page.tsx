import { getAuthenticatedUser } from '@/lib/auth'
import { Header } from '@/components/dashboard/Header'
import { KPIsGrid } from '@/components/dashboard/KPIsGrid'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { PipelineFunnel } from '@/components/dashboard/PipelineFunnel'
import { SourcesChart } from '@/components/dashboard/SourcesChart'

export const metadata = {
  title: 'Dashboard — Diana Cortés',
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle={`Hola, ${user.name} — aquí está el resumen de hoy.`}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs */}
        <section className="animate-fade-up">
          <SectionLabel>Métricas clave</SectionLabel>
          <KPIsGrid user={user} />
        </section>

        {/* Segunda fila: pipeline + fuentes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-2">
          <Card title="Pipeline activo" subtitle="Oportunidades abiertas por etapa">
            <PipelineFunnel user={user} />
          </Card>

          <Card title="Fuente de leads" subtitle="Distribución por canal de origen">
            <SourcesChart />
          </Card>
        </section>

        {/* Tabla de leads */}
        <section className="animate-fade-up stagger-3">
          <SectionLabel>Leads recientes</SectionLabel>
          <LeadsTable />
        </section>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-[var(--font-mono)] tracking-[0.15em] uppercase text-[var(--color-ink-3)]">
      {children}
    </p>
  )
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-5">
      <div className="mb-4">
        <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
        {subtitle && (
          <p className="text-xs text-[var(--color-ink-3)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  )
}
