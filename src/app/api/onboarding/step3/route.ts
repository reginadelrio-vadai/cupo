import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'

interface ProfessionalInput {
  name: string
  email?: string
  service_ids: string[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'Complete step 1 first', 400)

    const { professionals } = await request.json() as { professionals: ProfessionalInput[] }
    if (!professionals?.length) throw new AppError('VALIDATION_ERROR', 'Al menos un profesional es requerido', 400)

    const admin = createSupabaseAdminClient()

    const createdProfessionals: Array<{ id: string; name: string }> = []

    for (const prof of professionals) {
      // Create professional
      const { data: created, error: profError } = await admin
        .from('professionals')
        .insert({
          organization_id: orgId,
          display_name: prof.name,
          email: prof.email || null,
        })
        .select('id')
        .single()

      if (profError) throw profError

      // Create professional_services links
      if (prof.service_ids.length > 0) {
        const links = prof.service_ids.map(sid => ({
          organization_id: orgId,
          professional_id: created.id,
          service_id: sid,
        }))
        await admin.from('professional_services').insert(links)
      }

      createdProfessionals.push({ id: created.id, name: prof.name })
    }

    return NextResponse.json({ data: { professionals: createdProfessionals } })
  } catch (error) {
    return handleApiError(error)
  }
}
