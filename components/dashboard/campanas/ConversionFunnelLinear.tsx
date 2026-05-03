'use client'

import { ClaseReport, MetaCampaignRow } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface ConversionFunnelLinearProps {
  report:    ClaseReport | null
  meta:      MetaCampaignRow | null
  isLoading: boolean
}

const STAGE_COLORS: Record<string, string> = {
  api:                       '#3B5FC0',
  Registro:                  '#7B45C8',
  'Contactado - CTA agenda': '#1F8A7D',
  'Solicito agenda':         '#2E7BBF',
  Agendo:                    '#1A6EA8',
  'Asistio Sesión':          '#6B4FAF',
  Compra:                    '#1E9957',
  'Pendiente pago':          '#C47F1A',
  Desiste:                   '#C0392B',
  'Ya es cliente':           '#0E9E6B',
}

const STAGE_LABELS: Record<string, string> = {
  api:                       'Ingreso WhatsApp',
  Registro:                  'Registro',
  'Contactado - CTA agenda': 'Contactado',
  'Solicito agenda':         'Solicitó agenda',
  Agendo:                    'Agendó sesión',
  'Asistio Sesión':          'Asistió a sesión',
  Compra:                    'Compra',
  'Pendiente pago':          'Pendiente pago',
  Desiste:                   'Desiste',
  'Ya es cliente':           'Ya es cliente',
}

const EXCLUDE_STAGES = new Set(['Desiste'])
const AUTO_COLORS    = ['#3B5FC0','#7B45C8','#1F8A7D','#C47F1A','#1E9957','#6B4FAF']

const W      = 1000
const BAR_H  = 72
const CONN_H = 26
// Proporción de taper para etapas con 0 — cada una es 62% de la anterior
const TAPER  = 0.62

export function ConversionFunnelLinear({ report, meta, isLoading }: ConversionFunnelLinearProps) {

  /* ── Skeleton ──────────────────────────────────────────────────────────── */
  if (isLoading) {
    const skeletonFracs = [1, 0.72, 0.52, 0.36, 0.24]
    return (
      <div className="w-full animate-pulse" style={{ lineHeight: 0 }}>
        {skeletonFracs.map((f, i) => {
          const tl = ((1 - f) / 2 * 100).toFixed(1)
          const tr = (100 - parseFloat(tl)).toFixed(1)
          const bf = i < skeletonFracs.length - 1 ? skeletonFracs[i + 1] : f * 0.75
          const bl = ((1 - bf) / 2 * 100).toFixed(1)
          const br = (100 - parseFloat(bl)).toFixed(1)
          return (
            <div key={i} style={{ height: BAR_H, margin: i > 0 ? `${CONN_H}px 0 0` : 0, position: 'relative' }}>
              <div
                className="bg-[var(--color-surface-2)] absolute inset-0"
                style={{ clipPath: `polygon(${tl}% 0%,${tr}% 0%,${br}% 100%,${bl}% 100%)` }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  /* ── Empty ─────────────────────────────────────────────────────────────── */
  if (!report) {
    return (
      <p className="text-xs text-[var(--color-ink-3)] text-center py-10">
        Seleccioná una clase para ver el embudo.
      </p>
    )
  }

  /* ── Build steps ───────────────────────────────────────────────────────── */
  const spend  = meta?.spend ?? 0
  const funnel = [...(report.pipeline_funnel ?? [])]
    .filter(s => !EXCLUDE_STAGES.has(s.stage_name))
    .sort((a, b) => a.position - b.position)

  const cumulative = funnel.map((stage, i) => ({
    label: STAGE_LABELS[stage.stage_name] ?? stage.stage_name,
    count: funnel.slice(i).reduce((s, x) => s + x.count, 0),
    color: STAGE_COLORS[stage.stage_name] ?? AUTO_COLORS[i % AUTO_COLORS.length],
  }))

  const lpViews = report.lp_views ?? 0
  const steps = [
    ...(lpViews > 0 ? [{ label: 'Visitas landing', count: lpViews, color: '#7C3AED' }] : []),
    { label: 'Leads totales', count: report.total_leads, color: '#3B5FC0' },
    ...cumulative,
  ]

  const maxCount = Math.max(...steps.map(s => s.count), 1)

  /* ── Monotonic visual fracs (0-count stages taper gracefully) ──────────── */
  const visualFracs: number[] = []
  for (let i = 0; i < steps.length; i++) {
    if (i === 0) { visualFracs.push(1.0); continue }
    const rf   = steps[i].count / maxCount
    const prev = visualFracs[i - 1]
    visualFracs.push(rf > 0 ? Math.min(rf, prev) : prev * TAPER)
  }

  /* ── SVG dimensions ────────────────────────────────────────────────────── */
  const n      = steps.length
  const totalH = n * BAR_H + (n - 1) * CONN_H

  const poly = (topF: number, botF: number) => {
    const tl = ((1 - topF) / 2 * W).toFixed(1)
    const tr = (W - parseFloat(tl)).toFixed(1)
    const bl = ((1 - botF)  / 2 * W).toFixed(1)
    const br = (W - parseFloat(bl)).toFixed(1)
    return `${tl},0 ${tr},0 ${br},${BAR_H} ${bl},${BAR_H}`
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${totalH}`}
        width="100%"
        style={{ display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {steps.map((step, i) => {
          const topF    = visualFracs[i]
          const botF    = i < n - 1 ? visualFracs[i + 1] : topF * 0.72
          const barY    = i * (BAR_H + CONN_H)
          const prev    = steps[i - 1]
          const convPct = prev && prev.count > 0
            ? ((step.count / prev.count) * 100).toFixed(1)
            : null
          const pctOfFirst = steps[0].count > 0
            ? Math.round((step.count / steps[0].count) * 100)
            : 0
          const costPer = spend > 0 && step.count > 0 ? spend / step.count : 0

          // Visible center x of this bar (midpoint of top edge)
          const barLeftX  = (1 - topF) / 2 * W
          const barWidth  = topF * W
          const midX      = barLeftX + barWidth / 2

          const connY = barY - CONN_H

          return (
            <g key={step.label}>

              {/* ── Connector ──────────────────────────────────────── */}
              {convPct !== null && (
                <g>
                  <line
                    x1={W / 2} y1={connY}
                    x2={W / 2} y2={connY + CONN_H - 2}
                    stroke="rgba(255,255,255,0.12)" strokeWidth="1"
                  />
                  <rect
                    x={W / 2 - 88} y={connY + 4}
                    width={176} height={16}
                    rx={8}
                    fill={
                      parseFloat(convPct) < 20 ? 'rgba(239,68,68,0.15)' :
                      parseFloat(convPct) < 50 ? 'rgba(234,179,8,0.15)' :
                                                 'rgba(34,197,94,0.15)'
                    }
                  />
                  <text
                    x={W / 2} y={connY + 16}
                    textAnchor="middle"
                    style={{
                      fill:
                        parseFloat(convPct) < 20 ? '#fca5a5' :
                        parseFloat(convPct) < 50 ? '#fde68a' : '#86efac',
                      fontSize: '11px',
                      fontFamily: 'ui-monospace, monospace',
                      fontWeight: 600,
                    }}
                  >
                    {convPct}% conversión
                  </text>
                </g>
              )}

              {/* ── Trapezoid ──────────────────────────────────────── */}
              <polygon
                points={poly(topF, botF)}
                fill={step.color}
                transform={`translate(0,${barY})`}
              />

              {/* ── Label (stage name, small) ───────────────────────── */}
              <text
                x={midX}
                y={barY + BAR_H / 2 - 9}
                textAnchor="middle"
                style={{
                  fill: 'rgba(255,255,255,0.62)',
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, monospace',
                  letterSpacing: '0.12em',
                  fontWeight: 500,
                }}
              >
                {step.label.toUpperCase()}
              </text>

              {/* ── Count (big number) ─────────────────────────────── */}
              <text
                x={midX}
                y={barY + BAR_H / 2 + 18}
                textAnchor="middle"
                style={{
                  fill: '#ffffff',
                  fontSize: '28px',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                  fontWeight: 700,
                }}
              >
                {formatNumber(step.count)}
              </text>

              {/* ── % of top (right corner, subtle) ────────────────── */}
              {i > 0 && (
                <text
                  x={barLeftX + barWidth - 10}
                  y={barY + BAR_H - 10}
                  textAnchor="end"
                  style={{
                    fill: 'rgba(255,255,255,0.35)',
                    fontSize: '10px',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {pctOfFirst}%
                </text>
              )}

            </g>
          )
        })}
      </svg>

      {/* ── Cost legend below SVG ──────────────────────────────────────────── */}
      {spend > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-2">
          {steps.map((step) => {
            const cost = step.count > 0 ? spend / step.count : 0
            if (!cost) return null
            return (
              <span
                key={step.label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
                style={{
                  background: step.color + '20',
                  color:      step.color,
                  border:     `1px solid ${step.color}40`,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: '0.08em' }}>
                  {step.label.toUpperCase()}
                </span>
                {formatCurrency(cost)}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
