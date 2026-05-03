'use client'

import { useState } from 'react'
import { Settings, RefreshCw, Calendar, X, Check, AlertCircle } from 'lucide-react'
import { useCalendarSync } from '@/hooks/useCalendarSync'
import { formatNumber } from '@/components/dashboard/KPICard'

interface CalendarSyncPanelProps {
  sync: ReturnType<typeof useCalendarSync>
}

export function CalendarSyncPanel({ sync: hookState }: CalendarSyncPanelProps) {
  const [showConfig, setShowConfig] = useState(false)
  const [inputId, setInputId]       = useState('')

  const {
    calendarId,
    appointments,
    isLoadingConfig,
    isSyncing,
    isSaving,
    error,
    sync,
    saveCalendarId,
  } = hookState

  const handleSave = async () => {
    if (!inputId.trim()) return
    await saveCalendarId(inputId.trim())
    setShowConfig(false)
    setInputId('')
  }

  const openConfig = () => {
    setInputId(calendarId ?? '')
    setShowConfig(true)
  }

  return (
    <div className="space-y-3">

      {/* ── Encabezado con controles ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
          Agendamientos (calendario GHL)
        </p>
        <div className="flex items-center gap-1.5">
          {/* Botón sincronizar */}
          <button
            onClick={sync}
            disabled={isSyncing || isLoadingConfig || !calendarId}
            title={!calendarId ? 'Configurá el calendario primero' : 'Sincronizar ahora'}
            className="
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)]
              text-[10px] font-medium font-[var(--font-mono)]
              bg-[var(--color-surface-2)] text-[var(--color-ink-2)]
              border border-[var(--color-border)]
              hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <RefreshCw
              size={11}
              className={isSyncing ? 'animate-spin' : ''}
            />
            {isSyncing ? 'Sincronizando…' : 'Sincronizar'}
          </button>

          {/* Botón configurar */}
          <button
            onClick={openConfig}
            title="Configurar ID del calendario"
            className="
              p-1.5 rounded-[var(--radius-sm)]
              bg-[var(--color-surface-2)] text-[var(--color-ink-3)]
              border border-[var(--color-border)]
              hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]
              transition-colors
            "
          >
            <Settings size={12} />
          </button>
        </div>
      </div>

      {/* ── Panel de configuración ─────────────────────────────────────── */}
      {showConfig && (
        <div className="
          p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]
          bg-[var(--color-surface-2)] space-y-2
        ">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-[var(--color-ink-2)]">
              ID del calendario en GHL
            </p>
            <button onClick={() => setShowConfig(false)} className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">
              <X size={12} />
            </button>
          </div>
          <p className="text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)]">
            Lo encontrás en GHL → Calendarios → seleccioná el calendario → Configuración → URL o ID
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="ej. abc123def456..."
              className="
                flex-1 px-3 py-1.5 rounded-[var(--radius-sm)]
                text-xs font-[var(--font-mono)] text-[var(--color-ink)]
                bg-[var(--color-surface)] border border-[var(--color-border)]
                focus:outline-none focus:border-[var(--color-gold)]
                placeholder:text-[var(--color-ink-3)]
              "
            />
            <button
              onClick={handleSave}
              disabled={isSaving || !inputId.trim()}
              className="
                flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)]
                text-[10px] font-medium
                bg-[var(--color-gold)] text-black
                disabled:opacity-40 disabled:cursor-not-allowed
                hover:opacity-90 transition-opacity
              "
            >
              {isSaving ? <RefreshCw size={10} className="animate-spin" /> : <Check size={10} />}
              Guardar
            </button>
          </div>
          {calendarId && (
            <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
              Actual: <span className="text-[var(--color-gold)] truncate">{calendarId}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--color-red-dim)] border border-[var(--color-red)]">
          <AlertCircle size={12} className="text-[var(--color-red)] flex-shrink-0" />
          <p className="text-[10px] text-[var(--color-red)] font-[var(--font-mono)]">{error}</p>
        </div>
      )}

      {/* ── Resultado ─────────────────────────────────────────────────── */}
      {!calendarId && !isLoadingConfig && !showConfig && (
        <div className="
          flex items-center gap-2 px-3 py-3 rounded-[var(--radius-md)]
          border border-dashed border-[var(--color-border)]
          text-[var(--color-ink-3)]
        ">
          <Calendar size={14} className="flex-shrink-0" />
          <p className="text-[10px] font-[var(--font-mono)]">
            Configurá el ID del calendario para sincronizar agendamientos
          </p>
        </div>
      )}

      {calendarId && !appointments && !isSyncing && (
        <div className="
          flex items-center gap-2 px-3 py-3 rounded-[var(--radius-md)]
          border border-dashed border-[var(--color-border)]
          text-[var(--color-ink-3)]
        ">
          <RefreshCw size={13} className="flex-shrink-0" />
          <p className="text-[10px] font-[var(--font-mono)]">
            Presioná <span className="text-[var(--color-ink-2)]">Sincronizar</span> para cargar los agendamientos del período
          </p>
        </div>
      )}

      {appointments && (
        <div className="grid grid-cols-3 gap-2">
          <div className="
            p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]
            bg-[var(--color-surface)]
          ">
            <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-1">
              Agendados
            </p>
            <p className="text-xl font-semibold font-[var(--font-display)] text-[var(--color-gold)] tabular-nums">
              {appointments.count !== null ? formatNumber(appointments.count) : '—'}
            </p>
            <p className="text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)] mt-0.5">
              sin cancelados
            </p>
          </div>

          <div className="
            p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]
            bg-[var(--color-surface)]
          ">
            <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-1">
              Total
            </p>
            <p className="text-xl font-semibold font-[var(--font-display)] text-[var(--color-ink)] tabular-nums">
              {formatNumber(appointments.total)}
            </p>
            <p className="text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)] mt-0.5">
              con cancelados
            </p>
          </div>

          <div className="
            p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]
            bg-[var(--color-surface)]
          ">
            <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-1">
              Cancelados
            </p>
            <p className={`text-xl font-semibold font-[var(--font-display)] tabular-nums ${appointments.cancelled > 0 ? 'text-[var(--color-red)]' : 'text-[var(--color-ink-3)]'}`}>
              {formatNumber(appointments.cancelled)}
            </p>
            <p className="text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)] mt-0.5">
              en el período
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
