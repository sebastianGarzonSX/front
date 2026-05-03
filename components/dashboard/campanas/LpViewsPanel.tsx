'use client'

import { useState } from 'react'
import { Eye, ExternalLink, Code, Copy, Check, Users } from 'lucide-react'
import { useLpViews } from '@/hooks/useLpViews'
import { formatNumber } from '@/components/dashboard/KPICard'

interface Props {
  tag:        string | null
  totalLeads: number
}

export function LpViewsPanel({ tag, totalLeads }: Props) {
  const { views, uniqueViews, updatedAt, isLoading, error, snippet, snippetLoading, loadSnippet } = useLpViews(tag)
  const [showSnippet, setShowSnippet] = useState(false)
  const [copied, setCopied]           = useState(false)

  const convPct = views && views > 0
    ? ((totalLeads / views) * 100).toFixed(1)
    : null

  const dropoff = views && views > 0
    ? Math.max(views - totalLeads, 0)
    : null

  const handleShowSnippet = async () => {
    if (!showSnippet && !snippet) await loadSnippet()
    setShowSnippet(s => !s)
  }

  const handleCopy = async () => {
    if (!snippet) return
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!tag) return null

  const hasData = views !== null && views > 0

  return (
    <div className="
      flex flex-col gap-3 p-4 rounded-[var(--radius-md)]
      border border-[var(--color-border)] bg-[var(--color-surface)]
    ">
      {/* Encabezado */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: '#7C3AED22', color: '#7C3AED' }}
        >
          <Eye size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
              Visitas a la landing · tracking automático
            </p>
            <a
              href="https://app.konektaa2.com/v2/location/eLwwrXVnisqAojmgBN3V/analytics?type=external_analytics&tab=total_page_views"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] hover:text-[var(--color-gold)]"
            >
              ver en GHL <ExternalLink size={9} />
            </a>
          </div>

          {/* Métricas principales */}
          <div className="flex items-end gap-4 mt-2 flex-wrap">
            <div>
              <p className="text-2xl font-semibold font-[var(--font-display)] text-[var(--color-ink)] tabular-nums leading-none">
                {isLoading ? '…' : hasData ? formatNumber(views) : '—'}
              </p>
              <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
                total
              </p>
            </div>

            {uniqueViews !== null && uniqueViews > 0 && (
              <div className="flex items-baseline gap-1.5">
                <Users size={11} className="text-[var(--color-ink-3)]" />
                <div>
                  <p className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-ink)] tabular-nums leading-none">
                    {formatNumber(uniqueViews)}
                  </p>
                  <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
                    únicas
                  </p>
                </div>
              </div>
            )}

            {convPct && (
              <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
                → {formatNumber(totalLeads)} leads · <span className="text-[var(--color-green)] font-semibold">{convPct}%</span> conversión
              </p>
            )}

            {dropoff !== null && dropoff > 0 && (
              <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-red)]">
                {formatNumber(dropoff)} no convirtieron
              </p>
            )}
          </div>

          {/* Error debug */}
          {error && (
            <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-red)] mt-2 bg-[var(--color-red)]/10 px-2 py-1 rounded break-all">
              Error: {error}
            </p>
          )}

          {/* Estado y timestamp */}
          <div className="flex items-center justify-between mt-2 gap-2">
            <p className="text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)]">
              {updatedAt
                ? `última visita ${new Date(updatedAt).toLocaleString()}`
                : hasData
                  ? 'sin datos de timestamp'
                  : 'sin visitas registradas — ¿ya pegaste el snippet en la landing?'}
            </p>

            <button
              onClick={handleShowSnippet}
              className="
                flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)]
                text-[10px] font-[var(--font-mono)]
                bg-[var(--color-surface-2)] border border-[var(--color-border)]
                text-[var(--color-ink-2)]
                hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]
              "
            >
              <Code size={10} />
              {showSnippet ? 'ocultar snippet' : 'ver snippet'}
            </button>
          </div>
        </div>
      </div>

      {/* Snippet colapsable */}
      {showSnippet && (
        <div className="mt-1 border-t border-[var(--color-border)] pt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
              Pegar en Header/Body Code de la landing en GHL
            </p>
            <button
              onClick={handleCopy}
              disabled={!snippet}
              className="
                flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)]
                text-[9px] font-[var(--font-mono)]
                bg-[var(--color-surface-2)] border border-[var(--color-border)]
                text-[var(--color-ink-2)]
                hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]
                disabled:opacity-40
              "
            >
              {copied ? <><Check size={9} /> copiado</> : <><Copy size={9} /> copiar</>}
            </button>
          </div>
          {snippetLoading ? (
            <p className="text-xs text-[var(--color-ink-3)]">Cargando…</p>
          ) : snippet ? (
            <pre className="
              text-[10px] font-[var(--font-mono)] text-[var(--color-ink-2)]
              bg-[var(--color-bg)] border border-[var(--color-border)]
              rounded-[var(--radius-sm)] p-3 overflow-x-auto whitespace-pre-wrap
              leading-relaxed
            ">
              {snippet}
            </pre>
          ) : (
            <p className="text-xs text-[var(--color-red)]">No se pudo cargar el snippet</p>
          )}
        </div>
      )}
    </div>
  )
}
