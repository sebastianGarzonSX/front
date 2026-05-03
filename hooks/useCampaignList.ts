'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface CampaignOption {
  campaign_id:   string
  campaign_name: string
  spend:         number
}

export type CampaignAccountType = 'eventos' | 'clase' | 'all'

export function useCampaignList(
  since: string,
  until: string,
  accountType: CampaignAccountType = 'all',
) {
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([])
  const [isLoading, setLoading]   = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ since, until })
      if (accountType !== 'all') params.set('account_type', accountType)
      const res = await apiFetch(`/api/dashboard/campaigns?${params}`)
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
    } catch {
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }, [since, until, accountType])

  useEffect(() => { fetch_() }, [fetch_])

  return { campaigns, isLoading }
}
