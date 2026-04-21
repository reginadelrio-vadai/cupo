import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError, AppError } from '@/lib/errors'
import { normalizePhone } from '@/lib/phone'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') === 'asc' ? true : false

    let query = supabase
      .from('clients')
      .select('*')
      .eq('organization_id', orgId)
      .order(sortBy, { ascending: order })
      .limit(100)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data: { clients: data } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)
    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''

    if (!name) throw new AppError('INVALID_NAME', 'El nombre es requerido', 400)
    if (!phone) throw new AppError('INVALID_PHONE', 'El teléfono es requerido', 400)

    const phoneNormalized = normalizePhone(phone)
    if (!phoneNormalized) {
      throw new AppError('INVALID_PHONE', 'Número de teléfono inválido. Incluye el código de país.', 400)
    }

    const { data: existing } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .eq('phone_normalized', phoneNormalized)
      .maybeSingle()

    if (existing) {
      throw new AppError('DUPLICATE_PHONE', 'Este teléfono ya está registrado', 409)
    }

    const { data: created, error } = await supabase
      .from('clients')
      .insert({
        organization_id: orgId,
        name,
        phone,
        phone_normalized: phoneNormalized,
        email: email || null,
        source: 'manual',
      })
      .select('*')
      .single()

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new AppError('DUPLICATE_PHONE', 'Este teléfono ya está registrado', 409)
      }
      throw error
    }

    return NextResponse.json({ data: { client: created } }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
