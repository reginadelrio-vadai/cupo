import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'
import { SLUG_REGEX } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    const { slug } = await request.json()

    if (!slug || !SLUG_REGEX.test(slug)) {
      return NextResponse.json({ data: { available: false, suggestion: null } })
    }

    const admin = createSupabaseAdminClient()

    const { data: existing } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .neq('id', orgId || '')
      .single()

    if (!existing) {
      return NextResponse.json({ data: { available: true } })
    }

    // Suggest alternatives
    for (let i = 1; i <= 5; i++) {
      const alt = `${slug}-${i}`
      if (!SLUG_REGEX.test(alt)) continue
      const { data: altExists } = await admin
        .from('organizations')
        .select('id')
        .eq('slug', alt)
        .single()
      if (!altExists) {
        return NextResponse.json({ data: { available: false, suggestion: alt } })
      }
    }

    return NextResponse.json({ data: { available: false, suggestion: null } })
  } catch (error) {
    return handleApiError(error)
  }
}
