import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { resolveOrg } from '@/lib/booking/resolve-org'
import { handleApiError, AppError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const resolved = await resolveOrg(params.slug)
    if (!resolved) throw new AppError('NOT_FOUND', 'Página no disponible', 404)

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('service_id')

    const supabase = createSupabaseAdminClient()

    if (serviceId) {
      // Get professionals for a specific service
      const { data: links } = await supabase
        .from('professional_services')
        .select('professional_id, professionals(id, display_name, avatar_url)')
        .eq('organization_id', resolved.org.id)
        .eq('service_id', serviceId)
        .eq('is_active', true)

      const professionals = links?.map(l => l.professionals).filter(Boolean) || []
      return NextResponse.json({ data: { professionals } })
    }

    // All active professionals
    const { data: professionals } = await supabase
      .from('professionals')
      .select('id, display_name, avatar_url')
      .eq('organization_id', resolved.org.id)
      .eq('is_active', true)

    return NextResponse.json({ data: { professionals: professionals || [] } })
  } catch (error) {
    return handleApiError(error)
  }
}
