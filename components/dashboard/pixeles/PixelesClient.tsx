'use client'

import { useState } from 'react'
import { Cpu } from 'lucide-react'
import { UserProfile } from '@/types'
import { DateRangeSelector }  from '@/components/dashboard/campanas/DateRangeSelector'
import { EventSelector }      from '@/components/dashboard/campanas/EventSelector'
import { LpViewsPanel }       from './LpViewsPanel'
import { PixelEventsPanel }   from './PixelEventsPanel'
import { PixelStatsPanel }    from './PixelStatsPanel'
import { useClaseReport }     from '@/hooks/useClaseReport'
import { useEventTags }       from '@/hooks/useEventTags'
import { useMetaPixels }      from '@/hooks/useMetaPixels'
import { usePixelEvents }     from '@/hooks/usePixelEvents'
import { usePixelStats }      from '@/hooks/usePixelStats'

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
  const [since, setSince]               = useState(() => daysAgo(30))
  const [until, setUntil]               = useState(() => today())
  const [selectedTag, setSelectedTag]   = useState<string | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  const { tags, isLoading: tagsLoading }                               = useEventTags()
  const { pixels, isLoading: pixelsLoading, error: pixelsError }       = useMetaPixels()
  const { report }                                                     = useClaseReport(selectedTag, since, until)
  const { data: pixelEvents, isLoading: pixelLoading, error: pixelError } =
    usePixelEvents(selectedTag, since, until, selectedAccountId)

  // El pixel ID para consultar stats directamente (solo cuando hay uno seleccionado)
  const selectedPixel  = pixels.find((p) => p.account_id === selectedAccountId) ?? null
  const activePixelId  = selectedPixel?.id ?? null

  const { stats: pixelStats, isLoading: statsLoading, error: statsError } =
    usePixelStats(activePixelId, since, until)

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
            {selectedPixel
              ? `${selectedPixel.name} · ${selectedPixel.account_label}`
              : 'Seleccioná un pixel para ver sus totales reales'}
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

      {/* ── Selector de Pixel ──────────────────────────────────────────────── */}
      <section className="animate-fade-up stagger-1">
        <SectionLabel>Pixel de Meta</SectionLabel>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-4">
          {pixelsLoading ? (
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton h-10 w-44 rounded-[var(--radius-sm)]" />)}
            </div>
          ) : pixelsError ? (
            <p className="text-xs text-[var(--color-red)] font-[var(--font-mono)]">
              Error al cargar pixels: {pixelsError}
            </p>
          ) : pixels.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-3)] font-[var(--font-mono)]">
              No hay píxeles asociados a las cuentas configuradas
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* Todos */}
              <button
                onClick={() => setSelectedAccountId(null)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)]
                  text-xs font-[var(--font-mono)] border transition-colors duration-150
                  ${!selectedAccountId
                    ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)] border-[var(--color-gold-dim)]'
                    : 'border-[var(--color-border)] text-[var(--color-ink-2)] hover:border-[var(--color-ink-3)] hover:text-[var(--color-ink)]'}
                `}
              >
                <Cpu size={11} />
                Todos
              </button>

              {/* Un botón por pixel */}
              {pixels.map((pixel) => (
                <button
                  key={pixel.id}
                  onClick={() => setSelectedAccountId(pixel.account_id)}
                  className={`
                    flex flex-col items-start px-3 py-2 rounded-[var(--radius-sm)]
                    text-xs font-[var(--font-mono)] border transition-colors duration-150 text-left
                    ${selectedAccountId === pixel.account_id
                      ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)] border-[var(--color-gold-dim)]'
                      : 'border-[var(--color-border)] text-[var(--color-ink-2)] hover:border-[var(--color-ink-3)] hover:text-[var(--color-ink)]'}
                  `}
                >
                  <span className="font-semibold leading-none">{pixel.name}</span>
                  <span className={`
                    text-[9px] tracking-widest uppercase mt-0.5
                    ${selectedAccountId === pixel.account_id ? 'text-[var(--color-gold-dim)]' : 'text-[var(--color-ink-3)]'}
                  `}>
                    {pixel.account_label} · {pixel.id}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Totales del Pixel (fuente: Stats API = mismos números que Ads Manager) */}
      <section className="animate-fade-up stagger-2">
        <SectionLabel>
          Totales del pixel — todas las campañas
          {selectedPixel ? ` · ${selectedPixel.name}` : ''}
        </SectionLabel>
        {!selectedPixel ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] border-dashed rounded-[var(--radius-md)] px-5 py-8 text-center">
            <p className="text-xs text-[var(--color-ink-3)]">
              Seleccioná un pixel arriba para ver sus totales reales
            </p>
            <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-1">
              Estos números coinciden con "Eventos totales" en Meta Ads Manager
            </p>
          </div>
        ) : (
          <Card
            title={`Pixel · ${selectedPixel.name}`}
            subtitle={`ID ${selectedPixel.id} · ${selectedPixel.account_label} · incluye todas las campañas y canales`}
          >
            <PixelStatsPanel
              stats={pixelStats}
              isLoading={statsLoading}
              error={statsError}
              pixelName={selectedPixel.name}
              since={since}
              until={until}
            />
          </Card>
        )}
      </section>

      {/* ── Separador ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-[var(--color-border)]" />

      {/* ── Detalle por clase ──────────────────────────────────────────────── */}
      <section className="animate-fade-up stagger-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-wrap mb-4">
          <div>
            <p className="text-[9px] font-[var(--font-mono)] tracking-[0.18em] uppercase text-[var(--color-ink-3)]">
              Detalle por clase · campañas [CLASE SEM]
            </p>
            <p className="text-[10px] text-[var(--color-ink-3)] mt-0.5 font-[var(--font-mono)]">
              {selectedTag ? `Vista: ${selectedTag}` : 'Seleccioná una clase para ver el detalle de atribución'}
            </p>
          </div>
          <EventSelector
            tags={claseTags}
            selected={selectedTag}
            onChange={setSelectedTag}
            isLoading={tagsLoading}
          />
        </div>

        {!selectedTag ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-[var(--color-ink-2)]">
              Seleccioná una clase para ver el detalle de atribución
            </p>
            <p className="text-xs text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
              Los tags deben tener formato <code>clase DD/mes</code> en GHL
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visitas LP */}
            <div>
              <SectionLabel>Tráfico a la landing — flujo 2</SectionLabel>
              <LpViewsPanel
                tag={selectedTag}
                totalLeads={report?.total_leads ?? 0}
              />
            </div>

            {/* Pixel events CLASE SEM */}
            <div>
              <SectionLabel>Eventos del Pixel · campañas [CLASE SEM] · gracias-general.html</SectionLabel>
              <Card
                title={selectedPixel ? `Pixel · ${selectedPixel.name} · CLASE SEM` : 'Pixel · todas las cuentas · CLASE SEM'}
                subtitle={
                  selectedPixel
                    ? `${selectedPixel.account_label} · ID ${selectedPixel.id} · solo campañas que contienen "CLASE SEM"`
                    : 'Lead, CompleteRegistration, Contact y eventos custom atribuidos a campañas "CLASE SEM"'
                }
              >
                <PixelEventsPanel
                  data={pixelEvents}
                  isLoading={pixelLoading}
                  error={pixelError}
                />
              </Card>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
