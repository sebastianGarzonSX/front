'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import type {
  MetaAccount, MetaCampaign, OverviewTotals, OverviewResponse,
  TopAd, CountryRow, Launch, RecommendationsResponse,
  ProjectionData, HotmartSale, SalesTotals, UtmRow,
  Announcement, AdminUser, Milestone, DatePreset,
} from '@/types/adsmanager'

// ── Constants ─────────────────────────────────────────────────────────────────

const MILESTONES: Milestone[] = [
  { amount: 1000,    label: '$1K',   emoji: '🌱', badge: 'Semilla',     color: '#06d6a0' },
  { amount: 5000,    label: '$5K',   emoji: '🌿', badge: 'Brote',       color: '#34d399' },
  { amount: 10000,   label: '$10K',  emoji: '🌲', badge: 'Árbol',       color: '#10b981' },
  { amount: 25000,   label: '$25K',  emoji: '🔥', badge: 'Llama',       color: '#f97316' },
  { amount: 50000,   label: '$50K',  emoji: '⚡', badge: 'Relámpago',   color: '#fbbf24' },
  { amount: 100000,  label: '$100K', emoji: '💎', badge: 'Diamante',    color: '#60a5fa' },
  { amount: 250000,  label: '$250K', emoji: '🚀', badge: 'Cohete',      color: '#a78bfa' },
  { amount: 500000,  label: '$500K', emoji: '👑', badge: 'Corona',      color: '#f59e0b' },
  { amount: 1000000, label: '$1M',   emoji: '🏆', badge: 'Leyenda',     color: '#ec4899' },
]

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today',      label: 'Hoy'          },
  { value: 'yesterday',  label: 'Ayer'          },
  { value: 'last_7d',    label: 'Últimos 7d'    },
  { value: 'last_14d',   label: 'Últimos 14d'   },
  { value: 'last_30d',   label: 'Últimos 30d'   },
  { value: 'last_90d',   label: 'Últimos 90d'   },
  { value: 'this_month', label: 'Este mes'      },
  { value: 'last_month', label: 'Mes anterior'  },
  { value: 'custom',     label: 'Personalizado' },
]

type Module = 'dashboard' | 'launches' | 'ventas' | 'config'

const MODULES: Record<Module, { label: string; tabs: string[] }> = {
  dashboard: { label: 'Dashboard',      tabs: ['Campañas', 'Top Ads', 'Países', 'Informes'] },
  launches:  { label: 'Lanzamientos',   tabs: ['Lanzamientos', 'Recomendaciones', 'Proyecciones'] },
  ventas:    { label: 'Ventas',          tabs: ['Ventas', 'UTM Tracking', 'Tutoriales'] },
  config:    { label: 'Configuración',   tabs: ['Perfil', 'Meta Ads', 'Hotmart', 'Notificaciones'] },
}

// ── Formatting helpers ────────────────────────────────────────────────────────

const usd   = (n: number) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num   = (n: number) => (n ?? 0).toLocaleString('en-US')
const pct   = (n: number) => (n ?? 0).toFixed(2) + '%'
const roas  = (n: number) => (n ?? 0).toFixed(2) + 'x'

function deltaClass(now: number, prev: number) {
  if (!prev) return ''
  return now >= prev ? 'text-green-400' : 'text-red-400'
}
function deltaLabel(now: number, prev: number) {
  if (!prev) return null
  const p = ((now - prev) / prev * 100).toFixed(1)
  return (now >= prev ? '↑' : '↓') + Math.abs(parseFloat(p)) + '%'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, delta, sub }: { label: string; value: string; delta?: string | null; sub?: string }) {
  return (
    <div className="bg-[#0e1228] border border-[rgba(255,255,255,.07)] rounded-xl p-4 flex flex-col gap-1">
      <div className="text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {delta && <div className={`text-xs font-semibold ${delta.startsWith('↑') ? 'text-green-400' : 'text-red-400'}`}>{delta}</div>}
      {sub && <div className="text-xs text-[#8892b0]">{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:   'bg-green-500/20 text-green-400',
    PAUSED:   'bg-yellow-500/20 text-yellow-400',
    ARCHIVED: 'bg-gray-500/20 text-gray-400',
    DELETED:  'bg-red-500/20 text-red-400',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${map[status?.toUpperCase()] ?? 'bg-gray-500/20 text-gray-400'}`}>{status}</span>
}

function Spinner() {
  return <div className="w-8 h-8 border-2 border-[#4f8ef7] border-t-transparent rounded-full animate-spin mx-auto" />
}

// ── Money Rain ────────────────────────────────────────────────────────────────

function moneyRain() {
  const emojis = ['💵','💸','💰','🤑','💵','💸','💵']
  for (let i = 0; i < 18; i++) {
    setTimeout(() => {
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;top:-60px;left:${5+Math.random()*90}%;font-size:${28+Math.random()*24}px;z-index:9999;pointer-events:none;animation:moneyFall ${1.6+Math.random()*1.4}s ease-in forwards`
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)]
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 3100)
    }, i * 120)
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

interface AdsManagerProps {
  userRole: string
  userName: string
  userPlan?: string
}

export default function AdsManagerClient({ userRole, userName, userPlan = 'basic' }: AdsManagerProps) {
  // Global state
  const [module, setModule]     = useState<Module>('dashboard')
  const [tab, setTab]           = useState(0)
  const [date, setDate]         = useState<DatePreset>('last_30d')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [account, setAccount]   = useState<string>('')
  const [accounts, setAccounts] = useState<MetaAccount[]>([])
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading]   = useState(false)

  // Dashboard state
  const [overview, setOverview]         = useState<OverviewResponse | null>(null)
  const [topAds, setTopAds]             = useState<TopAd[]>([])
  const [countries, setCountries]       = useState<CountryRow[]>([])
  const [recommendations, setRec]       = useState<RecommendationsResponse | null>(null)
  const [launches, setLaunches]         = useState<Launch[]>([])
  const [projectionData, setProjection] = useState<ProjectionData | null>(null)

  // Campaigns table state
  const [filter, setFilter]       = useState('')
  const [statusFilter, setStatus] = useState('ALL')
  const [sortBy, setSortBy]       = useState('spend')
  const [sortDir, setSortDir]     = useState<'asc'|'desc'>('desc')
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())

  // Projections state
  const [projBudget, setProjBudget]     = useState(1000)
  const [projCPM, setProjCPM]           = useState(0)
  const [projCTR, setProjCTR]           = useState(0)
  const [projLPConv, setProjLPConv]     = useState(30)
  const [projShowRate, setProjShowRate] = useState(60)
  const [projClose, setProjClose]       = useState(0)
  const [projPrice, setProjPrice]       = useState(0)

  // Sales state
  const [sales, setSales]           = useState<HotmartSale[]>([])
  const [salesTotals, setSalesTot]  = useState<SalesTotals | null>(null)
  const [salesFilter, setSalesFilter] = useState('')
  const [salesStatus, setSalesStatus] = useState('')
  const [salesLoading, setSalesLoading] = useState(false)

  // UTM state
  const [utmRows, setUtmRows]         = useState<UtmRow[]>([])
  const [utmGroup, setUtmGroup]       = useState<'campaign'|'content'>('campaign')
  const [utmKpis, setUtmKpis]         = useState({ sales: 0, revenue: 0, campaigns: 0, ticket: 0 })
  const [utmBaseUrl, setUtmBaseUrl]   = useState('')
  const [utmCampaigns, setUtmCampaigns] = useState<string[]>([''])
  const [utmLoading, setUtmLoading]   = useState(false)

  // Config state
  const [metaToken, setMetaToken]     = useState('')
  const [metaAccountId, setMetaAccountId] = useState('')
  const [displayName, setDisplayName] = useState(userName)
  const [hotmartToken, setHotmartToken] = useState('')
  const [hotmartEmail, setHotmartEmail] = useState('')
  const [pushCount, setPushCount]     = useState(0)
  const [pushMsg, setPushMsg]         = useState('')
  const [configMsg, setConfigMsg]     = useState('')

  // Admin state
  const [adminUsers, setAdminUsers]       = useState<AdminUser[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [allAnnouncements, setAllAnn]     = useState<Announcement[]>([])
  const [dismissed, setDismissed]         = useState<Set<string>>(new Set())
  const [annMsg, setAnnMsg]               = useState('')
  const [annType, setAnnType]             = useState('info')
  const [annEmoji, setAnnEmoji]           = useState('📢')
  const [adminSaleSearch, setAdminSaleSearch] = useState({ txid: '', buyer: '' })
  const [adminSaleResults, setAdminSaleResults] = useState<any[]>([])
  const [manualSale, setManualSale]       = useState({ txid: '', commission: '', product: '', buyer: '', saleDate: '', userId: '' })
  const [manualMsg, setManualMsg]         = useState('')

  // Tutorials state
  const [tutorialVideos, setTutorialVideos] = useState<Record<string, string>>({})
  const [tutorialEdit, setTutorialEdit]     = useState<Record<string, string>>({})

  // Reports state
  const [reportDays, setReportDays] = useState(7)
  const [reportFrom, setReportFrom] = useState('')
  const [reportTo, setReportTo]     = useState('')
  const [reportData, setReportData] = useState<{
    revenue: number; spend: number; roas: number; sales: number; ticket: number
    commissions: number[]; salesCnt: number[]; labels: string[]
    adMap: Array<{ name: string; commission: number; sales: number; pct: number }>
    campMap: Array<{ name: string; ads: number; commission: number; sales: number }>
  } | null>(null)

  // Milestone state
  const [celebrateMilestone, setCelebrateMilestone] = useState<Milestone | null>(null)

  // ── Load accounts on mount ──────────────────────────────────────────────────
  useEffect(() => {
    loadAccounts()
    loadAnnouncements()
  }, [])

  async function loadAccounts() {
    try {
      const res  = await apiFetch('/api/adsmanager/accounts')
      const data = await res.json()
      if (!res.ok) {
        console.warn('[loadAccounts]', data.error)
        setAccounts([])
        return
      }
      const list = (Array.isArray(data) ? data : data.accounts ?? []) as MetaAccount[]
      setAccounts(list)
      if (list.length > 0) {
        setAccount(list[0].id)
        setCurrency(list[0].currency)
      }
    } catch { /* silent */ }
  }

  async function loadAnnouncements() {
    try {
      const res  = await apiFetch('/api/announcements')
      const data = await res.json() as Announcement[]
      setAnnouncements(data.filter(a => !dismissed.has(a.id)))
    } catch { /* silent */ }
  }

  // ── API helpers ────────────────────────────────────────────────────────────
  const dateParams = useCallback(() => {
    if (date === 'custom' && dateFrom && dateTo) return `since=${dateFrom}&until=${dateTo}`
    return `date=${date}`
  }, [date, dateFrom, dateTo])

  const accountParam = `account=${account}`

  // ── Load section data ──────────────────────────────────────────────────────

  async function loadOverview() {
    if (!account) return
    setLoading(true)
    try {
      const res  = await apiFetch(`/api/adsmanager/overview?${accountParam}&${dateParams()}&compare=1`)
      const data = await res.json() as OverviewResponse
      setOverview(data)
    } catch { /* silent */ }
    setLoading(false)
  }

  async function loadTopAds() {
    if (!account) return
    try {
      const res  = await apiFetch(`/api/adsmanager/top-ads?${accountParam}&${dateParams()}&limit=5`)
      const data = await res.json()
      setTopAds(data.ads ?? [])
    } catch { /* silent */ }
  }

  async function loadCountries() {
    if (!account) return
    try {
      const res  = await apiFetch(`/api/adsmanager/countries?${accountParam}&${dateParams()}`)
      const data = await res.json()
      setCountries(data.countries ?? [])
    } catch { /* silent */ }
  }

  async function loadLaunches() {
    if (!account) return
    try {
      const res  = await apiFetch(`/api/adsmanager/launches?${accountParam}&${dateParams()}`)
      const data = await res.json()
      setLaunches(data.launches ?? [])
    } catch { /* silent */ }
  }

  async function loadRecommendations() {
    if (!account) return
    try {
      const res  = await apiFetch(`/api/adsmanager/recommendations?${accountParam}&${dateParams()}`)
      const data = await res.json() as RecommendationsResponse
      setRec(data)
    } catch { /* silent */ }
  }

  async function loadProjections() {
    if (!account) return
    try {
      const res  = await apiFetch(`/api/adsmanager/projections?${accountParam}&${dateParams()}`)
      const data = await res.json() as ProjectionData
      setProjection(data)
      if (data.cpm > 0)         setProjCPM(parseFloat(data.cpm.toFixed(2)))
      if (data.ctr > 0)         setProjCTR(parseFloat(data.ctr.toFixed(2)))
      if (data.close_rate > 0)  setProjClose(parseFloat(data.close_rate.toFixed(1)))
      if (data.avg_ticket > 0)  setProjPrice(parseFloat(data.avg_ticket.toFixed(2)))
    } catch { /* silent */ }
  }

  async function loadSales() {
    setSalesLoading(true)
    try {
      const tz = new Date().getTimezoneOffset() / -60
      const res = await apiFetch(`/api/hotmart/sales?${dateParams()}&tz=${tz}`)
      const data = await res.json()
      setSales(data.sales ?? [])
      setSalesTot(data.totals ?? null)
      // Check milestones
      const total = data.totals?.net ?? 0
      const reached = MILESTONES.filter(m => total >= m.amount)
      if (reached.length > 0) {
        const last = reached[reached.length - 1]
        const key  = `milestone_${last.amount}`
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1')
          moneyRain()
          setCelebrateMilestone(last)
        }
      }
    } catch { /* silent */ }
    setSalesLoading(false)
  }

  async function loadUtmStats() {
    setUtmLoading(true)
    try {
      const tz = new Date().getTimezoneOffset() / -60
      const res = await apiFetch(`/api/utm/stats?group=${utmGroup}&${dateParams()}&tz=${tz}`)
      const data = await res.json()
      const rows    = (data.rows ?? []) as UtmRow[]
      const tracked = rows.filter(r => r.label !== '(sin tracking)')
      const totalSales   = tracked.reduce((s, r) => s + r.sales, 0)
      const totalRevenue = tracked.reduce((s, r) => s + r.revenue, 0)
      setUtmRows(rows)
      setUtmKpis({
        sales:     totalSales,
        revenue:   totalRevenue,
        campaigns: tracked.length,
        ticket:    totalSales > 0 ? totalRevenue / totalSales : 0,
      })
    } catch { /* silent */ }
    setUtmLoading(false)
  }

  async function loadAdminData() {
    try {
      const [uRes, aRes] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/announcements'),
      ])
      setAdminUsers(await uRes.json())
      setAllAnn(await aRes.json())
    } catch { /* silent */ }
  }

  async function loadTutorials() {
    try {
      const res  = await apiFetch('/api/tutorials')
      const data = await res.json()
      setTutorialVideos(data.videos ?? {})
      setTutorialEdit(data.videos ?? {})
    } catch { /* silent */ }
  }

  async function loadReports() {
    const now   = new Date()
    const today = now.toISOString().slice(0, 10)
    const from  = reportFrom || new Date(now.getTime() - (reportDays - 1) * 86400000).toISOString().slice(0, 10)
    const to    = reportTo   || today
    const tz    = new Date().getTimezoneOffset() / -60

    try {
      const [sRes, oRes] = await Promise.allSettled([
        apiFetch(`/api/hotmart/sales?since=${from}&until=${to}&tz=${tz}`),
        account ? apiFetch(`/api/adsmanager/overview?${accountParam}&since=${from}&until=${to}`) : Promise.resolve(null),
      ])

      const salesData  = sRes.status === 'fulfilled' ? await (sRes.value as Response).json() : { sales: [], totals: {} }
      const overData   = oRes.status === 'fulfilled' && oRes.value ? await (oRes.value as Response).json() : { totals: {} }

      const approved   = (salesData.sales ?? []).filter((s: HotmartSale) => s.status === 'approved' || s.status === 'complete')
      const commission = approved.reduce((s: number, x: HotmartSale) => s + (x.commission || 0), 0)
      const spend      = overData.totals?.spend ?? 0

      // Build day map
      const dayMap: Record<string, { commission: number; sales: number }> = {}
      const d   = new Date(from + 'T12:00:00')
      const end = new Date(to   + 'T12:00:00')
      while (d <= end) {
        dayMap[d.toISOString().slice(0, 10)] = { commission: 0, sales: 0 }
        d.setDate(d.getDate() + 1)
      }
      approved.forEach((s: HotmartSale) => {
        const day = s.sale_date?.slice(0, 10)
        if (day && dayMap[day]) {
          dayMap[day].commission += s.commission || 0
          dayMap[day].sales++
        }
      })

      const labels      = Object.keys(dayMap).map(d => d.slice(5))
      const commissions = Object.values(dayMap).map(v => v.commission)
      const salesCnt    = Object.values(dayMap).map(v => v.sales)

      // UTM attribution
      const adMap: Record<string, { commission: number; sales: number; campaign: string }> = {}
      const campMap: Record<string, { commission: number; sales: number; ads: Set<string> }> = {}

      approved.forEach((s: HotmartSale) => {
        const ak = s.utm_campaign || '(Sin UTM)'
        const ck = s.utm_content  || '(Sin campaña)'
        if (!adMap[ak]) adMap[ak] = { commission: 0, sales: 0, campaign: ck }
        adMap[ak].commission += s.commission || 0
        adMap[ak].sales++
        if (!campMap[ck]) campMap[ck] = { commission: 0, sales: 0, ads: new Set() }
        campMap[ck].commission += s.commission || 0
        campMap[ck].sales++
        campMap[ck].ads.add(ak)
      })

      const totalComm = approved.reduce((s: number, x: HotmartSale) => s + (x.commission || 0), 0)

      setReportData({
        revenue:     commission,
        spend,
        roas:        spend > 0 ? commission / spend : 0,
        sales:       approved.length,
        ticket:      approved.length > 0 ? commission / approved.length : 0,
        commissions,
        salesCnt,
        labels,
        adMap:   Object.entries(adMap).sort((a,b) => b[1].commission - a[1].commission)
          .map(([name, v]) => ({ name, ...v, pct: totalComm > 0 ? v.commission / totalComm * 100 : 0 })),
        campMap: Object.entries(campMap).sort((a,b) => b[1].commission - a[1].commission)
          .map(([name, v]) => ({ name, commission: v.commission, sales: v.sales, ads: v.ads.size })),
      })
    } catch { /* silent */ }
  }

  // ── Module/Tab change handlers ─────────────────────────────────────────────

  useEffect(() => {
    if (module === 'dashboard') {
      if (tab === 0) loadOverview()
      if (tab === 1) loadTopAds()
      if (tab === 2) loadCountries()
      if (tab === 3) loadReports()
    }
    if (module === 'launches') {
      if (tab === 0) loadLaunches()
      if (tab === 1) loadRecommendations()
      if (tab === 2) loadProjections()
    }
    if (module === 'ventas') {
      if (tab === 0) loadSales()
      if (tab === 1) { loadUtmStats() }
      if (tab === 2) loadTutorials()
    }
    if (module === 'config') {
      if (tab === 4 && userRole === 'admin') loadAdminData()
    }
  }, [module, tab, account, date, dateFrom, dateTo])

  useEffect(() => {
    if (module === 'ventas' && tab === 1) loadUtmStats()
  }, [utmGroup])

  // ── Campaign actions ───────────────────────────────────────────────────────

  async function toggleCampaignStatus(id: string, currentStatus: string) {
    const isActive = currentStatus?.toUpperCase() === 'ACTIVE'
    const endpoint = isActive ? '/api/adsmanager/pause' : '/api/adsmanager/activate'
    await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ id }) })
    loadOverview()
  }

  async function bulkAction(action: 'pause' | 'activate') {
    if (!selected.size) return
    await apiFetch('/api/adsmanager/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ ids: [...selected], action }),
    })
    setSelected(new Set())
    loadOverview()
  }

  // ── Config actions ─────────────────────────────────────────────────────────

  async function saveMetaToken() {
    setConfigMsg('Guardando...')
    try {
      const res = await apiFetch('/api/adsmanager/save-token', {
        method: 'POST',
        body: JSON.stringify({ token: metaToken, account_id: metaAccountId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setConfigMsg(`✗ ${data.error || 'Error al guardar token'}`)
        return
      }
      setConfigMsg('✓ Token guardado correctamente')
      loadAccounts()
    } catch { setConfigMsg('Error de conexión al guardar') }
  }

  async function saveProfile() {
    setConfigMsg('Guardando...')
    try {
      await apiFetch('/api/adsmanager/save-name', { method: 'POST', body: JSON.stringify({ name: displayName }) })
      setConfigMsg('✓ Perfil actualizado')
    } catch { setConfigMsg('Error al guardar') }
  }

  async function saveHotmart() {
    setConfigMsg('Guardando...')
    try {
      await apiFetch('/api/hotmart/save-token', {
        method: 'POST',
        body: JSON.stringify({ token: hotmartToken, email: hotmartEmail }),
      })
      setConfigMsg('✓ Hotmart configurado correctamente')
    } catch { setConfigMsg('Error al guardar') }
  }

  async function activatePush() {
    setPushMsg('Activando...')
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushMsg('Tu navegador no soporta notificaciones push'); return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      const cfgRes = await apiFetch('/api/adsmanager/config')
      const cfg = await cfgRes.json()
      if (!cfg.vapidPublicKey) { setPushMsg('Push no configurado en el servidor'); return }
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setPushMsg('Permiso denegado'); return }
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublicKey) as unknown as BufferSource })
      await apiFetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub }) })
      setPushMsg('✓ Notificaciones activadas correctamente')
      loadPushStatus()
    } catch (e) {
      setPushMsg('Error: ' + (e instanceof Error ? e.message : 'desconocido'))
    }
  }

  async function testPush() {
    setPushMsg('Enviando prueba...')
    try {
      const res = await apiFetch('/api/push/test', { method: 'POST' })
      const d   = await res.json()
      setPushMsg(d.error ? 'Error: ' + d.error : '✓ Notificación enviada — revisa tu teléfono')
    } catch { setPushMsg('Error al enviar prueba') }
  }

  async function loadPushStatus() {
    try {
      const res = await apiFetch('/api/push/status')
      const d   = await res.json()
      setPushCount(d.subscriptions ?? 0)
    } catch { /* silent */ }
  }

  async function saveTutorials() {
    try {
      await apiFetch('/api/admin/tutorials', { method: 'POST', body: JSON.stringify({ videos: tutorialEdit }) })
      setTutorialVideos({ ...tutorialEdit })
    } catch { /* silent */ }
  }

  async function createAnnouncement() {
    if (!annMsg.trim()) return
    try {
      await apiFetch('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({ message: annMsg, type: annType, emoji: annEmoji }),
      })
      setAnnMsg('')
      loadAdminData()
      loadAnnouncements()
    } catch { /* silent */ }
  }

  async function toggleAnnouncement(id: string, active: boolean) {
    await apiFetch('/api/admin/announcements/toggle', { method: 'POST', body: JSON.stringify({ id, active }) })
    loadAdminData()
    loadAnnouncements()
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('¿Eliminar este banner?')) return
    await apiFetch('/api/admin/announcements', { method: 'POST', body: JSON.stringify({ id, _delete: true }) })
    loadAdminData()
    loadAnnouncements()
  }

  async function searchAdminSale() {
    if (!adminSaleSearch.txid && !adminSaleSearch.buyer) return
    try {
      const params = new URLSearchParams()
      if (adminSaleSearch.txid)  params.set('txid',  adminSaleSearch.txid)
      if (adminSaleSearch.buyer) params.set('buyer', adminSaleSearch.buyer)
      const res  = await apiFetch('/api/admin/find-sale?' + params)
      const data = await res.json()
      setAdminSaleResults(data.sales ?? [])
    } catch { /* silent */ }
  }

  async function submitManualSale() {
    if (!manualSale.txid || !manualSale.commission || !manualSale.userId) {
      setManualMsg('Transaction ID, comisión y usuario son requeridos'); return
    }
    try {
      setManualMsg('Guardando...')
      await apiFetch('/api/admin/manual-sale', {
        method: 'POST',
        body: JSON.stringify({
          txid:       manualSale.txid,
          userId:     manualSale.userId,
          product:    manualSale.product,
          buyer:      manualSale.buyer,
          commission: parseFloat(manualSale.commission),
          saleDate:   manualSale.saleDate,
        }),
      })
      setManualMsg('✓ Venta registrada correctamente')
      setManualSale({ txid: '', commission: '', product: '', buyer: '', saleDate: '', userId: '' })
    } catch (e) {
      setManualMsg('Error: ' + (e instanceof Error ? e.message : 'desconocido'))
    }
  }

  // ── Projection calculator ──────────────────────────────────────────────────

  function calcScenario(factor: number) {
    const budget      = projBudget * factor
    const cpm         = (projCPM   || 10) * factor
    const ctr         = (projCTR   || 1)  * factor
    const lpConv      = projLPConv  / 100
    const showRate    = projShowRate / 100
    const closeRate   = (projClose || 10) / 100
    const price       = projPrice  || 100

    const impressions = budget / (cpm / 1000)
    const clicks      = impressions * (ctr / 100)
    const leads       = clicks * lpConv
    const showUps     = leads * showRate
    const sales       = showUps * closeRate
    const revenue     = sales * price
    const roas        = budget > 0 ? revenue / budget : 0
    const cpa         = sales > 0 ? budget / sales : 0

    return { budget, impressions: Math.round(impressions), clicks: Math.round(clicks), leads: Math.round(leads), showUps: Math.round(showUps), sales: Math.round(sales), revenue, roas, cpa }
  }

  // ── Filtered campaigns ────────────────────────────────────────────────────

  const filteredCampaigns = (overview?.campaigns ?? [])
    .filter(c => {
      const matchText   = !filter || c.campaign_name.toLowerCase().includes(filter.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || c.status?.toUpperCase() === statusFilter
      return matchText && matchStatus
    })
    .sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? 0
      const bVal = (b as any)[sortBy] ?? 0
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

  const filteredSales = sales.filter(s => {
    const q = salesFilter.toLowerCase()
    const matchText   = !q || (s.buyer_name?.toLowerCase().includes(q) || s.buyer_email?.toLowerCase().includes(q) || s.product_name?.toLowerCase().includes(q))
    const matchStatus = !salesStatus || s.status === salesStatus
    return matchText && matchStatus
  })

  // ── UTM URL builder ────────────────────────────────────────────────────────

  function buildUtmUrl(name: string) {
    if (!utmBaseUrl || !name) return '—'
    try {
      const url = new URL(utmBaseUrl)
      url.searchParams.set('src', name.replace(/\s+/g, '_'))
      return url.toString()
    } catch {
      return utmBaseUrl + (utmBaseUrl.includes('?') ? '&' : '?') + 'src=' + name.replace(/\s+/g, '_')
    }
  }

  function copyToClipboard(text: string, btn: HTMLButtonElement) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent
      btn.textContent = '✓'
      setTimeout(() => { btn.textContent = orig }, 2000)
    })
  }

  // ── Export CSV ────────────────────────────────────────────────────────────

  function exportCSV() {
    const cols = ['Campaña','Estado','Gasto','Revenue','ROAS','Compras','Leads','CPA','CPL','CTR','Impresiones','Clics']
    const rows = filteredCampaigns.map(c => [
      `"${c.campaign_name}"`, c.status, c.spend.toFixed(2), c.revenue.toFixed(2),
      c.roas.toFixed(2), c.purchases, c.leads, c.cpa.toFixed(2), c.cpl.toFixed(2),
      c.ctr.toFixed(2), c.impressions, c.clicks,
    ])
    const csv  = [cols, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `campañas_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Sort handler ──────────────────────────────────────────────────────────

  function handleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  // ── Module tabs with admin tab for config ──────────────────────────────────

  const configTabs = userRole === 'admin'
    ? [...MODULES.config.tabs, 'Admin']
    : MODULES.config.tabs

  const currentTabs = module === 'config' ? configTabs : MODULES[module].tabs

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#060818', minHeight: '100vh', color: '#f0f4ff', fontFamily: "'Inter', sans-serif" }}>
      {/* Money rain animation CSS */}
      <style>{`
        @keyframes moneyFall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
      `}</style>

      {/* Announcement banners */}
      {announcements.filter(a => !dismissed.has(a.id)).length > 0 && (
        <div style={{ padding: '12px 24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {announcements.filter(a => !dismissed.has(a.id)).map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderRadius: 12, border: '1px solid rgba(255,255,255,.08)',
              background: a.type === 'warning' ? 'rgba(251,191,36,.08)'
                : a.type === 'success'  ? 'rgba(6,214,160,.08)'
                : a.type === 'feature'  ? 'rgba(192,132,252,.08)'
                : 'rgba(79,142,247,.08)',
            }}>
              <span style={{ fontSize: 20 }}>{a.emoji}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{a.message}</span>
              <button onClick={() => { setDismissed(p => new Set([...p, a.id])) }}
                style={{ background: 'none', border: 'none', color: '#8892b0', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,.06)', flexWrap: 'wrap',
      }}>
        {/* Account select */}
        <select
          value={account}
          onChange={e => { setAccount(e.target.value); setCurrency(accounts.find(a => a.id === e.target.value)?.currency ?? 'USD') }}
          style={selectStyle}
        >
          {accounts.length === 0
            ? <option>— Configura tu token Meta →</option>
            : accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)
          }
        </select>

        {/* Date select */}
        <select value={date} onChange={e => setDate(e.target.value as DatePreset)} style={selectStyle}>
          {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        {date === 'custom' && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            <span style={{ color: '#8892b0' }}>–</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
          </>
        )}

        <button
          onClick={() => {
            if (module === 'dashboard') { if (tab===0) loadOverview(); if (tab===1) loadTopAds(); if (tab===2) loadCountries(); if (tab===3) loadReports() }
            if (module === 'launches') { if (tab===0) loadLaunches(); if (tab===1) loadRecommendations(); if (tab===2) loadProjections() }
            if (module === 'ventas')   { if (tab===0) loadSales(); if (tab===1) loadUtmStats() }
          }}
          style={{ ...btnStyle, background: 'rgba(79,142,247,.2)', borderColor: 'rgba(79,142,247,.4)', color: '#4f8ef7' }}
        >
          ↻ Actualizar
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#8892b0' }}>{userName}</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(79,142,247,.2)', color: '#4f8ef7', fontWeight: 700, textTransform: 'uppercase' }}>
            {userPlan}
          </span>
        </div>
      </div>

      {/* ── Module nav ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, padding: '12px 24px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        {(Object.keys(MODULES) as Module[]).map(m => (
          <button
            key={m}
            onClick={() => { setModule(m); setTab(0) }}
            style={{
              ...tabBtnStyle,
              background:   module === m ? 'rgba(79,142,247,.2)' : 'transparent',
              color:        module === m ? '#4f8ef7'              : '#8892b0',
              borderBottom: module === m ? '2px solid #4f8ef7'    : '2px solid transparent',
            }}
          >
            {MODULES[m].label}
          </button>
        ))}
      </div>

      {/* ── Tab nav ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 24px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
        {currentTabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              ...tabBtnStyle,
              fontSize: 12,
              color:        tab === i ? '#f0f4ff' : '#8892b0',
              borderBottom: tab === i ? '2px solid rgba(79,142,247,.6)' : '2px solid transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div style={{ padding: 24 }}>

        {/* ── Dashboard: Campañas ────────────────────────────────────────── */}
        {module === 'dashboard' && tab === 0 && (
          <div>
            {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>}

            {/* KPIs */}
            {overview?.totals && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Gasto',       value: usd(overview.totals.spend),       prev: overview.prevTotals?.spend },
                  { label: 'Revenue',     value: usd(overview.totals.revenue),     prev: null },
                  { label: 'ROAS',        value: roas(overview.totals.roas),       prev: null },
                  { label: 'Compras',     value: num(overview.totals.purchases),   prev: null },
                  { label: 'Registros',   value: num(overview.totals.leads),       prev: null },
                  { label: 'CPA',         value: usd(overview.totals.cpa),         prev: null },
                  { label: 'CTR',         value: pct(overview.totals.ctr),         prev: overview.prevTotals?.ctr },
                ].map(({ label, value, prev }) => (
                  <KPICard
                    key={label}
                    label={label}
                    value={value}
                    delta={prev != null ? (deltaLabel(parseFloat(value), prev) ?? undefined) : undefined}
                  />
                ))}
              </div>
            )}

            {/* Campaigns table controls */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Buscar campaña..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 200px' }}
              />
              <select value={statusFilter} onChange={e => setStatus(e.target.value)} style={selectStyle}>
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activas</option>
                <option value="PAUSED">Pausadas</option>
              </select>
              {selected.size > 0 && (
                <>
                  <button onClick={() => bulkAction('pause')}    style={{ ...btnStyle, background: 'rgba(251,191,36,.15)', borderColor: 'rgba(251,191,36,.4)', color: '#fbbf24' }}>⏸ Pausar ({selected.size})</button>
                  <button onClick={() => bulkAction('activate')} style={{ ...btnStyle, background: 'rgba(6,214,160,.15)',  borderColor: 'rgba(6,214,160,.4)',  color: '#06d6a0' }}>▶ Activar ({selected.size})</button>
                </>
              )}
              <button onClick={exportCSV} style={{ ...btnStyle, marginLeft: 'auto' }}>⬇ CSV</button>
            </div>

            {/* Campaigns table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#8892b0', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'left' }}>
                      <input type="checkbox"
                        checked={selected.size === filteredCampaigns.length && filteredCampaigns.length > 0}
                        onChange={e => setSelected(e.target.checked ? new Set(filteredCampaigns.map(c => c.campaign_id)) : new Set())}
                      />
                    </th>
                    {[
                      ['campaign_name','Campaña'],['status','Estado'],['spend','Gasto'],['revenue','Revenue'],
                      ['roas','ROAS'],['purchases','Compras'],['leads','Leads'],['cpa','CPA'],['cpl','CPL'],
                      ['ctr','CTR'],['impressions','Impresiones'],
                    ].map(([col, lbl]) => (
                      <th key={col} onClick={() => handleSort(col)}
                        style={{ padding: '8px 6px', textAlign: col === 'campaign_name' ? 'left' : 'right', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {lbl} {sortBy === col ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                      </th>
                    ))}
                    <th style={{ padding: '8px 6px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((c, idx) => (
                    <tr key={`${c.campaign_id}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '8px 6px' }}>
                        <input type="checkbox"
                          checked={selected.has(c.campaign_id)}
                          onChange={e => {
                            const s = new Set(selected)
                            if (e.target.checked) s.add(c.campaign_id); else s.delete(c.campaign_id)
                            setSelected(s)
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px 6px', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.campaign_name}>
                        {c.campaign_name}
                      </td>
                      <td style={{ padding: '8px 6px' }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600 }}>{usd(c.spend)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: '#06d6a0' }}>{usd(c.revenue)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: c.roas >= 2 ? '#06d6a0' : c.roas >= 1 ? '#fbbf24' : '#f87171' }}>{roas(c.roas)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{num(c.purchases)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{num(c.leads)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{usd(c.cpa)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{usd(c.cpl)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right' }}>{pct(c.ctr)}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', color: '#8892b0' }}>{num(c.impressions)}</td>
                      <td style={{ padding: '8px 6px' }}>
                        <button
                          onClick={() => toggleCampaignStatus(c.campaign_id, c.status)}
                          style={{ ...btnStyle, fontSize: 11, padding: '4px 10px',
                            background: c.status?.toUpperCase() === 'ACTIVE' ? 'rgba(251,191,36,.15)' : 'rgba(6,214,160,.15)',
                            color: c.status?.toUpperCase() === 'ACTIVE' ? '#fbbf24' : '#06d6a0',
                          }}
                        >
                          {c.status?.toUpperCase() === 'ACTIVE' ? '⏸' : '▶'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredCampaigns.length === 0 && !loading && (
                    <tr><td colSpan={13} style={{ padding: '40px', textAlign: 'center', color: '#8892b0' }}>
                      {account ? 'No hay datos para este período' : 'Configura tu token Meta en Configuración'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Dashboard: Top Ads ─────────────────────────────────────────── */}
        {module === 'dashboard' && tab === 1 && (
          <div>
            <h2 style={sectionTitle}>Top Anuncios por Gasto</h2>
            {topAds.length === 0
              ? <EmptyState icon="🎯" msg="No hay datos de anuncios para este período" />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                  {topAds.map((ad, i) => (
                    <div key={`${ad.ad_id}-${i}`} style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, background: ['#ffd166','#a8dadc','#e8f5e9','#ffe5b4','#fce4ec'][i] ?? '#334155', color: '#000', padding: '2px 8px', borderRadius: 20 }}>#{i+1}</span>
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ad.ad_name as string}>{ad.ad_name}</span>
                      </div>
                      {ad.thumbnail_url && (
                        <img src={ad.thumbnail_url as string} alt="preview" style={{ width: '100%', borderRadius: 8, marginBottom: 10, objectFit: 'cover', height: 140 }} />
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                        {[['Gasto', usd(ad.spend)],['CTR', pct(ad.ctr)],['CPM', usd(ad.cpm)],['CPA', usd(ad.cpa)],['Compras', num(ad.purchases)],['Leads', num(ad.leads)]].map(([l,v]) => (
                          <div key={l}><span style={{ color: '#8892b0' }}>{l}: </span><span style={{ fontWeight: 600 }}>{v}</span></div>
                        ))}
                      </div>
                      {ad.preview_url && (
                        <a href={ad.preview_url as string} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', marginTop: 10, textAlign: 'center', fontSize: 12, color: '#4f8ef7', textDecoration: 'none' }}>
                          Ver preview →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── Dashboard: Países ──────────────────────────────────────────── */}
        {module === 'dashboard' && tab === 2 && (
          <div>
            <h2 style={sectionTitle}>Rendimiento por País</h2>
            {countries.length === 0
              ? <EmptyState icon="🌍" msg="No hay datos de países para este período" />
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ color: '#8892b0', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                        {['País','Gasto','ROAS','Compras','CPA','CTR','Impresiones'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: h === 'País' ? 'left' : 'right' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {countries.map(c => (
                        <tr key={c.country} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>🌐 {c.country}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>{usd(c.spend)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: c.roas >= 2 ? '#06d6a0' : c.roas >= 1 ? '#fbbf24' : '#f87171' }}>{roas(c.roas)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{num(c.purchases)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{usd(c.cpa)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{pct(c.ctr)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#8892b0' }}>{num(c.impressions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* ── Dashboard: Informes ────────────────────────────────────────── */}
        {module === 'dashboard' && tab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {[7, 14, 30, 90].map(d => (
                <button key={d}
                  onClick={() => { setReportDays(d); setReportFrom(''); setReportTo('') }}
                  style={{ ...btnStyle, background: reportDays === d ? 'rgba(79,142,247,.2)' : 'transparent', color: reportDays === d ? '#4f8ef7' : '#8892b0' }}>
                  {d}d
                </button>
              ))}
              <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} style={inputStyle} />
              <span style={{ color: '#8892b0' }}>–</span>
              <input type="date" value={reportTo}   onChange={e => setReportTo(e.target.value)}   style={inputStyle} />
              <button onClick={loadReports} style={{ ...btnStyle, background: 'rgba(79,142,247,.2)', color: '#4f8ef7' }}>Aplicar</button>
            </div>

            {reportData ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
                  {[
                    { label: 'Revenue', value: usd(reportData.revenue) },
                    { label: 'Gasto Meta', value: usd(reportData.spend) },
                    { label: 'ROAS', value: roas(reportData.roas) },
                    { label: 'Ventas', value: String(reportData.sales) },
                    { label: 'Ticket prom.', value: usd(reportData.ticket) },
                  ].map(k => <KPICard key={k.label} label={k.label} value={k.value} />)}
                </div>

                {/* Attribution by ad */}
                <h3 style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: 12 }}>Atribución por anuncio</h3>
                {reportData.adMap.length === 0
                  ? <p style={{ color: '#8892b0', marginBottom: 24 }}>Sin ventas con UTM tracking en este período</p>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24 }}>
                      <thead>
                        <tr style={{ color: '#8892b0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                          {['Anuncio','Ventas','Revenue','% del total'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Anuncio' ? 'left' : 'right' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.adMap.map((a, idx) => (
                          <tr key={`ad-${a.name}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{a.name}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}>{a.sales}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#06d6a0', fontWeight: 700 }}>{usd(a.commission)}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#8892b0' }}>{a.pct.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                {/* Attribution by campaign */}
                <h3 style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: 12 }}>Atribución por campaña</h3>
                {reportData.campMap.length === 0
                  ? <p style={{ color: '#8892b0' }}>Sin ventas con UTM tracking en este período</p>
                  : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ color: '#8892b0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                          {['Campaña','Anuncios','Ventas','Revenue'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Campaña' ? 'left' : 'right' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.campMap.map((c, idx) => (
                          <tr key={`camp-${c.name}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{c.name}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#8892b0' }}>{c.ads}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}>{c.sales}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', color: '#06d6a0', fontWeight: 700 }}>{usd(c.commission)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: '#8892b0' }}>
                <button onClick={loadReports} style={{ ...btnStyle, background: 'rgba(79,142,247,.2)', color: '#4f8ef7' }}>Cargar informes</button>
              </div>
            )}
          </div>
        )}

        {/* ── Lanzamientos: Lanzamientos ────────────────────────────────── */}
        {module === 'launches' && tab === 0 && (
          <div>
            <h2 style={sectionTitle}>Lanzamientos</h2>
            {launches.length === 0
              ? <EmptyState icon="🚀" msg="No hay lanzamientos en este período" />
              : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                  {launches.map((l, idx) => (
                    <div key={`launch-${l.name}-${idx}`} style={cardStyle}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                        {[['Gasto',usd(l.spend)],['Revenue',usd(l.revenue)],['ROAS',roas(l.roas)],['CPA',usd(l.cpa)],['Leads',num(l.leads)],['Compras',num(l.purchases)],['CTR',pct(l.ctr)],['Días',String(l.days)]].map(([lbl,val]) => (
                          <div key={lbl}><span style={{ color: '#8892b0' }}>{lbl}: </span><span style={{ fontWeight: 600 }}>{val}</span></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── Lanzamientos: Recomendaciones ─────────────────────────────── */}
        {module === 'launches' && tab === 1 && (
          <div>
            <h2 style={sectionTitle}>Recomendaciones</h2>
            {recommendations ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {[
                  { title: '⏸ Pausar', items: recommendations.pause, color: '#f87171', bg: 'rgba(248,113,113,.08)' },
                  { title: '🚀 Escalar', items: recommendations.scale, color: '#06d6a0', bg: 'rgba(6,214,160,.08)' },
                  { title: '🔍 Revisar', items: recommendations.review, color: '#fbbf24', bg: 'rgba(251,191,36,.08)' },
                  { title: '✅ OK', items: recommendations.ok, color: '#4f8ef7', bg: 'rgba(79,142,247,.08)' },
                ].map(({ title, items, color, bg }) => (
                  <div key={title} style={{ ...cardStyle, borderColor: color + '40', background: bg }}>
                    <div style={{ fontWeight: 800, color, marginBottom: 10 }}>{title}</div>
                    {items.length === 0
                      ? <p style={{ color: '#8892b0', fontSize: 12 }}>Sin campañas en esta categoría</p>
                      : items.map((c: any, idx: number) => (
                        <div key={`${c.id}-${idx}`} style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 8, marginTop: 8, fontSize: 12 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                          <div style={{ color: '#8892b0' }}>Gasto: {usd(c.spend)} · ROAS: {roas(c.roas)} · CPA: {usd(c.cpa)}</div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: '#8892b0' }}>
                <button onClick={loadRecommendations} style={{ ...btnStyle, background: 'rgba(79,142,247,.2)', color: '#4f8ef7' }}>Cargar recomendaciones</button>
              </div>
            )}
          </div>
        )}

        {/* ── Lanzamientos: Proyecciones ────────────────────────────────── */}
        {module === 'launches' && tab === 2 && (
          <div>
            <h2 style={sectionTitle}>Calculadora de Proyecciones</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, flexWrap: 'wrap' }}>
              {/* Inputs */}
              <div style={cardStyle}>
                <h3 style={{ color: '#f0f4ff', marginBottom: 16, fontWeight: 700 }}>Parámetros</h3>
                {[
                  { label: 'Presupuesto diario (USD)', val: projBudget, set: setProjBudget, step: 100 },
                  { label: 'CPM (USD)', val: projCPM, set: setProjCPM, step: 0.1 },
                  { label: 'CTR (%)', val: projCTR, set: setProjCTR, step: 0.1 },
                  { label: 'Conv. LP (%)', val: projLPConv, set: setProjLPConv, step: 1 },
                  { label: 'Tasa de show (%)', val: projShowRate, set: setProjShowRate, step: 1 },
                  { label: 'Tasa de cierre (%)', val: projClose, set: setProjClose, step: 1 },
                  { label: 'Precio del producto (USD)', val: projPrice, set: setProjPrice, step: 10 },
                ].map(({ label, val, set, step }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: '#8892b0', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input
                      type="number"
                      value={val}
                      step={step}
                      onChange={e => set(parseFloat(e.target.value) || 0)}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                ))}
              </div>

              {/* Scenarios */}
              <div>
                {[
                  { label: 'Conservador', factor: 0.8, color: '#fbbf24' },
                  { label: 'Realista',    factor: 1.0, color: '#4f8ef7' },
                  { label: 'Optimista',   factor: 1.2, color: '#06d6a0' },
                ].map(({ label, factor, color }) => {
                  const s = calcScenario(factor)
                  return (
                    <div key={label} style={{ ...cardStyle, borderColor: color + '40', marginBottom: 12 }}>
                      <div style={{ fontWeight: 800, color, marginBottom: 10 }}>{label} ({factor}x)</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, fontSize: 12 }}>
                        {[['Presupuesto',usd(s.budget)],['Impresiones',num(s.impressions)],['Clics',num(s.clicks)],['Leads',num(s.leads)],['Show-ups',num(s.showUps)],['Ventas',num(s.sales)],['Revenue',usd(s.revenue)],['ROAS',roas(s.roas)]].map(([l,v]) => (
                          <div key={l}>
                            <div style={{ color: '#8892b0', marginBottom: 2 }}>{l}</div>
                            <div style={{ fontWeight: 700, color: l === 'Revenue' ? color : '#f0f4ff' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Ventas: Ventas ────────────────────────────────────────────── */}
        {module === 'ventas' && tab === 0 && (
          <div>
            {/* Milestones */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {MILESTONES.map(m => {
                const reached = (salesTotals?.net ?? 0) >= m.amount
                return (
                  <div key={m.amount} style={{
                    flexShrink: 0, textAlign: 'center', padding: '8px 12px', borderRadius: 10,
                    border: `1px solid ${reached ? m.color : 'rgba(255,255,255,.08)'}`,
                    background: reached ? m.color + '15' : 'transparent',
                    opacity: reached ? 1 : 0.4,
                    transition: 'all .3s',
                  }}>
                    <div style={{ fontSize: 20 }}>{m.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: reached ? m.color : '#8892b0' }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: '#8892b0' }}>{m.badge}</div>
                  </div>
                )
              })}
            </div>

            {/* KPIs */}
            {salesTotals && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Revenue', value: usd(salesTotals.revenue) },
                  { label: 'Neto', value: usd(salesTotals.net) },
                  { label: 'Ventas', value: String(salesTotals.approved) },
                  { label: 'Ticket prom.', value: usd(salesTotals.avg_ticket) },
                  { label: 'Reembolsos', value: usd(salesTotals.refunds) },
                ].map(k => <KPICard key={k.label} label={k.label} value={k.value} />)}
              </div>
            )}

            {salesLoading && <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <input placeholder="Buscar comprador / producto..."
                value={salesFilter} onChange={e => setSalesFilter(e.target.value)}
                style={{ ...inputStyle, flex: '1 1 200px' }} />
              <select value={salesStatus} onChange={e => setSalesStatus(e.target.value)} style={selectStyle}>
                <option value="">Todos los estados</option>
                <option value="approved">Aprobadas</option>
                <option value="complete">Completadas</option>
                <option value="canceled">Canceladas</option>
                <option value="refunded">Reembolsadas</option>
                <option value="pending">Pendientes</option>
              </select>
            </div>

            {/* Sales table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#8892b0', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                    {['Fecha','Producto','Comprador','Comisión','Estado','Pago'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Comisión' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '8px 10px', color: '#8892b0', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {s.sale_date ? new Date(s.sale_date).toLocaleDateString('es') : '—'}
                      </td>
                      <td style={{ padding: '8px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.product_name ?? ''}>{s.product_name ?? '—'}</td>
                      <td style={{ padding: '8px 10px', color: '#8892b0', fontSize: 12 }}>{s.buyer_name || s.buyer_email || '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#06d6a0' }}>{usd(s.commission || s.amount)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                          background: s.status === 'approved' || s.status === 'complete' ? 'rgba(6,214,160,.2)' : 'rgba(248,113,113,.2)',
                          color: s.status === 'approved' || s.status === 'complete' ? '#06d6a0' : '#f87171',
                        }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: '#8892b0', fontSize: 12 }}>{s.payment_type ?? '—'}</td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && !salesLoading && (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#8892b0' }}>
                      No hay ventas en este período
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Ventas: UTM Tracking ──────────────────────────────────────── */}
        {module === 'ventas' && tab === 1 && (
          <div>
            {/* URL Generator */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🔗 Generador de URLs con tracking</h3>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#8892b0', display: 'block', marginBottom: 4 }}>URL base de Hotmart</label>
                <input
                  type="url" placeholder="https://pay.hotmart.com/..."
                  value={utmBaseUrl} onChange={e => setUtmBaseUrl(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div id="utmCampaignRows" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {utmCampaigns.map((c, i) => {
                  const built = buildUtmUrl(c)
                  return (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text" placeholder="Nombre campaña/anuncio"
                        value={c}
                        onChange={e => { const arr = [...utmCampaigns]; arr[i] = e.target.value; setUtmCampaigns(arr) }}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <code style={{ flex: 2, padding: '7px 10px', background: 'rgba(0,0,0,.35)', border: '1px solid rgba(79,142,247,.2)', borderRadius: 8, fontSize: 11, color: '#a5f3fc', wordBreak: 'break-all', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                        {built}
                      </code>
                      <button onClick={e => {
                        if (built !== '—') navigator.clipboard.writeText(built).then(() => { const btn = e.currentTarget; btn.textContent = '✓'; setTimeout(() => btn.textContent = 'Copiar', 2000) })
                      }} style={{ ...btnStyle, fontSize: 11, padding: '6px 12px', background: 'rgba(79,142,247,.2)', color: '#4f8ef7', whiteSpace: 'nowrap' }}>Copiar</button>
                      <button onClick={() => { const arr = [...utmCampaigns]; arr.splice(i, 1); setUtmCampaigns(arr.length ? arr : ['']) }}
                        style={{ ...btnStyle, fontSize: 11, padding: '6px 8px', background: 'rgba(255,80,80,.1)', color: '#f87171' }}>✕</button>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setUtmCampaigns(p => [...p, ''])}
                style={{ ...btnStyle, background: 'rgba(79,142,247,.15)', color: '#4f8ef7' }}>+ Agregar campaña</button>
            </div>

            {/* UTM Stats */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <span style={{ color: '#8892b0', fontSize: 12 }}>Agrupar por:</span>
              {(['campaign','content'] as const).map(g => (
                <button key={g} onClick={() => setUtmGroup(g)}
                  style={{ ...btnStyle, background: utmGroup === g ? 'rgba(79,142,247,.2)' : 'transparent', color: utmGroup === g ? '#4f8ef7' : '#8892b0', fontSize: 12 }}>
                  {g === 'campaign' ? 'Campaña' : 'Anuncio'}
                </button>
              ))}
            </div>

            {/* UTM KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Ventas',        value: String(utmKpis.sales)   },
                { label: 'Revenue',       value: usd(utmKpis.revenue)    },
                { label: 'Campañas',      value: String(utmKpis.campaigns) },
                { label: 'Ticket prom.', value: usd(utmKpis.ticket)      },
              ].map(k => <KPICard key={k.label} label={k.label} value={k.value} />)}
            </div>

            {utmLoading && <div style={{ textAlign: 'center', padding: 20 }}><Spinner /></div>}

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#8892b0', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>{utmGroup === 'content' ? 'Anuncio' : 'Campaña'}</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Ventas</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Revenue</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Ticket prom.</th>
                </tr>
              </thead>
              <tbody>
                {utmRows.map(r => (
                  <tr key={r.label} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', opacity: r.label === '(sin tracking)' ? 0.45 : 1 }}>
                    <td style={{ padding: '8px 10px', fontWeight: r.label !== '(sin tracking)' ? 600 : 400, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.label === '(sin tracking)' ? <span style={{ color: '#8892b0' }}>Sin tracking</span> : r.label}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: r.sales > 0 ? '#06d6a0' : '#8892b0', fontWeight: r.sales > 0 ? 700 : 400 }}>{r.sales || 0}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: r.revenue > 0 ? '#06d6a0' : '#8892b0' }}>{usd(r.revenue)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#8892b0' }}>{r.sales > 0 ? usd(r.revenue / r.sales) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Ventas: Tutoriales ────────────────────────────────────────── */}
        {module === 'ventas' && tab === 2 && (
          <div>
            <h2 style={sectionTitle}>Tutoriales</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
              {[
                { key: 'intro',  title: '👋 Introducción',          desc: 'Bienvenida y visión general' },
                { key: 'meta',   title: '📊 Configurar Meta Ads',   desc: 'Cómo obtener tu token de Meta' },
                { key: 'hotmart',title: '🔥 Configurar Hotmart',    desc: 'Webhook y Hottok paso a paso' },
                { key: 'notif',  title: '🔔 Notificaciones Push',   desc: 'Alertas de ventas en tiempo real' },
              ].map(s => {
                const url = tutorialVideos[s.key]
                return (
                  <div key={s.key} style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}>
                    <div style={{ aspectRatio: '16/9', background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                      {url ? '▶' : '⏳'}
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: '#8892b0' }}>{url ? s.desc : 'Próximamente'}</div>
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#4f8ef7', textDecoration: 'none' }}>
                          Ver tutorial →
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Config: Perfil ────────────────────────────────────────────── */}
        {module === 'config' && tab === 0 && (
          <div>
            <h2 style={sectionTitle}>Perfil</h2>
            <div style={{ maxWidth: 400 }}>
              <ConfigField label="Nombre de usuario">
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
              </ConfigField>
              <ConfigField label="Plan actual">
                <span style={{ padding: '6px 12px', borderRadius: 6, background: 'rgba(79,142,247,.2)', color: '#4f8ef7', fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>
                  {userPlan}
                </span>
                {userPlan === 'basic' && (
                  <span style={{ marginLeft: 8, fontSize: 12, color: '#8892b0' }}>
                    · <a href="#" style={{ color: '#4f8ef7' }} onClick={e => { e.preventDefault(); alert('Contacta al administrador para actualizar tu plan') }}>Actualizar →</a>
                  </span>
                )}
              </ConfigField>
              <button onClick={saveProfile} style={{ ...btnStyle, background: 'rgba(79,142,247,.2)', color: '#4f8ef7', marginTop: 8 }}>Guardar perfil</button>
              {configMsg && <p style={{ marginTop: 8, fontSize: 12, color: configMsg.startsWith('✓') ? '#06d6a0' : '#f87171' }}>{configMsg}</p>}
            </div>
          </div>
        )}

        {/* ── Config: Meta Ads ─────────────────────────────────────────── */}
        {module === 'config' && tab === 1 && (
          <div>
            <h2 style={sectionTitle}>Conectar Meta Ads</h2>
            <div style={{ ...cardStyle, maxWidth: 600 }}>
              <p style={{ fontSize: 13, color: '#8892b0', marginBottom: 16, lineHeight: 1.6 }}>
                Genera un token de larga duración (60 días) en{' '}
                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#4f8ef7' }}>
                  Meta Graph API Explorer
                </a>{' '}
                con permisos <code>ads_read</code>, <code>ads_management</code>, <code>read_insights</code>.
              </p>
              <ConfigField label="Token de acceso de Meta">
                <input
                  type="password"
                  placeholder="EAABwzLixnjYBO..."
                  value={metaToken}
                  onChange={e => setMetaToken(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </ConfigField>
              <ConfigField label="ID de cuenta publicitaria (opcional)">
                <input
                  placeholder="act_XXXXXXXXXX o XXXXXXXXXX"
                  value={metaAccountId}
                  onChange={e => setMetaAccountId(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </ConfigField>
              <button onClick={saveMetaToken} style={{ ...btnStyle, background: 'rgba(79,142,247,.2)', color: '#4f8ef7', marginTop: 8 }}>
                Guardar y conectar
              </button>
              {configMsg && <p style={{ marginTop: 8, fontSize: 12, color: configMsg.startsWith('✓') ? '#06d6a0' : '#f87171' }}>{configMsg}</p>}

              {/* Meta param for ads */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Parámetro de URL para anuncios de Meta:</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,.3)', borderRadius: 8, fontSize: 11, color: '#a5f3fc' }}>
                    {'{{ad.name}}'}
                  </code>
                  <button onClick={e => copyToClipboard('{{ad.name}}', e.currentTarget)} style={{ ...btnStyle, fontSize: 11 }}>Copiar</button>
                </div>
                <p style={{ fontSize: 11, color: '#8892b0', marginTop: 6 }}>Agrégalo como parámetro <code>src</code> en la URL de destino de tus anuncios de Meta para que se registren en UTM Tracking.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Config: Hotmart ───────────────────────────────────────────── */}
        {module === 'config' && tab === 2 && (
          <div>
            <h2 style={sectionTitle}>Conectar Hotmart</h2>
            <div style={{ ...cardStyle, maxWidth: 600 }}>
              <p style={{ fontSize: 13, color: '#8892b0', marginBottom: 16, lineHeight: 1.6 }}>
                Paso 1: Configura el webhook en{' '}
                <a href="https://hotmart.com/product/tools/webhook" target="_blank" rel="noopener noreferrer" style={{ color: '#f97316' }}>
                  Hotmart → Herramientas → Webhook
                </a>. La URL del webhook es:
              </p>
              <code style={{ display: 'block', padding: '10px 12px', background: 'rgba(0,0,0,.3)', borderRadius: 8, fontSize: 12, color: '#a5f3fc', marginBottom: 16, wordBreak: 'break-all' }}>
                {typeof window !== 'undefined' ? window.location.origin : ''}/webhook/hotmart
              </code>

              <p style={{ fontSize: 13, color: '#8892b0', marginBottom: 12, lineHeight: 1.6 }}>
                Paso 2: Ingresa tu Hottok (token de API de Hotmart) para acceso a datos.
              </p>
              <ConfigField label="Hottok (API token de Hotmart)">
                <input
                  type="password"
                  placeholder="Tu Hottok aquí"
                  value={hotmartToken}
                  onChange={e => setHotmartToken(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </ConfigField>
              <ConfigField label="Email de tu cuenta Hotmart">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={hotmartEmail}
                  onChange={e => setHotmartEmail(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </ConfigField>
              <button onClick={saveHotmart} style={{ ...btnStyle, background: 'rgba(249,115,22,.2)', color: '#f97316', marginTop: 8 }}>
                Guardar configuración Hotmart
              </button>
              {configMsg && <p style={{ marginTop: 8, fontSize: 12, color: configMsg.startsWith('✓') ? '#06d6a0' : '#f87171' }}>{configMsg}</p>}
            </div>
          </div>
        )}

        {/* ── Config: Notificaciones ────────────────────────────────────── */}
        {module === 'config' && tab === 3 && (
          <div>
            <h2 style={sectionTitle}>Notificaciones Push</h2>
            <div style={{ ...cardStyle, maxWidth: 500 }}>
              <p style={{ fontSize: 13, color: '#8892b0', marginBottom: 16, lineHeight: 1.6 }}>
                Activa las notificaciones push para recibir alertas de ventas en tiempo real directamente en tu teléfono o computadora.
              </p>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#8892b0' }}>Suscripciones activas: </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4f8ef7' }}>{pushCount}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={activatePush} style={{ ...btnStyle, background: 'rgba(6,214,160,.2)', color: '#06d6a0' }}>
                  🔄 Activar / Renovar suscripción
                </button>
                <button onClick={() => { loadPushStatus(); setPushMsg('') }}
                  style={{ ...btnStyle, background: 'rgba(79,142,247,.15)', color: '#4f8ef7' }}>
                  Verificar estado
                </button>
                {pushCount > 0 && (
                  <button onClick={testPush} style={{ ...btnStyle, background: 'rgba(155,93,229,.15)', color: '#9b5de5' }}>
                    🧪 Enviar prueba
                  </button>
                )}
              </div>
              {pushMsg && <p style={{ marginTop: 10, fontSize: 12, color: pushMsg.startsWith('✓') ? '#06d6a0' : '#f87171' }}>{pushMsg}</p>}
            </div>
          </div>
        )}

        {/* ── Config: Admin ────────────────────────────────────────────── */}
        {module === 'config' && tab === 4 && userRole === 'admin' && (
          <div>
            <h2 style={sectionTitle}>Panel de Administración</h2>

            {/* Banners */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>📢 Banners de anuncio</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <input placeholder="Mensaje del banner..."
                  value={annMsg} onChange={e => setAnnMsg(e.target.value)}
                  style={{ ...inputStyle, flex: '1 1 240px' }} />
                <select value={annType} onChange={e => setAnnType(e.target.value)} style={selectStyle}>
                  <option value="info">Información</option>
                  <option value="feature">Próximo feature</option>
                  <option value="success">Novedad</option>
                  <option value="warning">Importante</option>
                </select>
                <input placeholder="Emoji"
                  value={annEmoji} onChange={e => setAnnEmoji(e.target.value)}
                  style={{ ...inputStyle, width: 60 }} />
                <button onClick={createAnnouncement} style={{ ...btnStyle, background: 'rgba(6,214,160,.2)', color: '#06d6a0' }}>+ Crear</button>
              </div>
              {allAnnouncements.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, marginBottom: 6 }}>
                  <span>{a.emoji}</span>
                  <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message}</span>
                  <span style={{ fontSize: 10, color: '#8892b0' }}>{a.type}</span>
                  <button onClick={() => toggleAnnouncement(a.id, !a.active)}
                    style={{ ...btnStyle, fontSize: 11, padding: '4px 10px' }}>
                    {a.active ? '⏸ Pausar' : '▶ Activar'}
                  </button>
                  <button onClick={() => deleteAnnouncement(a.id)}
                    style={{ ...btnStyle, fontSize: 11, padding: '4px 8px', background: 'rgba(248,81,73,.1)', borderColor: 'rgba(248,81,73,.3)', color: '#f85149' }}>
                    🗑
                  </button>
                </div>
              ))}
            </div>

            {/* Tutorials admin */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🎬 Videos de tutoriales</h3>
              <p style={{ fontSize: 12, color: '#8892b0', marginBottom: 12 }}>Ingresa las URLs de los scripts de Vturb para cada tutorial.</p>
              {[
                { key: 'intro',  label: '👋 Introducción' },
                { key: 'meta',   label: '📊 Meta Ads' },
                { key: 'hotmart',label: '🔥 Hotmart' },
                { key: 'notif',  label: '🔔 Notificaciones' },
              ].map(s => (
                <div key={s.key} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: '#8892b0', display: 'block', marginBottom: 4 }}>{s.label}</label>
                  <input
                    type="url" placeholder="https://scripts.converteai.net/..."
                    value={tutorialEdit[s.key] ?? ''}
                    onChange={e => setTutorialEdit(p => ({ ...p, [s.key]: e.target.value }))}
                    style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
                  />
                </div>
              ))}
              <button onClick={saveTutorials} style={{ ...btnStyle, background: 'rgba(79,142,247,.2)', color: '#4f8ef7', marginTop: 8 }}>
                Guardar videos
              </button>
            </div>

            {/* Manual sale */}
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>💰 Registrar venta manual</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                {[
                  { label: 'Transaction ID *', key: 'txid', type: 'text' },
                  { label: 'Comisión USD *', key: 'commission', type: 'number' },
                  { label: 'Producto', key: 'product', type: 'text' },
                  { label: 'Comprador', key: 'buyer', type: 'text' },
                  { label: 'Fecha', key: 'saleDate', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, color: '#8892b0', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={(manualSale as any)[f.key]}
                      onChange={e => setManualSale(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, color: '#8892b0', display: 'block', marginBottom: 4 }}>Usuario *</label>
                  <select value={manualSale.userId} onChange={e => setManualSale(p => ({ ...p, userId: e.target.value }))} style={{ ...selectStyle, width: '100%' }}>
                    <option value="">Seleccionar usuario...</option>
                    {adminUsers.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={submitManualSale} style={{ ...btnStyle, background: 'rgba(6,214,160,.2)', color: '#06d6a0', marginTop: 12 }}>
                Registrar venta
              </button>
              {manualMsg && <p style={{ marginTop: 8, fontSize: 12, color: manualMsg.startsWith('✓') ? '#06d6a0' : '#f87171' }}>{manualMsg}</p>}
            </div>

            {/* Users table */}
            <div style={cardStyle}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>👥 Usuarios</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: '#8892b0', fontSize: 11, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                      {['Usuario','Rol','Plan','Meta Account','Registro','Último ingreso','Acciones'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontWeight: 600 }}>{u.name || '—'}</span>
                          <span style={{ display: 'block', fontSize: 10, color: '#8892b0' }}>{u.email}</span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: u.role === 'admin' ? 'rgba(79,142,247,.2)' : 'rgba(255,255,255,.06)', color: u.role === 'admin' ? '#4f8ef7' : '#f0f4ff' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <select
                            value={u.plan || 'basic'}
                            onChange={async e => {
                              await apiFetch('/api/admin/set-plan', { method: 'POST', body: JSON.stringify({ userId: u.id, plan: e.target.value }) })
                              loadAdminData()
                            }}
                            style={{ fontSize: 11, padding: '3px 6px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, color: '#f0f4ff', cursor: 'pointer' }}
                          >
                            <option value="basic">Básico</option>
                            <option value="pro">Pro</option>
                            <option value="agency">Agencia</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 11, color: '#8892b0', fontFamily: 'monospace' }}>{u.meta_account_id || '—'}</td>
                        <td style={{ padding: '8px 10px', fontSize: 11, color: '#8892b0' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('es') : '—'}</td>
                        <td style={{ padding: '8px 10px', fontSize: 11, color: '#8892b0' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString('es') : '—'}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={async () => {
                              const r = u.role === 'admin' ? 'client' : 'admin'
                              await apiFetch('/api/admin/set-role', { method: 'POST', body: JSON.stringify({ userId: u.id, role: r }) })
                              loadAdminData()
                            }} style={{ ...btnStyle, fontSize: 10, padding: '3px 8px' }}>
                              → {u.role === 'admin' ? 'Cliente' : 'Admin'}
                            </button>
                            <button onClick={async () => {
                              if (!confirm('¿Eliminar este usuario?')) return
                              await apiFetch('/api/admin/delete-user', { method: 'POST', body: JSON.stringify({ userId: u.id }) })
                              loadAdminData()
                            }} style={{ ...btnStyle, fontSize: 10, padding: '3px 8px', background: 'rgba(248,81,73,.1)', borderColor: 'rgba(248,81,73,.3)', color: '#f85149' }}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Milestone celebration modal ────────────────────────────────── */}
      {celebrateMilestone && (
        <div
          onClick={() => setCelebrateMilestone(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
        >
          <div style={{ background: '#0e1228', border: `2px solid ${celebrateMilestone.color}`, borderRadius: 20, padding: '40px 48px', textAlign: 'center', maxWidth: 360 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>{celebrateMilestone.emoji}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: celebrateMilestone.color, marginBottom: 4 }}>
              ¡{celebrateMilestone.label} en comisiones!
            </div>
            <div style={{ fontSize: 16, color: '#8892b0', marginBottom: 20 }}>
              Acabas de desbloquear el badge <strong style={{ color: '#f0f4ff' }}>{celebrateMilestone.badge}</strong>
            </div>
            <button onClick={() => setCelebrateMilestone(null)}
              style={{ ...btnStyle, background: celebrateMilestone.color + '25', borderColor: celebrateMilestone.color, color: celebrateMilestone.color, padding: '10px 24px', fontSize: 14 }}>
              ¡Celebrar! 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Style constants ───────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 8,
  padding: '6px 10px',
  color: '#f0f4ff',
  fontSize: 12,
  cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,.3)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 8,
  padding: '6px 10px',
  color: '#f0f4ff',
  fontSize: 12,
  outline: 'none',
}

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 8,
  padding: '6px 14px',
  color: '#f0f4ff',
  fontSize: 12,
  cursor: 'pointer',
  fontWeight: 600,
  transition: 'all .15s',
}

const cardStyle: React.CSSProperties = {
  background: '#0e1228',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 12,
  padding: 16,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: '#f0f4ff',
  marginBottom: 16,
}

const tabBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '8px 14px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: '6px 6px 0 0',
  transition: 'color .15s',
}

// ── Helper components ─────────────────────────────────────────────────────────

function EmptyState({ icon, msg }: { icon: string; msg: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8892b0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{msg}</div>
    </div>
  )
}

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: '#8892b0', display: 'block', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── VAPID key helper ──────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}
