// =============================================================================
// TIPOS CENTRALES — Dashboard de Métricas Diana
// =============================================================================
// Este archivo es la fuente de verdad entre front y back.
// El backend DEBE respetar exactamente estas formas al construir las respuestas.
// =============================================================================

// ---------------------------------------------------------------------------
// Roles y Usuario
// ---------------------------------------------------------------------------

export type Role = 'admin' | 'analista' | 'viewer'

/** Perfil interno del usuario (tabla `users` en Supabase, no auth.users) */
export interface UserProfile {
  id: string              // uuid — igual al auth.users.id de Supabase
  name: string
  email: string
  role: Role
  created_at: string      // ISO 8601
}

/** Sesión activa que devuelve el cliente Supabase Auth */
export interface AuthSession {
  user: {
    id: string
    email: string
  }
  profile: UserProfile
}

// ---------------------------------------------------------------------------
// Lead
// ---------------------------------------------------------------------------

/** Etapas del pipeline de leads — sincronizar con los stages de GHL */
export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

/** Lead tal como se almacena en Supabase (refleja la tabla `leads`) */
export interface Lead {
  id: string                    // uuid
  ghl_contact_id: string        // ID del contacto en GoHighLevel
  name: string
  email: string | null
  phone: string | null
  source: string | null         // ej. "Facebook Ads", "Referido", "Orgánico"
  stage: LeadStage
  created_at: string            // ISO 8601
  updated_at: string            // ISO 8601
}

// ---------------------------------------------------------------------------
// Opportunity
// ---------------------------------------------------------------------------

export type OpportunityStatus = 'open' | 'won' | 'lost'

/** Oportunidad tal como se almacena en Supabase (refleja la tabla `opportunities`) */
export interface Opportunity {
  id: string                    // uuid
  ghl_opportunity_id: string    // ID de la oportunidad en GoHighLevel
  lead_id: string               // uuid — FK → leads.id
  pipeline_id: string           // ID del pipeline en GHL
  stage_name: string            // Nombre legible del stage en GHL
  value: number                 // Valor estimado en la moneda local
  status: OpportunityStatus
  created_at: string            // ISO 8601
  // Relación expandida (opcional, solo cuando el backend hace JOIN)
  lead?: Pick<Lead, 'id' | 'name' | 'email' | 'source'>
}

// ---------------------------------------------------------------------------
// KPIs del Dashboard
// ---------------------------------------------------------------------------

/**
 * ENDPOINT: GET /api/dashboard/kpis
 * El backend agrega estos valores desde la DB y los devuelve en un solo request.
 * Actualizar al menos cada 15 minutos vía cache o revalidación.
 */
export interface DashboardKPIs {
  leads: {
    total: number                            // Total de leads en DB
    this_month: number                       // Leads creados en el mes actual
    prev_month: number                       // Leads del mes anterior (para calcular delta)
    by_stage: StageCount[]                   // Distribución por stage
    by_source: SourceCount[]                 // Fuente broad de GHL ("Facebook Ads", etc.)
    by_attribution: AttributionSourceCount[] // Fuente fina: nombre del anuncio > utm > broad
  }
  opportunities: {
    total_open: number          // Oportunidades con status='open'
    total_won: number           // Oportunidades con status='won'
    total_lost: number          // Oportunidades con status='lost'
    value_open: number          // Suma de value donde status='open'
    value_won: number           // Suma de value donde status='won' (este mes)
    value_won_prev_month: number // Suma de value ganado el mes anterior
    conversion_rate: number     // (won / (won + lost)) * 100 — porcentaje
  }
  last_synced_at: string        // ISO 8601 — última sincronización con GHL
}

export interface StageCount {
  stage: LeadStage
  count: number
}

export interface SourceCount {
  source: string
  count:  number
}

export interface AttributionSourceCount {
  source:      string
  source_type: 'ad' | 'utm' | 'broad'  // 'ad' = anuncio específico, 'utm' = fuente UTM, 'broad' = campo GHL
  count:       number
}

// ---------------------------------------------------------------------------
// Respuestas de listados paginados
// ---------------------------------------------------------------------------

/**
 * Wrapper genérico para respuestas paginadas.
 * ENDPOINT: GET /api/leads?page=1&limit=20&stage=new&source=Facebook
 * ENDPOINT: GET /api/opportunities?page=1&limit=20&status=open
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number               // Total de registros (sin paginar)
    page: number                // Página actual (base 1)
    limit: number               // Registros por página
    total_pages: number         // Math.ceil(total / limit)
  }
}

// ---------------------------------------------------------------------------
// Filtros para leads
// ---------------------------------------------------------------------------

export interface LeadsFilters {
  stage?: LeadStage
  source?: string
  search?: string               // Búsqueda por name o email
  date_from?: string            // ISO 8601 — filtro por created_at
  date_to?: string              // ISO 8601
  page?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// Filtros para oportunidades
// ---------------------------------------------------------------------------

export interface OpportunitiesFilters {
  status?: OpportunityStatus
  pipeline_id?: string
  stage_name?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

// ---------------------------------------------------------------------------
// Respuesta de error de la API interna
// ---------------------------------------------------------------------------

/**
 * Forma estándar de error que el backend debe retornar en cualquier 4xx/5xx.
 */
export interface ApiError {
  error: string                 // Mensaje legible
  code?: string                 // Código interno opcional (ej. "UNAUTHORIZED")
  status: number                // HTTP status code
}

// ---------------------------------------------------------------------------
// Pipeline — datos para visualización
// ---------------------------------------------------------------------------

/**
 * ENDPOINT: GET /api/opportunities/pipeline
 * Agrupación de oportunidades por stage, con totales de valor.
 * Usado para el gráfico de embudo/funnel.
 */
export interface PipelineStage {
  stage_name: string
  count: number
  total_value: number
  percentage: number            // % del total de oportunidades open
}

// ---------------------------------------------------------------------------
// Permisos por rol (usado en el front para mostrar/ocultar UI)
// ---------------------------------------------------------------------------

export const ROLE_PERMISSIONS = {
  admin: {
    canViewLeads: true,
    canViewOpportunities: true,
    canViewFinancials: true,    // Valores de oportunidades
    canTriggerSync: true,       // Botón de sincronizar con GHL
    canManageUsers: true,
  },
  analista: {
    canViewLeads: true,
    canViewOpportunities: true,
    canViewFinancials: true,
    canTriggerSync: false,
    canManageUsers: false,
  },
  viewer: {
    canViewLeads: true,
    canViewOpportunities: true,
    canViewFinancials: false,   // No ve valores monetarios
    canTriggerSync: false,
    canManageUsers: false,
  },
} as const satisfies Record<Role, Record<string, boolean>>

export type Permission = keyof (typeof ROLE_PERMISSIONS)['admin']

// ---------------------------------------------------------------------------
// Informe unificado GHL + Meta Ads
// ---------------------------------------------------------------------------

/** ENDPOINT: GET /api/reports/attribution?since=YYYY-MM-DD&until=YYYY-MM-DD */

export type MetaAdStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'DELETED' | 'UNKNOWN'

export interface AttributionByAd {
  attribution_ad_id:      string | null
  attribution_ad_name:    string | null
  attribution_utm_source: string | null
  attribution_page_url:   string | null
  thumbnail_url:          string | null
  preview_link:           string | null
  ad_status:              MetaAdStatus | null
  total_leads:            number
  conversions:            number
  revenue:                number
  meta_spend:             number
}

export interface AttributionByPipeline {
  pipeline_id:    string
  pipeline_name:  string | null
  stage_name:     string
  stage_position: number        // posición ordinal en el pipeline (para ordenar el funnel)
  count:          number
  total_value:    number
  won:            number
  lost:           number
}

export interface AttributionByTag {
  tag:         string
  total_leads: number
}

export interface MetaTotals {
  total_spend:            number
  total_impressions:      number
  total_clicks:           number
  total_conversions_meta: number
  avg_ctr:                number
  avg_cpm:                number
}

export interface CRMStats {
  total_leads:         number
  with_interaction:    number
  without_interaction: number
}

export interface EventTag {
  tag:   string
  count: number
}

// ── Clase en Vivo ─────────────────────────────────────────────────────────────

export interface LMDistItem {
  lm_tag: string
  count:  number
  pct:    number
}

export interface CustomFieldRow {
  field_name:  string
  field_value: string
  count:       number
  pct:         number
}

export interface ClaseReport {
  class_tag:     string
  since:         string
  until:         string
  total_leads:   number
  lm_dist:       LMDistItem[]
  sessions:      number
  purchases:     number
  revenue:       number
  custom_fields: CustomFieldRow[]
}

export interface ClaseSummaryRow {
  class_tag:  string
  crm_leads:  number
  lm_engaged: number
  sessions:   number
  purchases:  number
  revenue:    number
}

export interface MetaCampaignRow {
  campaign_name: string
  spend:         number
  clicks:        number
  impressions:   number
  conversions:   number
  cpc:           number
  cpl:           number
  ctr:           number
}

export interface MetaClaseData {
  campaigns: MetaCampaignRow[]
  since:     string
  until:     string
}

export interface AttributionReport {
  since:       string
  until:       string
  tag_filter:  string | null
  by_ad:       AttributionByAd[]
  by_pipeline: AttributionByPipeline[]
  by_tag:      AttributionByTag[]
  meta_totals: MetaTotals
  crm_stats:   CRMStats
}
