'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiFetch } from '@/lib/api'
import { UserProfile } from '@/types'
import { UtmEducation } from './UtmEducation'
import { FunnelLinksManager, type FunnelLink } from './FunnelLinksManager'
import { MetaUtmApplier } from './MetaUtmApplier'
import {
  Link2, Copy, Check, Plus, Trash2, ChevronDown, ChevronUp,
  BookOpen, Settings, Zap, ClipboardList, Target,
} from 'lucide-react'

/* ── Types ────────────────────────────────────────────────────────────────── */

interface UtmConvention { id: string; param: string; value: string }

interface HistoryEntry {
  url: string
  label: string
  ts: number
}

const UTM_PARAMS = [
  {
    key: 'utm_source',
    label: 'Fuente',
    placeholder: 'facebook',
    help: 'La plataforma o sitio de donde viene el tráfico.',
    examples: ['facebook', 'instagram', 'google', 'whatsapp', 'email', 'tiktok'],
  },
  {
    key: 'utm_medium',
    label: 'Medio',
    placeholder: 'paid',
    help: 'El tipo de canal: pagado, orgánico, email, etc.',
    examples: ['paid', 'cpc', 'organic', 'social', 'email', 'story', 'reel'],
  },
  {
    key: 'utm_campaign',
    label: 'Campaña',
    placeholder: 'clase-vivo-29abr',
    help: 'El nombre de tu campaña o promoción específica.',
    examples: ['clase-vivo-29abr', 'evento-bogota-may', 'lanzamiento-curso-x', 'retargeting-mayo'],
  },
  {
    key: 'utm_content',
    label: 'Contenido',
    placeholder: 'video-testimonio',
    help: 'Diferencia variaciones del mismo anuncio (A/B test, creativos).',
    examples: ['video-testimonio', 'carrusel-beneficios', 'imagen-promocion', 'story-urgencia'],
  },
  {
    key: 'utm_term',
    label: 'Término',
    placeholder: 'marketing-digital',
    help: 'Palabra clave (útil para Google Ads). Opcional para Meta.',
    examples: ['marketing-digital', 'curso-online', 'coaching', 'emprendimiento'],
  },
] as const

type UtmKey = typeof UTM_PARAMS[number]['key']

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'learn',     label: 'Aprende',        icon: <BookOpen size={14} strokeWidth={1.5} /> },
  { id: 'links',     label: 'Mis Embudos',    icon: <Settings size={14} strokeWidth={1.5} /> },
  { id: 'generate',  label: 'Generar URL',    icon: <Zap size={14} strokeWidth={1.5} /> },
  { id: 'meta',      label: 'Aplicar a Meta', icon: <Target size={14} strokeWidth={1.5} /> },
  { id: 'history',   label: 'Historial',      icon: <ClipboardList size={14} strokeWidth={1.5} /> },
] as const

type TabId = typeof TABS[number]['id']

/* ── Component ────────────────────────────────────────────────────────────── */

export function UtmBuilderClient({ user }: { user: UserProfile }) {
  const [activeTab, setActiveTab] = useState<TabId>('generate')

  // Funnel links
  const [funnelLinks, setFunnelLinks] = useState<FunnelLink[]>([])
  const [linksLoading, setLinksLoading] = useState(true)

  // Conventions
  const [conventions, setConventions] = useState<UtmConvention[]>([])

  // Generator state
  const [selectedLinkId, setSelectedLinkId] = useState<string | ''>('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [utmValues, setUtmValues] = useState<Record<UtmKey, string>>({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
  })
  const [copied, setCopied] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState<UtmKey | null>(null)

  // History (session-only)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadFunnelLinks = useCallback(async () => {
    setLinksLoading(true)
    try {
      const res = await apiFetch('/api/utm/funnel-links')
      if (res.ok) setFunnelLinks(await res.json())
    } catch { /* ignore */ }
    setLinksLoading(false)
  }, [])

  const loadConventions = useCallback(async () => {
    try {
      const res = await apiFetch('/api/utm/conventions')
      if (res.ok) setConventions(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadFunnelLinks()
    loadConventions()
  }, [loadFunnelLinks, loadConventions])

  // ── Derived state ─────────────────────────────────────────────────────────

  const baseUrl = useMemo(() => {
    if (selectedLinkId) {
      const link = funnelLinks.find(l => l.id === selectedLinkId)
      return link?.base_url ?? ''
    }
    return customBaseUrl
  }, [selectedLinkId, customBaseUrl, funnelLinks])

  const generatedUrl = useMemo(() => {
    if (!baseUrl) return ''
    try {
      const url = new URL(baseUrl)
      for (const p of UTM_PARAMS) {
        const val = utmValues[p.key].trim()
        if (val) url.searchParams.set(p.key, val.replace(/\s+/g, '-').toLowerCase())
      }
      return url.toString()
    } catch {
      let result = baseUrl
      const params: string[] = []
      for (const p of UTM_PARAMS) {
        const val = utmValues[p.key].trim()
        if (val) params.push(`${p.key}=${encodeURIComponent(val.replace(/\s+/g, '-').toLowerCase())}`)
      }
      if (params.length) {
        result += (result.includes('?') ? '&' : '?') + params.join('&')
      }
      return result
    }
  }, [baseUrl, utmValues])

  const hasAnyUtm = Object.values(utmValues).some(v => v.trim())

  // ── Suggestions from conventions ──────────────────────────────────────────

  const getSuggestions = useCallback((param: UtmKey): string[] => {
    const fromConventions = conventions
      .filter(c => c.param === param)
      .map(c => c.value)
    const defaults = UTM_PARAMS.find(p => p.key === param)?.examples ?? []
    const merged = [...new Set([...fromConventions, ...defaults])]
    return merged
  }, [conventions])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleCopy() {
    if (!generatedUrl) return
    await navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    const selectedLink = funnelLinks.find(l => l.id === selectedLinkId)
    setHistory(prev => [{
      url: generatedUrl,
      label: selectedLink?.label ?? customBaseUrl,
      ts: Date.now(),
    }, ...prev].slice(0, 50))
  }

  function handleReset() {
    setUtmValues({ utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '' })
    setSelectedLinkId('')
    setCustomBaseUrl('')
  }

  async function saveConvention(param: UtmKey, value: string) {
    if (!value.trim()) return
    try {
      const res = await apiFetch('/api/utm/conventions', {
        method: 'POST',
        body: JSON.stringify({ param, value: value.trim().toLowerCase() }),
      })
      if (res.ok) loadConventions()
    } catch { /* ignore */ }
  }

  async function removeConvention(id: string) {
    try {
      await apiFetch(`/api/utm/conventions/${id}`, { method: 'DELETE' })
      setConventions(prev => prev.filter(c => c.id !== id))
    } catch { /* ignore */ }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--color-canvas)' }}>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all duration-150
              ${activeTab === tab.id
                ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)] shadow-sm'
                : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)]'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Aprende ─────────────────────────────────────────────────── */}
      {activeTab === 'learn' && <UtmEducation />}

      {/* ── Tab: Mis Embudos ─────────────────────────────────────────────── */}
      {activeTab === 'links' && (
        <FunnelLinksManager
          links={funnelLinks}
          loading={linksLoading}
          onRefresh={loadFunnelLinks}
        />
      )}

      {/* ── Tab: Generar URL ─────────────────────────────────────────────── */}
      {activeTab === 'generate' && (
        <div className="max-w-3xl space-y-6">
          {/* Step 1: Base URL */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-gold-glow)] text-[var(--color-gold)] text-xs font-bold">1</span>
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Elige la URL base</h3>
            </div>

            {funnelLinks.length > 0 && (
              <div className="mb-3">
                <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-3)] font-medium mb-1.5">
                  Embudos guardados
                </label>
                <div className="flex flex-wrap gap-2">
                  {funnelLinks.map(link => (
                    <button
                      key={link.id}
                      onClick={() => { setSelectedLinkId(link.id === selectedLinkId ? '' : link.id); setCustomBaseUrl('') }}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                        ${selectedLinkId === link.id
                          ? 'border-[var(--color-gold)] bg-[var(--color-gold-glow)] text-[var(--color-gold)]'
                          : 'border-[var(--color-border)] text-[var(--color-ink-2)] hover:border-[var(--color-gold-dim)] hover:text-[var(--color-ink)]'
                        }
                      `}
                    >
                      <span className="mr-1.5 opacity-60">
                        {link.category === 'clase' ? '🎓' : link.category === 'evento' ? '📍' : link.category === 'hotmart' ? '🔥' : '🔗'}
                      </span>
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-3)] font-medium mb-1.5">
                {funnelLinks.length > 0 ? 'O escribe una URL manual' : 'URL base del embudo'}
              </label>
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-[var(--color-ink-3)] flex-shrink-0" />
                <input
                  type="url"
                  placeholder="https://tu-pagina.com/registro"
                  value={selectedLinkId ? (funnelLinks.find(l => l.id === selectedLinkId)?.base_url ?? '') : customBaseUrl}
                  onChange={e => { setCustomBaseUrl(e.target.value); setSelectedLinkId('') }}
                  disabled={!!selectedLinkId}
                  className="
                    flex-1 px-3 py-2 rounded-lg text-sm
                    bg-[var(--color-canvas)] border border-[var(--color-border)]
                    text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]
                    focus:outline-none focus:border-[var(--color-gold-dim)] focus:ring-1 focus:ring-[var(--color-gold-dim)]
                    disabled:opacity-50
                    transition-all
                  "
                />
              </div>
              {!baseUrl && (
                <p className="mt-1.5 text-[10px] text-[var(--color-ink-3)]">
                  Consejo: guarda tus links en la pestaña &quot;Mis Embudos&quot; para reutilizarlos.
                </p>
              )}
            </div>
          </section>

          {/* Step 2: UTM Params */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-gold-glow)] text-[var(--color-gold)] text-xs font-bold">2</span>
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Agrega los parámetros UTM</h3>
            </div>

            <div className="space-y-3">
              {UTM_PARAMS.map(param => {
                const suggestions = getSuggestions(param.key)
                const isOpen = showSuggestions === param.key
                return (
                  <div key={param.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-[var(--color-ink-2)]">
                        <code className="text-[var(--color-gold)] text-[10px] font-mono mr-1.5">{param.key}</code>
                        {param.label}
                        {(param.key === 'utm_content' || param.key === 'utm_term') && (
                          <span className="ml-1.5 text-[10px] text-[var(--color-ink-3)] font-normal">Opcional</span>
                        )}
                      </label>
                      <button
                        onClick={() => setShowSuggestions(isOpen ? null : param.key)}
                        className="text-[10px] text-[var(--color-ink-3)] hover:text-[var(--color-gold)] transition-colors flex items-center gap-0.5"
                      >
                        sugerencias {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={param.placeholder}
                      value={utmValues[param.key]}
                      onChange={e => setUtmValues(prev => ({ ...prev, [param.key]: e.target.value }))}
                      className="
                        w-full px-3 py-2 rounded-lg text-sm
                        bg-[var(--color-canvas)] border border-[var(--color-border)]
                        text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]
                        focus:outline-none focus:border-[var(--color-gold-dim)] focus:ring-1 focus:ring-[var(--color-gold-dim)]
                        transition-all
                      "
                    />
                    <p className="mt-1 text-[10px] text-[var(--color-ink-3)]">{param.help}</p>

                    {isOpen && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {suggestions.map(s => (
                          <button
                            key={s}
                            onClick={() => { setUtmValues(prev => ({ ...prev, [param.key]: s })); setShowSuggestions(null) }}
                            className="
                              px-2.5 py-1 rounded-md text-[11px] font-mono
                              bg-[var(--color-canvas)] border border-[var(--color-border)]
                              text-[var(--color-ink-2)] hover:border-[var(--color-gold-dim)] hover:text-[var(--color-gold)]
                              transition-all
                            "
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Step 3: Preview & Copy */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-gold-glow)] text-[var(--color-gold)] text-xs font-bold">3</span>
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Tu URL con tracking</h3>
            </div>

            <div className="
              p-4 rounded-lg
              bg-[var(--color-canvas)] border border-[var(--color-border)]
              font-mono text-xs leading-relaxed break-all
              min-h-[60px] flex items-center
            " style={{ color: generatedUrl ? 'var(--color-ink)' : 'var(--color-ink-3)' }}>
              {generatedUrl ? (
                <HighlightedUrl url={generatedUrl} />
              ) : (
                <span>Selecciona una URL base y agrega al menos un parámetro UTM...</span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleCopy}
                disabled={!generatedUrl}
                className="
                  flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed
                  bg-[var(--color-gold)] text-[var(--color-canvas)] hover:opacity-90
                "
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiada' : 'Copiar URL'}
              </button>
              <button
                onClick={handleReset}
                className="
                  flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all
                  border border-[var(--color-border)] text-[var(--color-ink-3)]
                  hover:border-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]
                "
              >
                Limpiar
              </button>
              {hasAnyUtm && (
                <button
                  onClick={() => {
                    for (const p of UTM_PARAMS) {
                      const val = utmValues[p.key].trim()
                      if (val) saveConvention(p.key, val)
                    }
                  }}
                  className="
                    flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all
                    border border-[var(--color-border)] text-[var(--color-ink-3)]
                    hover:border-[var(--color-gold-dim)] hover:text-[var(--color-gold)]
                  "
                >
                  <Plus size={12} />
                  Guardar valores como sugerencias
                </button>
              )}
            </div>
          </section>

          {/* Conventions table */}
          {conventions.length > 0 && (
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Convenciones guardadas</h3>
              <div className="space-y-2">
                {UTM_PARAMS.map(param => {
                  const items = conventions.filter(c => c.param === param.key)
                  if (!items.length) return null
                  return (
                    <div key={param.key} className="flex items-start gap-3">
                      <code className="text-[10px] font-mono text-[var(--color-gold)] w-28 flex-shrink-0 pt-1">{param.key}</code>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(c => (
                          <span key={c.id} className="
                            inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]
                            bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-ink-2)]
                          ">
                            {c.value}
                            <button
                              onClick={() => removeConvention(c.id)}
                              className="text-[var(--color-ink-3)] hover:text-[var(--color-red)] transition-colors"
                            >
                              <Trash2 size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Tab: Aplicar a Meta ──────────────────────────────────────────── */}
      {activeTab === 'meta' && (
        <MetaUtmApplier initialValues={utmValues} />
      )}

      {/* ── Tab: Historial ─────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="max-w-3xl">
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-4">URLs generadas en esta sesión</h3>
            {history.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-3)] py-8 text-center">
                Aún no has generado URLs. Ve a la pestaña &quot;Generar URL&quot; para empezar.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((entry, idx) => (
                  <div
                    key={`${entry.ts}-${idx}`}
                    className="
                      flex items-center gap-3 p-3 rounded-lg
                      bg-[var(--color-canvas)] border border-[var(--color-border)]
                    "
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[var(--color-ink-3)] mb-0.5">
                        {entry.label} — {new Date(entry.ts).toLocaleTimeString('es')}
                      </p>
                      <p className="text-xs font-mono text-[var(--color-ink-2)] break-all leading-relaxed">
                        {entry.url}
                      </p>
                    </div>
                    <CopyButton text={entry.url} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

/* ── Subcomponents ────────────────────────────────────────────────────────── */

function HighlightedUrl({ url }: { url: string }) {
  try {
    const parsed = new URL(url)
    const base = `${parsed.origin}${parsed.pathname}`
    const params = [...parsed.searchParams.entries()]
    return (
      <span>
        <span style={{ color: 'var(--color-ink-2)' }}>{base}</span>
        {params.length > 0 && <span style={{ color: 'var(--color-ink-3)' }}>?</span>}
        {params.map(([k, v], i) => (
          <span key={k}>
            {i > 0 && <span style={{ color: 'var(--color-ink-3)' }}>&amp;</span>}
            <span style={{ color: 'var(--color-gold)' }}>{k}</span>
            <span style={{ color: 'var(--color-ink-3)' }}>=</span>
            <span style={{ color: '#06d6a0' }}>{v}</span>
          </span>
        ))}
      </span>
    )
  } catch {
    return <span>{url}</span>
  }
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500) }}
      className="
        flex-shrink-0 p-2 rounded-md transition-all
        text-[var(--color-ink-3)] hover:text-[var(--color-gold)] hover:bg-[var(--color-gold-glow)]
      "
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}
