'use client'

import { useState } from 'react'
import { UserProfile, CityKey, PipelineType, ROLE_PERMISSIONS } from '@/types'
import { CityFilter }          from './CityFilter'
import { FunnelByCity, PipelineTypeToggle } from './FunnelByCity'
import { TrafficComparison }   from './TrafficComparison'
import { InteractionSplit }    from './InteractionSplit'
import { SurveyBreakdown }     from './SurveyBreakdown'
import { AdPreviewGrid }       from './AdPreviewCard'
import { DateRangeSelector }   from '@/components/dashboard/campanas/DateRangeSelector'
import { useFunnelByCity }     from '@/hooks/useFunnelByCity'
import { useTrafficKPIs }      from '@/hooks/useTrafficKPIs'
import { useAdsPreview }       from '@/hooks/useAdsPreview'
import { useSurveyBreakdown }  from '@/hooks/useSurveyBreakdown'

function today()            { return new Date().toISOString().slice(0, 10) }
function daysAgo(n: number) { return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10) }

interface CardProps {
  title:     string
  subtitle?: string
  children:  React.ReactNode
  className?: string
  action?:   React.ReactNode
}

function Card({ title, subtitle, children, className = '', action }: CardProps) {
  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden ${className}`}>
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-[var(--color-ink-3)] mt-0.5 font-[var(--font-mono)]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[9px] font-[var(--font-mono)] tracking-[0.18em] uppercase text-[var(--color-ink-3)]">
      {children}
    </p>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface EmbudoClientProps {
  user: UserProfile
}

export function EmbudoClient({ user }: EmbudoClientProps) {
  const [since, setSince]               = useState(() => daysAgo(30))
  const [until, setUntil]               = useState(() => today())
  const [city, setCity]                 = useState<CityKey | null>(null)
  const [pipelineType, setPipelineType] = useState<PipelineType>('registro')

  const canViewFinancials = ROLE_PERMISSIONS[user.role].canViewFinancials

  const { data: funnelData, isLoading: funnelLoading }     = useFunnelByCity(city, since, until, pipelineType)
  const { data: trafficData, isLoading: trafficLoading }   = useTrafficKPIs(since, until, city)
  const { data: adsData, isLoading: adsLoading }           = useAdsPreview(since, until)
  const { data: surveyData, isLoading: surveyLoading }     = useSurveyBreakdown(since, until, city)

  // CRM stats vienen en el attribution report existente — usamos el funnel para interacción
  const crmStats = funnelData
    ? {
        total_leads:         funnelData.total_leads,
        with_interaction:    funnelData.stages.find((s) => s.stage_key !== 'cold')?.count ?? 0,
        without_interaction: funnelData.stages.find((s) => s.stage_key === 'cold')?.count ?? 0,
      }
    : null

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between flex-wrap animate-fade-up">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
            Embudo por Ciudad
          </h1>
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
            {city
              ? `Vista filtrada: ${city.charAt(0).toUpperCase() + city.slice(1)}`
              : 'Todas las ciudades — seleccioná una para desglosar'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DateRangeSelector
            since={since}
            until={until}
            onChange={(s, u) => { setSince(s); setUntil(u) }}
          />
        </div>
      </div>

      {/* ── Filtros de ciudad ───────────────────────────────────────────────── */}
      <section className="animate-fade-up stagger-1">
        <CityFilter selected={city} onChange={setCity} />
      </section>

      {/* ── Tráfico Meta vs CRM ─────────────────────────────────────────────── */}
      <section className="animate-fade-up stagger-2">
        <SectionLabel>Tráfico — Meta Ads vs CRM{city ? ` · ${city}` : ''}</SectionLabel>
        <TrafficComparison
          data={trafficData}
          isLoading={trafficLoading}
          canViewFinancials={canViewFinancials}
        />
      </section>

      {/* ── Embudo ─────────────────────────────────────────────────────────── */}
      <section className="animate-fade-up stagger-3">
        <SectionLabel>
          Embudo de conversión — {pipelineType === 'registro' ? 'Registro' : 'Venta'}
          {city ? ` · ${city}` : ''}
        </SectionLabel>
        <Card
          title="Pipeline por etapa"
          subtitle="Número de leads · % del total · Costo por etapa"
          action={
            <PipelineTypeToggle
              value={pipelineType}
              onChange={setPipelineType}
            />
          }
        >
          <FunnelByCity
            data={funnelData}
            isLoading={funnelLoading}
            canViewFinancials={canViewFinancials}
          />
        </Card>
      </section>

      {/* ── Interacción + Muestreo ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-4">
        <Card
          title="Segmentación de leads"
          subtitle="Con y sin interacción"
        >
          <InteractionSplit
            stats={crmStats}
            isLoading={funnelLoading}
          />
        </Card>

        <Card
          title="Primera pregunta — Muestreo"
          subtitle="Distribución de respuestas al Lead Magnet"
        >
          <SurveyBreakdown
            data={surveyData}
            isLoading={surveyLoading}
          />
        </Card>
      </section>

      {/* ── Creativos ──────────────────────────────────────────────────────── */}
      <section className="animate-fade-up stagger-5">
        <SectionLabel>Creativos activos — Vista ampliada</SectionLabel>
        <AdPreviewGrid
          ads={adsData?.ads ?? []}
          isLoading={adsLoading}
          canViewFinancials={canViewFinancials}
        />
      </section>

    </div>
  )
}
