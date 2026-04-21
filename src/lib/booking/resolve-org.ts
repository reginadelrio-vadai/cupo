import { createSupabaseAdminClient } from '@/lib/supabase/admin'

interface ResolvedOrg {
  org: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    primary_color: string
    timezone: string
    phone: string | null
    email: string | null
    is_active: boolean
    slot_granularity_minutes: number
  }
  config: {
    is_active: boolean
    logo_url: string | null
    primary_color: string | null
    welcome_message: string | null
    min_advance_hours: number
    max_advance_days: number
    show_name_on_booking: boolean
  }
}

export async function resolveOrg(slug: string): Promise<ResolvedOrg | null> {
  const supabase = createSupabaseAdminClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, primary_color, timezone, phone, email, is_active, slot_granularity_minutes')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!org) return null

  const { data: config } = await supabase
    .from('booking_page_config')
    .select('is_active, logo_url, primary_color, welcome_message, min_advance_hours, max_advance_days, show_name_on_booking')
    .eq('organization_id', org.id)
    .single()

  if (!config || !config.is_active) return null

  return { org, config }
}
