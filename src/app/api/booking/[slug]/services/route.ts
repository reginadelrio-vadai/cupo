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

    const supabase = createSupabaseAdminClient()
    const { data: services } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, price, currency, is_virtual, category_id, service_categories(name)')
      .eq('organization_id', resolved.org.id)
      .eq('is_active', true)
      .order('sort_order')

    return NextResponse.json({
      data: {
        organization: {
          name: resolved.org.name,
          logo_url: resolved.config.logo_url ?? resolved.org.logo_url,
          primary_color: resolved.config.primary_color ?? resolved.org.primary_color,
          welcome_message: resolved.config.welcome_message,
        },
        services: services || [],
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
