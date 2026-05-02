'use client'

import { useState } from 'react'
import { UserProfile } from '@/types'
import { DateRangeSelector }        from './DateRangeSelector'
import { EventSelector }            from './EventSelector'
import { WeeklySummaryTable }       from './WeeklySummaryTable'
import { MetaVsGHL }                from './MetaVsGHL'
import { ConversionFunnelLinear }   from './ConversionFunnelLinear'
import { LeadMagnetPie }            from './LeadMagnetPie'
import { FormResponseCharts }       from './FormResponseCharts'
import { SessionsPurchases }        from './SessionsPurchases'
import { useClaseReport }           from '@/hooks/useClaseReport'
import { useClasesSummary }         from '@/hooks/useClasesSummary'
import { useEventTags }             from '@/hooks/useEventTags'

function today()            { return new Date().toISOString().slice(0, 10) }
function daysAgo(n: number) { return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10) }

interface CardProps {
  title:     string
  subtitle?: string
  children:  React.ReactNode
  className?: string
}
function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden ${className}`}>
      <div className="px-5 py-3.5 border-b border-[var(--color-border)]">
        <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-[var(--color-ink-3)] mt-0.5 font-[var(--font-mono)]">{subtitle}</p>
        )}
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

export function ClaseEnVivoClient({ user: _user }: { user: UserProfile }) {
  const [since, setSince]         = useState(() => daysAgo(30))
  const [until, setUntil]         = useState(() => today())
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const { tags, isLoading: tagsLoading }            = useEventTags()
  const { rows: summary, isLoading: summaryLoading } = useClasesSummary()
  const { report, meta, isLoading, error }           = useClaseReport(selectedTag, since, until)

  // Tomar la campaña con mayor gasto para Meta vs GHL
  const mainCampaign = meta?.campaigns?.[0] ?? null

  // Solo etiquetas que empiezan con 'clase '
  const claseTags = tags.filter((t) => t.tag.startsWith('clase '))

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-wrap animate-fade-up">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
            Clase en Vivo
          </h1>
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
            {selectedTag
              ? `Vista: ${selectedTag}`
              : 'Seleccioná una clase para ver el detalle'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EventSelector
            tags={claseTags}
            selected={selectedTag}
            onChange={setSelectedTag}
            isLoading={tagsLoading}
          />
          <DateRangeSelector
            since={since}
            until={until}
            onChange={(s, u) => { setSince(s); setUntil(u) }}
          />
        </div>
      </div>

      {/* ── Tabla resumen multi-semana ──────────────────────────────────────── */}
      <section className="animate-fade-up stagger-1">
        <SectionLabel>Resumen por clase — todas las semanas</SectionLabel>
        <Card title="Comparativo semanal" subtitle="clic en una fila para ver el detalle">
          <WeeklySummaryTable
            rows={summary}
            isLoading={summaryLoading}
            selectedTag={selectedTag}
            onSelect={setSelectedTag}
          />
        </Card>
      </section>

      {/* ── Detalle de la clase seleccionada ───────────────────────────────── */}
      {error && (
        <div className="py-6 text-center text-sm text-[var(--color-red)] animate-fade-up">
          Error al cargar: {error}
        </div>
      )}

      {(selectedTag || isLoading) && (
        <>
          {/* ── Meta vs GHL ──────────────────────────────────────────────── */}
          <section className="animate-fade-up stagger-2">
            <SectionLabel>
              Meta Ads vs CRM — {selectedTag ?? '…'}
            </SectionLabel>
            <MetaVsGHL
              report={report}
              meta={mainCampaign}
              isLoading={isLoading}
            />
          </section>

          {/* ── Funnel ───────────────────────────────────────────────────── */}
          <section className="animate-fade-up stagger-3">
            <SectionLabel>Funnel de conversión — con costo por etapa</SectionLabel>
            <Card
              title="Embudo completo"
              subtitle="Leads → Lead magnet → Sesión → Compra"
            >
              <ConversionFunnelLinear
                report={report}
                meta={mainCampaign}
                isLoading={isLoading}
              />
            </Card>
          </section>

          {/* ── Lead Magnet + Sesiones ───────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-4">
            <Card
              title="Lead Magnet"
              subtitle="distribución por opción elegida (tags lm_*)"
            >
              <LeadMagnetPie
                items={report?.lm_dist ?? []}
                isLoading={isLoading}
              />
            </Card>

            <Card
              title="Sesiones y compras"
              subtitle="conversiones post-clase"
            >
              <SessionsPurchases
                report={report}
                meta={mainCampaign}
                isLoading={isLoading}
              />
            </Card>
          </section>

          {/* ── Respuestas del formulario ────────────────────────────────── */}
          <section className="animate-fade-up stagger-4">
            <SectionLabel>Respuestas del formulario post-clase (custom fields)</SectionLabel>
            <Card
              title="Distribución de respuestas"
              subtitle="agrupado por pregunta · ordenado por frecuencia"
            >
              <FormResponseCharts
                rows={report?.custom_fields ?? []}
                isLoading={isLoading}
              />
            </Card>
          </section>
        </>
      )}

      {/* Estado vacío — sin clase seleccionada */}
      {!selectedTag && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up stagger-2">
          <p className="text-sm text-[var(--color-ink-2)]">
            Seleccioná una clase en la tabla o en el selector de arriba
          </p>
          <p className="text-xs text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
            Los tags deben tener formato <code>clase DD/mes</code> en GHL
          </p>
        </div>
      )}

    </div>
  )
}
