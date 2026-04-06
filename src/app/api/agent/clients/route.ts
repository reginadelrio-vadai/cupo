import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent, isAuthError } from '@/lib/agent-auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { findOrCreateClient } from '@/lib/services/client.service'
import { handleApiError, AppError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAgent(request)
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const { full_name, phone, email, source } = body

    if (!full_name || !phone) {
      throw new AppError('VALIDATION_ERROR', 'full_name and phone are required', 400)
    }

    const supabase = createSupabaseAdminClient()
    const { client, isNew } = await findOrCreateClient(supabase, auth.organizationId, {
      fullName: full_name,
      phone,
      email,
      source: source || 'whatsapp',
    })

    return NextResponse.json(
      { data: { client: { ...client, is_new: isNew } } },
      { status: isNew ? 201 : 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
