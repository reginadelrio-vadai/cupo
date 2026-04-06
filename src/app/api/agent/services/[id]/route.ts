import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const supabase = createSupabaseAdminClient()
    const { data: service, error } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, buffer_after_minutes, price, currency, requires_payment, is_virtual, category_id, service_categories(name)')
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .single()

    if (error || !service) throw new AppError('NOT_FOUND', 'Servicio no encontrado', 404)

    // Get professionals that offer this service
    const { data: professionals } = await supabase
      .from('professional_services')
      .select('professionals(id, display_name)')
      .eq('service_id', params.id)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)

    return NextResponse.json({
      data: {
        service,
        professionals: professionals?.map(p => p.professionals).filter(Boolean) || [],
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
