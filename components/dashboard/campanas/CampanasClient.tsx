'use client'

import { useState } from 'react'
import { DateRangeSelector }   from './DateRangeSelector'
import { MetaSummaryBar }      from './MetaSummaryBar'
import { PipelineFunnel }      from './PipelineFunnel'
import { FinancialKPIStrip }   from './FinancialKPIStrip'
import { CampaignRanking }     from './CampaignRanking'
import { EfficiencyMatrix }    from './EfficiencyMatrix'
import { TagsDistribution }    from './TagsDistribution'
import { useAttributionReport } from '@/hooks/useAttributionReport'
import { ROLE_PERMISSIONS, UserProfile } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────

function today()      { return new Date().toISOString().slice(0, 10) }
function daysAgo(n: number) { return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10) }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[9px] font-[var(--font-mono)] tracking-[0.18em] uppercase text-[var(--color-ink-3)]">
      {children}
    </p>
  )
}

interface CardProps {
  title:      string
  subtitle?:  string
  children:   React.ReactNode
  className?: string
  action?:    React.ReactNode
}

function Card({ title, subtitle, children, className = '', action }: CardProps) {
  return (
    <div className={`
      bg-[var(--color-surface)] border border-[var(--color-border)]
      rounded-[var(--radius-md)] overflow-hidden ${className}
    `}>
      <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between gap-4">
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

// ─────────────────────────────────────────────────────────────────────────────

export function CampanasClient({ user }: { user: UserProfile }) {
  const [since, setSince] = useState(() => daysAgo(30))
  const [until, setUntil] = useState(() => today())

  const { data, isLoading, error } = useAttributionReport(since, until)

  const permissions       = ROLE_PERMISSIONS[user.role]
  const canViewFinancials = permissions.canViewFinancials

  // Meta activo si hay gasto o impresiones en el período
  const metaEnabled = (data?.meta_totals?.total_spend       ?? 0) > 0 ||
                      (data?.meta_totals?.total_impressions  ?? 0) > 0

  const adCount        = data?.by_ad?.length         ?? 0
  const pipelineCount  = new Set(data?.by_pipeline?.map((r) => r.pipeline_id) ?? []).size

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* ── Cabecera: selector de período ───────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-up">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
            Campañas & Atribución
          </h1>
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
            {adCount > 0 ? `${adCount} fuentes detectadas · ${pipelineCount} pipelines` : 'Cargando datos…'}
          </p>
        </div>
        <DateRangeSelector
          since={since}
          until={until}
          onChange={(s, u) => { setSince(s); setUntil(u) }}
        />
      </div>

      {/* ── Financial KPI Strip ─────────────────────────────────────────── */}
      <section className="animate-fade-up stagger-1">
        <SectionLabel>Métricas financieras — período seleccionado</SectionLabel>
        <FinancialKPIStrip
          data={data ?? null}
          isLoading={isLoading}
          canViewFinancials={canViewFinancials}
        />
      </section>

      {/* ── Meta Ads summary ────────────────────────────────────────────── */}
      <section className="animate-fade-up stagger-2">
        <SectionLabel>Meta Ads — inversión del período</SectionLabel>
        <MetaSummaryBar
          data={data?.meta_totals ?? null}
          isLoading={isLoading}
          metaEnabled={metaEnabled || isLoading}
        />
      </section>

      {/* ── Main row: Ranking + Funnel ──────────────────────────────────── */}
      {error ? (
        <div className="flex items-center justify-center py-16 text-sm text-[var(--color-red)] animate-fade-up stagger-3">
          Error al cargar el informe: {error}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 xl:grid-cols-5 gap-4 animate-fade-up stagger-3">
            {/* Campaign Ranking — 3/5 columns */}
            <Card
              title="Ranking de anuncios y fuentes"
              subtitle={`ordenado por columna · ${since} → ${until}`}
              className="xl:col-span-3"
            >
              <CampaignRanking
                rows={data?.by_ad ?? []}
                isLoading={isLoading}
                canViewFinancials={canViewFinancials}
                metaEnabled={metaEnabled}
              />
            </Card>

            {/* Pipeline Funnel — 2/5 columns */}
            <Card
              title="Funnel de conversión"
              subtitle={pipelineCount > 1 ? `${pipelineCount} pipelines · selecciona pestaña` : 'por etapa del pipeline'}
              className="xl:col-span-2"
            >
              <PipelineFunnel
                byPipeline={data?.by_pipeline ?? []}
                isLoading={isLoading}
                canViewFinancials={canViewFinancials}
              />
            </Card>
          </section>

          {/* ── Second row: Efficiency Matrix + Tags ────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-up stagger-4">
            <Card
              title={metaEnabled && canViewFinancials ? 'Cuadrante de eficiencia' : 'Distribución de fuentes'}
              subtitle={
                metaEnabled && canViewFinancials
                  ? 'Conv Rate vs Costo/Lead · tamaño = volumen'
                  : 'participación de cada origen de lead'
              }
              className="lg:col-span-3"
            >
              <EfficiencyMatrix
                rows={data?.by_ad ?? []}
                isLoading={isLoading}
                canViewFinancials={canViewFinancials}
                metaEnabled={metaEnabled}
              />
            </Card>

            <Card
              title="Leads por evento / tag"
              subtitle="Top 20 etiquetas del período"
              className="lg:col-span-2"
            >
              <TagsDistribution
                tags={data?.by_tag ?? []}
                isLoading={isLoading}
              />
            </Card>
          </section>
        </>
      )}

    </div>
  )
}
