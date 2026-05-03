'use client'

import { useMemo, useState } from 'react'
import { AppointmentItem } from '@/types'
import { CalendarDays, User, X } from 'lucide-react'

interface Props {
  items: AppointmentItem[]
  since: string   // YYYY-MM-DD
  until: string
}

const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTH = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dayKey(iso: string): string {
  // Normaliza a YYYY-MM-DD en hora local del navegador
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function AppointmentsTimeline({ items, since, until }: Props) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Agrupar por día
  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentItem[]>()
    for (const it of items) {
      const k = dayKey(it.start_time)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(it)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    }
    return map
  }, [items])

  // Construir grilla de días entre since y until
  const days = useMemo(() => {
    const start = parseYmd(since)
    const end   = parseYmd(until)
    const out: Date[] = []
    const cur = new Date(start)
    while (cur <= end) {
      out.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    return out
  }, [since, until])

  const maxPerDay = useMemo(() => {
    let m = 0
    for (const arr of byDay.values()) m = Math.max(m, arr.length)
    return m
  }, [byDay])

  const visibleItems = selectedDay
    ? (byDay.get(selectedDay) ?? [])
    : items.slice(0, 6)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
          Agendamientos por día
        </p>
        {selectedDay && (
          <button
            onClick={() => setSelectedDay(null)}
            className="flex items-center gap-1 text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] hover:text-[var(--color-gold)]"
          >
            <X size={10} /> limpiar
          </button>
        )}
      </div>

      {/* Mini calendario tipo heatmap horizontal */}
      <div className="flex flex-wrap gap-1">
        {days.map((d) => {
          const k     = ymd(d)
          const count = byDay.get(k)?.length ?? 0
          const intensity = maxPerDay > 0 ? count / maxPerDay : 0
          const isSel  = selectedDay === k
          const dow    = (d.getDay() + 6) % 7  // L=0 ... D=6

          const bg = count === 0
            ? 'transparent'
            : `color-mix(in srgb, var(--color-gold) ${15 + intensity * 70}%, transparent)`

          return (
            <button
              key={k}
              onClick={() => setSelectedDay(isSel ? null : (count > 0 ? k : null))}
              disabled={count === 0}
              title={`${d.getDate()} ${MONTH[d.getMonth()]} · ${count} agendamiento${count === 1 ? '' : 's'}`}
              className={`
                relative flex flex-col items-center justify-center
                w-9 h-11 rounded-[var(--radius-sm)]
                border text-[9px] font-[var(--font-mono)]
                transition-colors
                ${count > 0 ? 'cursor-pointer hover:border-[var(--color-gold)]' : 'cursor-default opacity-50'}
                ${isSel ? 'border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]' : 'border-[var(--color-border)]'}
              `}
              style={{ background: bg }}
            >
              <span className="text-[8px] text-[var(--color-ink-3)] leading-none">{DOW[dow]}</span>
              <span className="text-[11px] text-[var(--color-ink)] leading-none mt-0.5 tabular-nums">{d.getDate()}</span>
              {count > 0 && (
                <span className="absolute bottom-0.5 right-1 text-[8px] font-semibold text-[var(--color-gold)] tabular-nums">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Lista de agendamientos (todos o el día seleccionado) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
            {selectedDay
              ? `Leads agendados — ${parseYmd(selectedDay).getDate()} ${MONTH[parseYmd(selectedDay).getMonth()]}`
              : `Próximos agendamientos (${Math.min(items.length, 6)} de ${items.length})`}
          </p>
        </div>
        <ul className="space-y-1.5">
          {visibleItems.length === 0 && (
            <li className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)] py-2">
              Sin agendamientos en este día.
            </li>
          )}
          {visibleItems.map((it) => {
            const d = new Date(it.start_time)
            return (
              <li
                key={it.id}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)]
                  border border-[var(--color-border)] bg-[var(--color-surface)]
                  ${it.cancelled ? 'opacity-50' : ''}
                `}
              >
                <div className="w-7 h-7 rounded flex flex-col items-center justify-center bg-[var(--color-surface-2)] flex-shrink-0">
                  <CalendarDays size={11} className="text-[var(--color-gold)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <User size={11} className="text-[var(--color-ink-3)] flex-shrink-0" />
                    <p className="text-xs text-[var(--color-ink)] truncate">
                      {it.contact_name || it.contact_email || <span className="text-[var(--color-ink-3)] italic">lead sin sincronizar</span>}
                    </p>
                    {it.cancelled && (
                      <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-red)] border border-[var(--color-red)] px-1 py-px rounded-sm">
                        cancelado
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)] mt-0.5">
                    {d.getDate()} {MONTH[d.getMonth()]} · {formatTime(it.start_time)}
                    {it.contact_email && it.contact_name && ` · ${it.contact_email}`}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
