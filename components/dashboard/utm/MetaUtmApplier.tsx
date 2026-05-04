'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'
import { Check, Loader2, AlertCircle, ChevronDown, RefreshCw, Search } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

const UTM_PARAMS = [
  { key: 'utm_source',   label: 'Fuente',    placeholder: 'facebook',          optional: false },
  { key: 'utm_medium',   label: 'Medio',     placeholder: 'paid_social',       optional: false },
  { key: 'utm_campaign', label: 'Campaña',   placeholder: 'nombre-campaña',    optional: false },
  { key: 'utm_content',  label: 'Contenido', placeholder: 'video-testimonio',  optional: true  },
  { key: 'utm_term',     label: 'Término',   placeholder: '',                  optional: true  },
] as const

type UtmKey = typeof UTM_PARAMS[number]['key']
type UtmValues = Record<UtmKey, string>

interface MetaCampaign {
  id:        string
  name:      string
  status:    string
  objective: string
}

interface MetaAd {
  id:               string
  name:             string
  status:           string
  effective_status: string
  creative?: { id: string; url_tags?: string }
}

interface AdResult {
  state:   'idle' | 'applying' | 'success' | 'error' | 'verifying' | 'verified'
  message?: string       // error message from Meta
  liveTag?: string       // url_tags confirmed from Meta after verify
}

export interface MetaUtmApplierProps {
  initialValues: UtmValues
}

// ── Component ──────────────────────────────────────────────────────────────

export function MetaUtmApplier({ initialValues }: MetaUtmApplierProps) {
  const [account,          setAccount]          = useState<'main' | 'eventos'>('main')
  const [campaigns,        setCampaigns]        = useState<MetaCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignsError,   setCampaignsError]   = useState<string | null>(null)

  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [ads,              setAds]              = useState<MetaAd[]>([])
  const [adsLoading,       setAdsLoading]       = useState(false)
  const [adsError,         setAdsError]         = useState<string | null>(null)

  const [selectedAdIds,    setSelectedAdIds]    = useState<Set<string>>(new Set())
  const [utmValues,        setUtmValues]        = useState<UtmValues>(initialValues)
  const [adResults,        setAdResults]        = useState<Record<string, AdResult>>({})
  const [applying,         setApplying]         = useState(false)

  // ── Loaders ────────────────────────────────────────────────────────────

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true)
    setCampaignsError(null)
    setCampaigns([])
    setSelectedCampaign('')
    setAds([])
    try {
      const res = await apiFetch(`/api/utm/meta/campaigns?account=${account}`)
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { error?: string }
        setCampaignsError(b.error ?? `Error ${res.status}`)
        return
      }
      setCampaigns(await res.json() as MetaCampaign[])
    } catch (err) {
      setCampaignsError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setCampaignsLoading(false)
    }
  }, [account])

  const loadAds = useCallback(async (campaignId: string) => {
    if (!campaignId) return
    setAdsLoading(true)
    setAdsError(null)
    setAds([])
    setSelectedAdIds(new Set())
    setAdResults({})
    try {
      const res = await apiFetch(`/api/utm/meta/campaigns/${campaignId}/ads`)
      if (!res.ok) {
        const b = await res.json().catch(() => ({})) as { error?: string }
        setAdsError(b.error ?? `Error ${res.status}`)
        return
      }
      setAds(await res.json() as MetaAd[])
    } catch (err) {
      setAdsError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setAdsLoading(false)
    }
  }, [])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])
  useEffect(() => { if (selectedCampaign) loadAds(selectedCampaign) }, [selectedCampaign, loadAds])

  // ── Helpers ────────────────────────────────────────────────────────────

  function buildUrlTags(): string {
    return UTM_PARAMS
      .map(p => {
        const v = utmValues[p.key].trim()
        return v ? `${p.key}=${encodeURIComponent(v.replace(/\s+/g, '-').toLowerCase())}` : ''
      })
      .filter(Boolean)
      .join('&')
  }

  function statusBadge(status: string) {
    switch (status.toUpperCase()) {
      case 'ACTIVE':   return { label: 'ACTIVO',    color: '#06d6a0' }
      case 'PAUSED':   return { label: 'PAUSADO',   color: '#ffd166' }
      case 'ARCHIVED': return { label: 'ARCHIVADO', color: '#6c757d' }
      default:         return { label: status,      color: 'var(--color-ink-3)' }
    }
  }

  function setResult(adId: string, patch: Partial<AdResult>) {
    setAdResults(prev => ({ ...prev, [adId]: { ...(prev[adId] ?? { state: 'idle' }), ...patch } }))
  }

  // ── Apply UTMs ─────────────────────────────────────────────────────────

  async function applyToSelected() {
    const urlTags = buildUrlTags()
    if (!urlTags || selectedAdIds.size === 0) return

    setApplying(true)
    for (const id of selectedAdIds) setResult(id, { state: 'applying', message: undefined })

    await Promise.all([...selectedAdIds].map(async (adId) => {
      try {
        const res  = await apiFetch(`/api/utm/meta/ads/${adId}/url-tags`, {
          method: 'POST',
          body:   JSON.stringify({ url_tags: urlTags }),
        })
        const body = await res.json().catch(() => ({})) as { error?: string; ad_error?: string }

        if (res.ok) {
          setResult(adId, { state: 'success' })
          setAds(prev => prev.map(ad =>
            ad.id === adId && ad.creative
              ? { ...ad, creative: { ...ad.creative, url_tags: urlTags } }
              : ad
          ))
        } else {
          // Mostrar el mensaje exacto de Meta
          const metaMsg = body.error ?? `HTTP ${res.status}`
          setResult(adId, { state: 'error', message: metaMsg })
        }
      } catch (err) {
        setResult(adId, { state: 'error', message: err instanceof Error ? err.message : 'Error de red' })
      }
    }))

    setApplying(false)
  }

  // ── Verify: re-fetch from Meta to confirm real state ──────────────────

  async function verifyAd(adId: string) {
    setResult(adId, { state: 'verifying' })
    try {
      const res  = await apiFetch(`/api/utm/meta/ads/${adId}/inspect`)
      const body = await res.json().catch(() => ({})) as {
        creative?: { url_tags?: string }
        error?: string
      }
      if (!res.ok) {
        setResult(adId, { state: 'error', message: body.error ?? `HTTP ${res.status}` })
        return
      }
      const liveTag = body.creative?.url_tags ?? ''
      setResult(adId, { state: 'verified', liveTag })
      // Sync local ad list too
      setAds(prev => prev.map(ad =>
        ad.id === adId && ad.creative
          ? { ...ad, creative: { ...ad.creative, url_tags: liveTag } }
          : ad
      ))
    } catch (err) {
      setResult(adId, { state: 'error', message: err instanceof Error ? err.message : 'Error' })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const urlTags     = buildUrlTags()
  const hasUtm      = !!urlTags
  const allSelected = ads.length > 0 && selectedAdIds.size === ads.length

  return (
    <div className="max-w-3xl space-y-6">

      {/* Step 1: Cuenta + Campaña */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-gold-glow)] text-[var(--color-gold)] text-xs font-bold">1</span>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Selecciona una campaña</h3>
          </div>
          <button
            onClick={loadCampaigns}
            disabled={campaignsLoading}
            className="p-1.5 rounded-md text-[var(--color-ink-3)] hover:text-[var(--color-gold)] hover:bg-[var(--color-gold-glow)] transition-all"
            title="Recargar campañas desde Meta"
          >
            <RefreshCw size={13} className={campaignsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Account toggle */}
        <div className="flex gap-1 mb-4 p-1 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] w-fit">
          {(['main', 'eventos'] as const).map(acc => (
            <button
              key={acc}
              onClick={() => setAccount(acc)}
              className={`
                px-3 py-1 rounded-md text-xs font-medium transition-all
                ${account === acc
                  ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]'
                  : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'
                }
              `}
            >
              {acc === 'main' ? 'Cuenta Principal' : 'Cuenta Eventos'}
            </button>
          ))}
        </div>

        {campaignsError ? (
          <div className="flex items-center gap-2 text-xs text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle size={13} /> {campaignsError}
          </div>
        ) : campaignsLoading ? (
          <div className="flex items-center gap-2 text-xs text-[var(--color-ink-3)]">
            <Loader2 size={13} className="animate-spin" /> Cargando campañas...
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
              className="
                w-full px-3 py-2 pr-8 rounded-lg text-sm appearance-none cursor-pointer
                bg-[var(--color-canvas)] border border-[var(--color-border)]
                text-[var(--color-ink)]
                focus:outline-none focus:border-[var(--color-gold-dim)]
              "
            >
              <option value="">— {campaigns.length} campaña{campaigns.length !== 1 ? 's' : ''} —</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name} · {c.status}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-3)] pointer-events-none" />
          </div>
        )}
      </section>

      {/* Step 2: UTM fields */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-gold-glow)] text-[var(--color-gold)] text-xs font-bold">2</span>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Configura los UTMs</h3>
          <span className="text-[10px] text-[var(--color-ink-3)]">pre-llenado desde &ldquo;Generar URL&rdquo; si ya configuraste valores</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {UTM_PARAMS.map(p => (
            <div key={p.key} className={p.key === 'utm_term' ? 'col-span-2' : ''}>
              <label className="block text-[10px] font-medium text-[var(--color-ink-3)] mb-1">
                <code className="text-[var(--color-gold)] font-mono mr-1">{p.key}</code>
                {p.optional && <span className="opacity-60">opcional</span>}
              </label>
              <input
                type="text"
                placeholder={p.placeholder}
                value={utmValues[p.key]}
                onChange={e => setUtmValues(prev => ({ ...prev, [p.key]: e.target.value }))}
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-[var(--color-canvas)] border border-[var(--color-border)]
                  text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]
                  focus:outline-none focus:border-[var(--color-gold-dim)] focus:ring-1 focus:ring-[var(--color-gold-dim)]
                  transition-all
                "
              />
            </div>
          ))}
        </div>

        {hasUtm ? (
          <div className="mt-3 p-2.5 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-ink-2)] font-mono break-all leading-relaxed">{urlTags}</p>
          </div>
        ) : (
          <p className="mt-3 text-[10px] text-[var(--color-ink-3)]">
            Completa al menos utm_source, utm_medium y utm_campaign.
          </p>
        )}
      </section>

      {/* Step 3: Ads list */}
      {selectedCampaign && (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-gold-glow)] text-[var(--color-gold)] text-xs font-bold">3</span>
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">Anuncios</h3>
            </div>
            {ads.length > 0 && (
              <button
                onClick={() => setSelectedAdIds(allSelected ? new Set() : new Set(ads.map(a => a.id)))}
                className="text-xs text-[var(--color-ink-3)] hover:text-[var(--color-gold)] transition-colors"
              >
                {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
            )}
          </div>

          {adsLoading ? (
            <div className="flex items-center gap-2 text-xs text-[var(--color-ink-3)]">
              <Loader2 size={13} className="animate-spin" /> Cargando anuncios...
            </div>
          ) : adsError ? (
            <div className="flex items-center gap-2 text-xs text-red-400 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle size={13} /> {adsError}
            </div>
          ) : ads.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-3)] py-6 text-center">
              No se encontraron anuncios en esta campaña.
            </p>
          ) : (
            <div className="space-y-2">
              {ads.map(ad => {
                const isSelected = selectedAdIds.has(ad.id)
                const result     = adResults[ad.id]
                const badge      = statusBadge(ad.effective_status ?? ad.status)
                const isVerifying = result?.state === 'verifying'
                const isApplying  = result?.state === 'applying'

                return (
                  <div key={ad.id} className="space-y-1">
                    <div
                      onClick={() => {
                        const next = new Set(selectedAdIds)
                        isSelected ? next.delete(ad.id) : next.add(ad.id)
                        setSelectedAdIds(next)
                      }}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border select-none
                        ${isSelected
                          ? 'border-[var(--color-gold)] bg-[var(--color-gold-glow)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-gold-dim)]'
                        }
                      `}
                    >
                      {/* Checkbox */}
                      <div className={`
                        mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${isSelected ? 'border-[var(--color-gold)] bg-[var(--color-gold)]' : 'border-[var(--color-border)]'}
                      `}>
                        {isSelected && <Check size={10} className="text-[var(--color-canvas)]" strokeWidth={3} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-medium text-[var(--color-ink)] truncate max-w-[240px]">
                            {ad.name}
                          </span>
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ color: badge.color, background: `${badge.color}20` }}
                          >
                            {badge.label}
                          </span>

                          {/* Per-ad state indicator */}
                          {isApplying  && <Loader2 size={11} className="animate-spin text-[var(--color-gold)]" />}
                          {isVerifying && <Loader2 size={11} className="animate-spin text-blue-400" />}
                          {result?.state === 'success'  && <span className="text-[10px] text-emerald-400 font-medium">✓ aplicado</span>}
                          {result?.state === 'verified' && <span className="text-[10px] text-emerald-400 font-medium">✓ verificado en Meta</span>}
                          {result?.state === 'error'    && <span className="text-[10px] text-red-400 font-medium">✗ error</span>}
                        </div>

                        {/* Current url_tags from local state */}
                        <p className={`text-[10px] font-mono truncate ${ad.creative?.url_tags ? 'text-[var(--color-ink-2)]' : 'text-[var(--color-ink-3)] opacity-50 italic'}`}>
                          {ad.creative?.url_tags ?? 'Sin url_tags'}
                        </p>

                        {/* Verified live value (different from cached) */}
                        {result?.state === 'verified' && result.liveTag !== ad.creative?.url_tags && (
                          <p className="text-[10px] font-mono text-emerald-400 truncate mt-0.5">
                            Meta live: {result.liveTag || '(vacío)'}
                          </p>
                        )}
                      </div>

                      {/* Verify button — stops propagation so it doesn't toggle checkbox */}
                      <button
                        onClick={e => { e.stopPropagation(); verifyAd(ad.id) }}
                        disabled={isVerifying || isApplying}
                        className="
                          flex-shrink-0 p-1.5 rounded-md transition-all
                          text-[var(--color-ink-3)] hover:text-blue-400 hover:bg-blue-400/10
                          disabled:opacity-30
                        "
                        title="Verificar estado real en Meta"
                      >
                        <Search size={12} />
                      </button>
                    </div>

                    {/* Error detail row */}
                    {result?.state === 'error' && result.message && (
                      <div className="ml-7 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-[10px] text-red-300 font-mono break-words leading-relaxed">
                          {result.message}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Apply bar */}
          {selectedAdIds.size > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-[var(--color-ink-3)]">
                {selectedAdIds.size} anuncio{selectedAdIds.size !== 1 ? 's' : ''} seleccionado{selectedAdIds.size !== 1 ? 's' : ''}
                {!hasUtm && <span className="ml-2 text-amber-400">— completa los UTMs primero</span>}
              </p>
              <button
                onClick={applyToSelected}
                disabled={!hasUtm || applying}
                className="
                  flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all
                  bg-[var(--color-gold)] text-[var(--color-canvas)] hover:opacity-90
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {applying
                  ? <><Loader2 size={13} className="animate-spin" /> Aplicando...</>
                  : <><Check size={13} /> Aplicar UTMs</>
                }
              </button>
            </div>
          )}

          {/* Verification hint */}
          {ads.length > 0 && (
            <p className="mt-4 text-[10px] text-[var(--color-ink-3)]">
              Usa el botón <Search size={10} className="inline" /> en cada anuncio para confirmar el estado real en Meta antes o después de aplicar.
              En Meta Ads Manager, los url_tags aparecen en Editar anuncio → URL del sitio web → Parámetros URL.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
