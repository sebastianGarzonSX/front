'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CustomFieldRow } from '@/types'
import { formatNumber } from '@/components/dashboard/KPICard'

interface Props {
  rows:      CustomFieldRow[]
  isLoading: boolean
}

const PALETTE = [
  '#C9973A', '#7C3AED', '#3B5FC0', '#1F8A7D', '#C0392B',
  '#1E9957', '#C47F1A', '#6B4FAF', '#2E7BBF', '#0E9E6B',
]

const FALENCIA_KEYS = ['falencia', 'principal_falencia', 'cuál es tu principal falencia']

export function isFalencia(name: string): boolean {
  const n = name.toLowerCase().trim()
  return FALENCIA_KEYS.some(k => n.includes(k))
}

export function FalenciaPie({ rows, isLoading }: Props) {
  const data = useMemo(() => {
    const falencias = rows
      .filter(r => isFalencia(r.field_name))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const sampleTotal = falencias.reduce((s, r) => s + r.count, 0)

    return falencias.map((r, i) => ({
      name:  r.field_value,
      value: r.count,
      pct:   sampleTotal > 0 ? (r.count / sampleTotal) * 100 : 0,
      color: PALETTE[i % PALETTE.length],
    }))
  }, [rows])

  if (isLoading) {
    return <div className="skeleton h-56 rounded-[var(--radius-md)]" />
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-[var(--color-ink-3)]">Sin respuestas de "falencia"</p>
        <p className="text-[10px] text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
          Verificá que el custom field <code>contact.falencia</code> esté sincronizado
        </p>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.value, 0)
  const top   = data[0]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      {/* Pie */}
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              stroke="var(--color-surface)"
              strokeWidth={2}
            >
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--color-ink)',
              }}
              formatter={(v, _n, item) => [
                `${formatNumber(Number(v ?? 0))} (${Number((item.payload as { pct?: number })?.pct ?? 0).toFixed(2)}%)`,
                (item.payload as { name?: string })?.name ?? '',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centro: total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
            Respuestas
          </p>
          <p className="text-2xl font-semibold font-[var(--font-display)] text-[var(--color-ink)] tabular-nums">
            {formatNumber(total)}
          </p>
        </div>
      </div>

      {/* Leyenda + insight */}
      <div className="space-y-3">
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
            Falencia más reportada
          </p>
          <p className="text-sm font-medium text-[var(--color-ink)] mt-1">{top.name}</p>
          <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)] mt-0.5">
            {formatNumber(top.value)} de {formatNumber(total)} respuestas · <span style={{ color: top.color }}>{Number(top.pct ?? 0).toFixed(2)}%</span>
          </p>
        </div>

        <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {data.map((d) => (
            <li key={d.name} className="flex items-center gap-2 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
              <span className="text-[var(--color-ink-2)] truncate flex-1" title={d.name}>{d.name}</span>
              <span className="font-[var(--font-mono)] text-[var(--color-ink-3)] tabular-nums">
                {formatNumber(d.value)} · {Number(d.pct ?? 0).toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
