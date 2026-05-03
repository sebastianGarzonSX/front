'use client'

import { useState } from 'react'
import { UserProfile } from '@/types'
import { DateRangeSelector }        from './DateRangeSelector'
import { EventSelector }            from './EventSelector'
import { MetaVsGHL }                from './MetaVsGHL'
import { ConversionFunnelLinear }   from './ConversionFunnelLinear'
import { LeadMagnetPie }            from './LeadMagnetPie'
import { FormResponseCharts }       from './FormResponseCharts'
import { SessionsPurchases }        from './SessionsPurchases'
import { LpViewsPanel }             from './LpViewsPanel'
import { FalenciaPie }              from './FalenciaPie'
import { useClaseReport }           from '@/hooks/useClaseReport'
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

  const { tags, isLoading: tagsLoading }  = useEventTags()
  const { report, meta, isLoading, error } = useClaseReport(selectedTag, since, until)

  const mainCampaign = meta?.campaigns?.[0] ?? null

  const claseTags = tags.filter((t) => t.tag.toLowerCase().startsWith('clase'))

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

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="py-6 text-center text-sm text-[var(--color-red)] animate-fade-up">
          Error al cargar: {error}
        </div>
      )}

      {/* ── Estado vacío — sin clase seleccionada ──────────────────────────── */}
      {!selectedTag && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up stagger-1">
          <p className="text-sm text-[var(--color-ink-2)]">
            Seleccioná una clase en el filtro de arriba para ver el detalle
          </p>
          <p className="text-xs text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
            Los tags deben tener formato <code>clase DD/mes</code> en GHL
          </p>
        </div>
      )}

      {/* ── Detalle de la clase seleccionada ───────────────────────────────── */}
      {(selectedTag || isLoading) && (
        <>
          {/* 1 ── Meta vs GHL — inversión y resultados (dato más importante) ── */}
          <section className="animate-fade-up stagger-1">
            <SectionLabel>
              Meta Ads vs CRM — {selectedTag ?? '…'}
            </SectionLabel>
            <MetaVsGHL
              report={report}
              meta={mainCampaign}
              isLoading={isLoading}
            />
          </section>

          {/* 2 ── Visitas a la landing (flujo 2) + Falencia principal ──────── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up stagger-2">
            <div className="lg:col-span-1 space-y-4">
              <SectionLabel>Tráfico a la landing — flujo 2</SectionLabel>
              <LpViewsPanel
                tag={selectedTag}
                totalLeads={report?.total_leads ?? 0}
              />
            </div>

            <div className="lg:col-span-2">
              <SectionLabel>Principal falencia reportada en el formulario</SectionLabel>
              <Card
                title="Falencia"
                subtitle="custom field contact.falencia · qué dolor declara cada lead"
              >
                <FalenciaPie
                  rows={report?.custom_fields ?? []}
                  isLoading={isLoading}
                />
              </Card>
            </div>
          </section>

          {/* 3 ── Funnel — dos flujos: WhatsApp (api) + Landing page ────────── */}
          <section className="animate-fade-up stagger-3">
            <SectionLabel>Embudo de conversión — flujo WhatsApp + landing page</SectionLabel>
            <Card
              title="Funnel completo"
              subtitle="Visitas LP → Leads → etapas CRM → Compra · el stage 'api' = ingreso directo por WhatsApp"
            >
              <ConversionFunnelLinear
                report={report}
                meta={mainCampaign}
                isLoading={isLoading}
              />
            </Card>
          </section>

          {/* 4 ── Sesiones y Lead Magnet ─────────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-4">
            <Card
              title="Sesiones y compras"
              subtitle="conversiones post-clase · agendamientos desde GHL Calendar"
            >
              <SessionsPurchases
                report={report}
                meta={mainCampaign}
                isLoading={isLoading}
                since={since}
                until={until}
              />
            </Card>

            <Card
              title="Lead Magnet"
              subtitle="distribución por opción elegida (tags lm_*)"
            >
              <LeadMagnetPie
                items={report?.lm_dist ?? []}
                isLoading={isLoading}
              />
            </Card>
          </section>

          {/* 5 ── Resto de respuestas del formulario (secundario) ────────────── */}
          <section className="animate-fade-up stagger-5">
            <SectionLabel>Otras respuestas del formulario (custom fields)</SectionLabel>
            <Card
              title="Distribución por pregunta"
              subtitle="agrupado por pregunta · ordenado por frecuencia"
            >
              <FormResponseCharts
                rows={(report?.custom_fields ?? []).filter(
                  r => !r.field_name.toLowerCase().includes('falencia')
                )}
                isLoading={isLoading}
              />
            </Card>
          </section>
        </>
      )}

    </div>
  )
}
