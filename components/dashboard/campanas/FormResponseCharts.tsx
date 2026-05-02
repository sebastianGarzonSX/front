'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CustomFieldRow } from '@/types'
import { formatNumber } from '@/components/dashboard/KPICard'

interface FormResponseChartsProps {
  rows:      CustomFieldRow[]
  isLoading: boolean
}

const BAR_COLOR = '#C9973A'

// Agrupar por field_name
function groupByField(rows: CustomFieldRow[]): Record<string, CustomFieldRow[]> {
  const map: Record<string, CustomFieldRow[]> = {}
  for (const row of rows) {
    if (!map[row.field_name]) map[row.field_name] = []
    map[row.field_name].push(row)
  }
  return map
}

interface FieldChartProps {
  fieldName: string
  values:    CustomFieldRow[]
}

function FieldChart({ fieldName, values }: FieldChartProps) {
  const data = values
    .slice(0, 8) // máximo 8 opciones por campo
    .map((v) => ({
      name:  v.field_value.length > 28 ? v.field_value.slice(0, 26) + '…' : v.field_value,
      full:  v.field_value,
      count: v.count,
      pct:   v.pct,
    }))

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--color-ink)]">{fieldName}</p>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 28, 80)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 4, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 10, fill: 'var(--color-ink-2)', fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--color-ink)',
            }}
            formatter={(value, _name, item) => [
              `${formatNumber(Number(value ?? 0))} leads (${(item.payload as { pct?: number })?.pct ?? 0}%)`,
              (item.payload as { full?: string })?.full ?? '',
            ]}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={14}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={BAR_COLOR}
                fillOpacity={1 - (i / data.length) * 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FormResponseCharts({ rows, isLoading }: FormResponseChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => <div key={i} className="skeleton h-40 rounded-[var(--radius-md)]" />)}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-[var(--color-ink-3)]">Sin respuestas de formulario</p>
        <p className="text-[10px] text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
          Asegurate de sincronizar los custom fields de GHL
        </p>
      </div>
    )
  }

  const grouped = groupByField(rows)
  const fields  = Object.entries(grouped)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {fields.map(([fieldName, values]) => (
        <FieldChart key={fieldName} fieldName={fieldName} values={values} />
      ))}
    </div>
  )
}
