'use client'

import { AttributionByAd } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface EfficiencyMatrixProps {
  rows:              AttributionByAd[]
  isLoading:         boolean
  canViewFinancials: boolean
  metaEnabled:       boolean
}

// ── When Meta is enabled: scatter plot Conv Rate vs CPL ───────────────────────
// X = conv rate (0 → maxConv)  — higher is better
// Y = CPL (0 → maxCpl)         — lower is better (inverted on chart)
// Dot size = total_leads
// Color = ROAS quality

const CHART_W = 320
const CHART_H = 220
const PAD     = { top: 12, right: 16, bottom: 36, left: 42 }
const PLOT_W  = CHART_W - PAD.left - PAD.right
const PLOT_H  = CHART_H - PAD.top  - PAD.bottom

function roasColor(roas: number): string {
  if (roas === 0) return '#5C5650'
  if (roas >= 3)  return '#3DAB6E'
  if (roas >= 1)  return '#C9973A'
  return '#D95F5F'
}

interface ScatterPoint {
  id:        string
  label:     string
  convRate:  number
  cpl:       number
  leads:     number
  roas:      number
  spend:     number
}

function ScatterPlot({ points }: { points: ScatterPoint[] }) {
  if (points.length === 0) return null

  const maxConv = Math.max(...points.map((p) => p.convRate), 1)
  const maxCpl  = Math.max(...points.map((p) => p.cpl), 1)
  const maxLeads = Math.max(...points.map((p) => p.leads), 1)

  const midConv = maxConv / 2
  const midCpl  = maxCpl  / 2

  function toX(conv: number) { return PAD.left + (conv / maxConv) * PLOT_W }
  function toY(cpl:  number) { return PAD.top  + (cpl  / maxCpl)  * PLOT_H }  // inverted: lower CPL = lower Y = better (top)

  function dotR(leads: number) { return 3 + (leads / maxLeads) * 9 }

  const quadX = toX(midConv)
  const quadY = toY(midCpl)

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {/* Quadrant backgrounds */}
      {/* Top-left: Alto costo, alta conversión → "Caro efectivo" */}
      <rect x={PAD.left}  y={PAD.top}   width={quadX - PAD.left}          height={quadY - PAD.top}             fill="#C9973A" fillOpacity="0.04" />
      {/* Top-right: Bajo costo, alta conversión → "Estrella" */}
      <rect x={quadX}     y={PAD.top}   width={PAD.left + PLOT_W - quadX}  height={quadY - PAD.top}             fill="#3DAB6E" fillOpacity="0.06" />
      {/* Bottom-left: Alto costo, baja conversión → "Revisar" */}
      <rect x={PAD.left}  y={quadY}     width={quadX - PAD.left}           height={PAD.top + PLOT_H - quadY}   fill="#D95F5F" fillOpacity="0.04" />
      {/* Bottom-right: Bajo costo, baja conversión → "Por desarrollar" */}
      <rect x={quadX}     y={quadY}     width={PAD.left + PLOT_W - quadX}  height={PAD.top + PLOT_H - quadY}   fill="#5C5650" fillOpacity="0.05" />

      {/* Quadrant dividers */}
      <line x1={quadX}       y1={PAD.top}  x2={quadX}       y2={PAD.top + PLOT_H} stroke="#2D2D2D" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={PAD.left}    y1={quadY}    x2={PAD.left + PLOT_W} y2={quadY}       stroke="#2D2D2D" strokeWidth={1} strokeDasharray="3 3" />

      {/* Quadrant labels */}
      <text x={PAD.left + 4}   y={PAD.top + 10}            fontSize="7" fill="#C9973A" fillOpacity="0.7" fontFamily="'JetBrains Mono', monospace">CARO EFECTIVO</text>
      <text x={quadX + 4}      y={PAD.top + 10}            fontSize="7" fill="#3DAB6E" fillOpacity="0.8" fontFamily="'JetBrains Mono', monospace">★ ESTRELLA</text>
      <text x={PAD.left + 4}   y={PAD.top + PLOT_H - 4}   fontSize="7" fill="#D95F5F" fillOpacity="0.7" fontFamily="'JetBrains Mono', monospace">REVISAR</text>
      <text x={quadX + 4}      y={PAD.top + PLOT_H - 4}   fontSize="7" fill="#5C5650"                   fontFamily="'JetBrains Mono', monospace">POR DESARROLLAR</text>

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#2D2D2D" strokeWidth={1} />
      <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#2D2D2D" strokeWidth={1} />

      {/* Axis labels */}
      <text x={PAD.left + PLOT_W / 2} y={CHART_H - 4} textAnchor="middle" fontSize="8" fill="#5C5650" fontFamily="'JetBrains Mono', monospace">
        Tasa de conversión →
      </text>
      <text x={8} y={PAD.top + PLOT_H / 2} textAnchor="middle" fontSize="8" fill="#5C5650" fontFamily="'JetBrains Mono', monospace"
        transform={`rotate(-90, 8, ${PAD.top + PLOT_H / 2})`}>
        CPL ↓ mejor
      </text>

      {/* Data points */}
      {points.map((p) => {
        const cx = toX(p.convRate)
        const cy = toY(p.cpl)
        const r  = dotR(p.leads)
        const color = roasColor(p.roas)
        const shortLabel = p.label.length > 14 ? p.label.slice(0, 12) + '…' : p.label

        return (
          <g key={p.id}>
            {/* Glow */}
            <circle cx={cx} cy={cy} r={r + 3} fill={color} fillOpacity="0.1" />
            {/* Dot */}
            <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity="0.7" stroke={color} strokeWidth="0.5" />
            {/* Label */}
            <text
              x={cx + r + 3}
              y={cy + 3}
              fontSize="7"
              fill="#9A9088"
              fontFamily="'JetBrains Mono', monospace"
            >
              {shortLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── When Meta is disabled: Source distribution bars ───────────────────────────

function SourceDistribution({ rows }: { rows: AttributionByAd[] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-[var(--color-ink-3)] text-center py-6">Sin datos de fuente.</p>
  }

  const PALETTE = ['#C9973A', '#3DAB6E', '#5C9FD4', '#8B6EBF', '#D4875C', '#A07820']
  const max = Math.max(...rows.map((r) => r.total_leads), 1)
  const top  = rows.slice(0, 8)

  return (
    <div className="space-y-2.5">
      {top.map((row, i) => {
        const label  = row.attribution_ad_name ?? row.attribution_utm_source ?? row.attribution_ad_id ?? 'Sin atribución'
        const barPct = Math.round((row.total_leads / max) * 100)
        const color  = PALETTE[i % PALETTE.length]
        const pct    = Math.round((row.total_leads / rows.reduce((s, r) => s + r.total_leads, 1)) * 100)
        return (
          <div key={`sd-${row.attribution_ad_id ?? i}`} className="flex items-center gap-2 group">
            <p className="text-[10px] text-[var(--color-ink-2)] w-36 flex-shrink-0 truncate font-[var(--font-mono)] group-hover:text-[var(--color-ink)] transition-colors" title={label}>
              {label}
            </p>
            <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${barPct}%`, background: color }}
              />
            </div>
            <span className="text-[9px] font-[var(--font-mono)] tabular-nums text-[var(--color-ink-2)] w-7 text-right flex-shrink-0">
              {pct}%
            </span>
            <span className="text-[9px] font-[var(--font-mono)] tabular-nums text-[var(--color-ink-3)] w-10 text-right flex-shrink-0">
              {formatNumber(row.total_leads)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function EfficiencyMatrix({ rows, isLoading, canViewFinancials, metaEnabled }: EfficiencyMatrixProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-[200px] w-full rounded" />
      </div>
    )
  }

  if (!metaEnabled || !canViewFinancials) {
    return (
      <div>
        <p className="text-[9px] font-[var(--font-mono)] tracking-[0.12em] uppercase text-[var(--color-ink-3)] mb-3">
          Distribución de fuentes
        </p>
        <SourceDistribution rows={rows} />
        {!metaEnabled && (
          <p className="mt-4 text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)] text-center">
            Activa Meta Ads para ver el cuadrante de eficiencia CPL vs Conversión
          </p>
        )}
      </div>
    )
  }

  // Build scatter points for ads that have Meta spend
  const points: ScatterPoint[] = rows
    .filter((r) => r.meta_spend > 0 || r.total_leads > 0)
    .map((r) => {
      const convRate = r.total_leads > 0 ? (r.conversions / r.total_leads) * 100 : 0
      const cpl      = r.meta_spend > 0 && r.total_leads > 0 ? r.meta_spend / r.total_leads : 0
      const roas     = r.meta_spend > 0 ? r.revenue / r.meta_spend : 0
      return {
        id:       r.attribution_ad_id ?? `src-${r.attribution_utm_source}`,
        label:    r.attribution_ad_name ?? r.attribution_utm_source ?? 'N/A',
        convRate,
        cpl,
        leads:    r.total_leads,
        roas,
        spend:    r.meta_spend,
      }
    })

  if (points.length === 0) {
    return <SourceDistribution rows={rows} />
  }

  // Legend
  const legendItems = [
    { label: '≥3× ROAS', color: '#3DAB6E' },
    { label: '1–3× ROAS', color: '#C9973A' },
    { label: '<1× ROAS',  color: '#D95F5F' },
    { label: 'Sin Meta',  color: '#5C5650' },
  ]

  return (
    <div>
      <ScatterPlot points={points} />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-[8px] font-[var(--font-mono)] text-[var(--color-ink-3)]">{item.label}</span>
          </div>
        ))}
        <span className="text-[8px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
          · tamaño = volumen de leads
        </span>
      </div>
    </div>
  )
}
