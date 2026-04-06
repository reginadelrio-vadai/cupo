import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'

interface ServiceInput {
  name: string
  duration_minutes: number
  price: number
  category?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'Complete step 1 first', 400)

    const { services } = await request.json() as { services: ServiceInput[] }
    if (!services?.length) throw new AppError('VALIDATION_ERROR', 'Al menos un servicio es requerido', 400)

    const admin = createSupabaseAdminClient()

    // Create categories (deduplicate)
    const categoryNames = Array.from(new Set(services.map(s => s.category).filter(Boolean))) as string[]
    const categoryMap: Record<string, string> = {}

    for (const catName of categoryNames) {
      const { data: cat } = await admin
        .from('service_categories')
        .insert({ organization_id: orgId, name: catName })
        .select('id')
        .single()
      if (cat) categoryMap[catName] = cat.id
    }

    // Create services
    const serviceRows = services.map((s, i) => ({
      organization_id: orgId,
      name: s.name,
      duration_minutes: s.duration_minutes,
      price: s.price,
      currency: 'MXN',
      category_id: s.category ? categoryMap[s.category] || null : null,
      sort_order: i,
    }))

    const { data: created, error: svcError } = await admin
      .from('services')
      .insert(serviceRows)
      .select('id, name')

    if (svcError) throw svcError

    return NextResponse.json({ data: { services: created } })
  } catch (error) {
    return handleApiError(error)
  }
}
