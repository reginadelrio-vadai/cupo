import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const supabase = createSupabaseAdminClient()
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, buffer_after_minutes, price, currency, requires_payment, is_virtual, category_id, service_categories(name)')
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error

    return NextResponse.json({ data: { services } })
  } catch (error) {
    return handleApiError(error)
  }
}
