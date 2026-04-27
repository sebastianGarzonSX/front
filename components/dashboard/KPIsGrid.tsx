'use client'

import { useDashboardKPIs } from '@/hooks/useDashboardKPIs'
import { KPICard, calcDelta, formatNumber, formatCurrency } from './KPICard'
import { UserProfile, ROLE_PERMISSIONS } from '@/types'
import { Users, TrendingUp, DollarSign, Percent } from 'lucide-react'

interface KPIsGridProps {
  user: UserProfile
}

export function KPIsGrid({ user }: KPIsGridProps) {
  const { data, isLoading } = useDashboardKPIs()
  const permissions = ROLE_PERMISSIONS[user.role]

  const leadsThisMonth  = data?.leads.this_month  ?? 0
  const leadsPrevMonth  = data?.leads.prev_month  ?? 0
  const leadsTotal      = data?.leads.total       ?? 0
  const valuOpen        = data?.opportunities.value_open  ?? 0
  const valWon          = data?.opportunities.value_won   ?? 0
  const valWonPrev      = data?.opportunities.value_won_prev_month ?? 0
  const convRate        = data?.opportunities.conversion_rate ?? 0
  const totalOpen       = data?.opportunities.total_open ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KPICard
        label="Leads este mes"
        value={isLoading ? '—' : formatNumber(leadsThisMonth)}
        delta={isLoading ? undefined : calcDelta(leadsThisMonth, leadsPrevMonth)}
        sublabel={`${formatNumber(leadsTotal)} total acumulado`}
        isLoading={isLoading}
        icon={<Users size={18} />}
      />

      <KPICard
        label="Oportunidades abiertas"
        value={isLoading ? '—' : formatNumber(totalOpen)}
        sublabel="en pipeline activo"
        isLoading={isLoading}
        icon={<TrendingUp size={18} />}
      />

      <KPICard
        label="Valor ganado este mes"
        value={isLoading ? '—' : formatCurrency(valWon)}
        delta={isLoading ? undefined : calcDelta(valWon, valWonPrev)}
        sublabel={`${formatCurrency(valuOpen)} en pipeline`}
        isLoading={isLoading}
        visible={permissions.canViewFinancials}
        icon={<DollarSign size={18} />}
      />

      <KPICard
        label="Tasa de conversión"
        value={isLoading ? '—' : `${convRate.toFixed(1)}%`}
        sublabel="won / (won + lost)"
        isLoading={isLoading}
        icon={<Percent size={18} />}
      />
    </div>
  )
}
