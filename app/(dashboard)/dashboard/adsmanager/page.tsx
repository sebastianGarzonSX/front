import { createAdminClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth'
import AdsManagerClient from '@/components/adsmanager/AdsManagerClient'

export const metadata = { title: 'AdsManager PRO' }

export default async function AdsManagerPage() {
  const user = await getAuthenticatedUser()

  // Fetch plan from DB
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (profile as any)?.plan ?? 'basic'

  return (
    <AdsManagerClient
      userRole={user.role}
      userName={user.name}
      userPlan={plan}
    />
  )
}
