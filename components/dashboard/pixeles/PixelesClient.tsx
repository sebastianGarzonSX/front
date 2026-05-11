'use client'

import { useState } from 'react'
import { UserProfile } from '@/types'
import { DateRangeSelector }  from '@/components/dashboard/campanas/DateRangeSelector'
import { EventSelector }      from '@/components/dashboard/campanas/EventSelector'
import { LpViewsPanel }       from './LpViewsPanel'
import { PixelEventsPanel }   from './PixelEventsPanel'
import { useClaseReport }     from '@/hooks/useClaseReport'
import { useEventTags }       from '@/hooks/useEventTags'
import { usePixelEvents }     from '@/hooks/usePixelEvents'

function today()            { return new Date().toISOString().slice(0, 10) }
function daysAgo(n: number) { return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10) }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[9px] font-[var(--font-mono)] tracking-[0.18em] uppercase text-[var(--color-ink-3)]">
      {children}
    </p>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
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

export function PixelesClient({ user: _user }: { user: UserProfile }) {
  const [since, setSince]             = useState(() => daysAgo(30))
  const [until, setUntil]             = useState(() => today())
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const { tags, isLoading: tagsLoading }          = useEventTags()
  const { report }                                = useClaseReport(selectedTag, since, until)
  const { data: pixelEvents, isLoading: pixelLoading, error: pixelError } =
    usePixelEvents(selectedTag, since, until)

  const claseTags = tags.filter((t) => t.tag.toLowerCase().startsWith('clase'))

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-wrap animate-fade-up">
        <div>
          <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
            Gestión de Píxeles
          </h1>
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
            {selectedTag
              ? `Vista: ${selectedTag}`
              : 'Visitas a landing y eventos del Meta Pixel por clase'}
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

      {/* ── Estado vacío ───────────────────────────────────────────────────── */}
      {!selectedTag && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up stagger-1">
          <p className="text-sm text-[var(--color-ink-2)]">
            Seleccioná una clase para ver el detalle del pixel
          </p>
          <p className="text-xs text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
            Los tags deben tener formato <code>clase DD/mes</code> en GHL
          </p>
        </div>
      )}

      {selectedTag && (
        <>
          {/* 1 ── Visitas a la landing ─────────────────────────────────────── */}
          <section className="animate-fade-up stagger-1">
            <SectionLabel>Tráfico a la landing — flujo 2</SectionLabel>
            <LpViewsPanel
              tag={selectedTag}
              totalLeads={report?.total_leads ?? 0}
            />
          </section>

          {/* 2 ── Eventos del pixel ────────────────────────────────────────── */}
          <section className="animate-fade-up stagger-2">
            <SectionLabel>Eventos del Pixel · gracias-general.html</SectionLabel>
            <Card
              title="Pixel · campañas [CLASE SEM]"
              subtitle="Lead, CompleteRegistration, Contact y custom events disparados desde la página de gracias"
            >
              <PixelEventsPanel
                data={pixelEvents}
                isLoading={pixelLoading}
                error={pixelError}
              />
            </Card>
          </section>
        </>
      )}

    </div>
  )
}
