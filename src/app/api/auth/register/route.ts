import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      throw new AppError('VALIDATION_ERROR', 'Email, password y nombre son requeridos', 400)
    }

    if (password.length < 6) {
      throw new AppError('VALIDATION_ERROR', 'La contraseña debe tener al menos 6 caracteres', 400)
    }

    const admin = createSupabaseAdminClient()

    // Check if user already exists by listing users with this email
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const exists = existingUsers?.users?.some((u) => u.email === email)

    if (exists) {
      throw new AppError(
        'USER_EXISTS',
        'Ya existe una cuenta con este correo. Inicia sesión.',
        409
      )
    }

    // Create user with auto-confirm (bypasses email confirmation)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: name },
    })

    if (error) {
      if (error.message.includes('already been registered')) {
        throw new AppError(
          'USER_EXISTS',
          'Ya existe una cuenta con este correo. Inicia sesión.',
          409
        )
      }
      throw new AppError('REGISTRATION_ERROR', error.message, 400)
    }

    return NextResponse.json({ data: { userId: data.user.id } })
  } catch (error) {
    return handleApiError(error)
  }
}
