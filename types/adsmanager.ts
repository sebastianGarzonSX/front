// ── AdsManager PRO — Types ────────────────────────────────────────────────────

export type DatePreset =
  | 'today' | 'yesterday' | 'last_7d' | 'last_14d' | 'last_30d'
  | 'last_90d' | 'this_month' | 'last_month' | 'custom'

export interface MetaAccount {
  id:       string
  name:     string
  currency: string
}

export interface MetaCampaign {
  campaign_id:   string
  campaign_name: string
  status:        string
  daily_budget?: number
  spend:         number
  impressions:   number
  clicks:        number
  reach:         number
  ctr:           number
  cpm:           number
  frequency:     number
  purchases:     number
  leads:         number
  init_payments: number
  revenue:       number
  roas:          number
  cpa:           number
  cpl:           number
}

export interface OverviewTotals {
  spend:       number
  impressions: number
  clicks:      number
  purchases:   number
  leads:       number
  revenue:     number
  roas:        number
  cpa:         number
  ctr:         number
}

export interface OverviewResponse {
  campaigns:   MetaCampaign[]
  totals:      OverviewTotals
  prevTotals?: OverviewTotals | null
  since:       string
  until:       string
}

export interface TopAd {
  ad_id:         string
  ad_name:       string
  campaign_name: string
  campaign_id:   string
  spend:         number
  impressions:   number
  clicks:        number
  ctr:           number
  cpm:           number
  cpa:           number
  cpl:           number
  purchases:     number
  leads:         number
  preview_url?:  string | null
  thumbnail_url?: string | null
}

export interface CountryRow {
  country:     string
  spend:       number
  impressions: number
  clicks:      number
  purchases:   number
  revenue:     number
  ctr:         number
  cpm:         number
  cpa:         number
  roas:        number
}

export interface Launch {
  name:        string
  campaigns:   number
  spend:       number
  impressions: number
  clicks:      number
  purchases:   number
  leads:       number
  revenue:     number
  roas:        number
  cpa:         number
  cpl:         number
  ctr:         number
  days:        number
}

export interface Recommendation {
  id:         unknown
  name:       unknown
  status:     unknown
  spend:      number
  purchases:  number
  leads:      number
  roas:       number
  cpa:        number
  cpl:        number
  ctr:        number
}

export interface RecommendationsResponse {
  pause:   Recommendation[]
  scale:   Recommendation[]
  review:  Recommendation[]
  ok:      Recommendation[]
  avgCpa:  number
  avgCtr:  number
  since:   string
  until:   string
}

export interface ProjectionData {
  spend:       number
  impressions: number
  clicks:      number
  purchases:   number
  leads:       number
  revenue:     number
  cpm:         number
  ctr:         number
  close_rate:  number
  avg_ticket:  number
  since:       string
  until:       string
}

export interface HotmartSale {
  id:             string
  user_id:        string
  transaction_id: string | null
  product_name:   string | null
  buyer_name:     string | null
  buyer_email:    string | null
  amount:         number
  commission:     number
  status:         string
  sale_date:      string | null
  utm_campaign:   string | null
  utm_content:    string | null
  payment_type:   string | null
  created_at:     string
}

export interface SalesTotals {
  total:      number
  approved:   number
  revenue:    number
  refunds:    number
  net:        number
  avg_ticket: number
}

export interface UtmRow {
  label:   string
  sales:   number
  revenue: number
}

export interface Announcement {
  id:         string
  message:    string
  type:       'info' | 'feature' | 'success' | 'warning'
  emoji:      string
  active:     boolean
  created_at: string
}

export interface AdminUser {
  id:              string
  name:            string | null
  email:           string
  role:            string
  plan:            string
  meta_account_id: string | null
  status:          string
  created_at:      string
  last_login:      string | null
}

export interface Milestone {
  amount:  number
  label:   string
  emoji:   string
  badge:   string
  color:   string
}
