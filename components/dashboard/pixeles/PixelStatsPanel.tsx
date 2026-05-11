'use client'

import {
  Eye, UserPlus, FileCheck, Phone, MessageCircle,
  MousePointer, Zap, Search,
} from 'lucide-react'
import { PixelEventStat } from '@/hooks/usePixelStats'
import { formatNumber }   from '@/components/dashboard/KPICard'

interface Props {
  stats:      PixelEventStat[]
  isLoading:  boolean
  error?:     string | null
  pixelName?: string
  since:      string
  until:      string
}

// ── Configuración de eventos conocidos ────────────────────────────────────────

const EVENT_CONFIG: Record<string, { label: string; accent: string; icon: React.ReactNode }> = {
  PageView:             { label: 'PageView',             accent: '#5C9FD4', icon: <Eye size={14} /> },
  Lead:                 { label: 'Lead',                 accent: '#3DAB6E', icon: <UserPlus size={14} /> },
  ViewContent:          { label: 'Ver contenido',        accent: '#7C3AED', icon: <Search size={14} /> },
  CompleteRegistration: { label: 'Completar registro',   accent: '#8B6EBF', icon: <FileCheck size={14} /> },
  Contact:              { label: 'Contactar',            accent: '#C9973A', icon: <Phone size={14} /> },
  WhatsAppGroupClick:   { label: 'WhatsApp Group Click', accent: '#25D366', icon: <MessageCircle size={14} /> },
  CTA_Click:            { label: 'CTA Click',            accent: '#E87040', icon: <MousePointer size={14} /> },
}

function getConfig(name: string) {
  // Exact match first
  if (EVENT_CONFIG[name]) return EVENT_CONFIG[name]
  // Partial match (case-insensitive)
  for (const [key, cfg] of Object.entries(EVENT_CONFIG)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return cfg
    }
  }
  return { label: name, accent: 'var(--color-ink-3)', icon: <Zap size={14} /> }
}

// ── Componente ────────────────────────────────────────────────────────────────

export function PixelStatsPanel({ stats, isLoading, error, pixelName, since, until }: Props) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-20 rounded-[var(--radius-md)]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[var(--color-red)]">No se pudieron cargar los totales del pixel</p>
        <p className="text-[10px] text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">{error}</p>
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[var(--color-ink-3)]">Sin eventos en el rango seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {stats.map((s) => {
          const { label, accent, icon } = getConfig(s.event_name)
          return (
            <div
              key={s.event_name}
              className="relative p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
              style={{ borderTopColor: accent, borderTopWidth: 2 }}
            >
              <div className="flex items-center gap-1.5 mb-1.5" style={{ color: accent }}>
                {icon}
                <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest truncate">
                  {label}
                </p>
              </div>
              <p className="text-2xl font-semibold font-[var(--font-display)] tabular-nums leading-none text-[var(--color-ink)]">
                {formatNumber(s.count)}
              </p>
              {s.unique_count != null && s.unique_count > 0 && (
                <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
                  {formatNumber(s.unique_count)} únicos
                </p>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
        Fuente: Meta Pixel Stats API · {pixelName ?? 'pixel'} · todas las campañas y canales · {since} → {until}
      </p>
    </div>
  )
}
