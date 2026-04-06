import { SupabaseClient } from '@supabase/supabase-js'
import { normalizePhone } from '@/lib/phone'
import { AppError } from '@/lib/errors'

interface FindOrCreateClientParams {
  fullName: string
  phone: string
  email?: string
  source?: 'manual' | 'booking_page' | 'whatsapp' | 'api'
}

export async function findOrCreateClient(
  supabase: SupabaseClient,
  organizationId: string,
  data: FindOrCreateClientParams
): Promise<{ client: Record<string, unknown>; isNew: boolean }> {
  const phoneNormalized = normalizePhone(data.phone)
  if (!phoneNormalized) {
    throw new AppError('INVALID_PHONE', 'Número de teléfono inválido', 400)
  }

  // Check if client exists
  const { data: existing } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('phone_normalized', phoneNormalized)
    .single()

  if (existing) {
    // Update with any new info
    const updates: Record<string, unknown> = {}
    if (data.fullName && data.fullName !== existing.name) updates.name = data.fullName
    if (data.email && !existing.email) updates.email = data.email

    if (Object.keys(updates).length > 0) {
      const { data: updated } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', existing.id)
        .select('*')
        .single()
      return { client: updated || existing, isNew: false }
    }

    return { client: existing, isNew: false }
  }

  // Create new client
  const { data: created, error } = await supabase
    .from('clients')
    .insert({
      organization_id: organizationId,
      name: data.fullName,
      phone: data.phone,
      phone_normalized: phoneNormalized,
      email: data.email || null,
      source: data.source || 'manual',
    })
    .select('*')
    .single()

  if (error) throw error

  return { client: created, isNew: true }
}

export async function getClientByPhone(
  supabase: SupabaseClient,
  organizationId: string,
  phone: string
): Promise<Record<string, unknown> | null> {
  const phoneNormalized = normalizePhone(phone)
  if (!phoneNormalized) return null

  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('phone_normalized', phoneNormalized)
    .single()

  return data
}

export async function getClientById(
  supabase: SupabaseClient,
  organizationId: string,
  clientId: string
): Promise<Record<string, unknown> | null> {
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .single()

  return data
}
