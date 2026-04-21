import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { handleApiError, AppError } from '@/lib/errors'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
const LOGOS_BUCKET = 'logos'

function extFromType(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/jpeg' || type === 'image/jpg') return 'jpg'
  if (type === 'image/svg+xml') return 'svg'
  return 'bin'
}

async function ensureBucket(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const { data: buckets } = await admin.storage.listBuckets()
  const existing = buckets?.find(b => b.name === LOGOS_BUCKET)
  if (!existing) {
    await admin.storage.createBucket(LOGOS_BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    })
    return
  }
  // Bucket already exists — make sure it's public so getPublicUrl works.
  if (!existing.public) {
    await admin.storage.updateBucket(LOGOS_BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new AppError('UNAUTHORIZED', 'Not authenticated', 401)

    const orgId = user.app_metadata?.organization_id
    if (!orgId) throw new AppError('NO_ORG', 'No organization', 400)

    const role = user.app_metadata?.role
    if (role !== 'owner' && role !== 'admin') {
      throw new AppError('FORBIDDEN', 'Solo el dueño o admin puede cambiar el logo', 403)
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      throw new AppError('NO_FILE', 'No se envió archivo', 400)
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new AppError('INVALID_TYPE', 'Formato no soportado. Usa PNG, JPG o SVG.', 400)
    }
    if (file.size > MAX_SIZE) {
      throw new AppError('FILE_TOO_LARGE', 'El archivo supera el máximo de 2MB.', 400)
    }

    const admin = createSupabaseAdminClient()
    await ensureBucket(admin)

    const ext = extFromType(file.type)
    const path = `${orgId}/logo.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Remove any prior logo files for this org (different extensions) so we
    // don't leave stale files behind when switching formats.
    const { data: existing } = await admin.storage.from(LOGOS_BUCKET).list(orgId)
    if (existing && existing.length) {
      const toDelete = existing
        .map(e => `${orgId}/${e.name}`)
        .filter(p => p !== path)
      if (toDelete.length) await admin.storage.from(LOGOS_BUCKET).remove(toDelete)
    }

    const { error: uploadError } = await admin.storage
      .from(LOGOS_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '3600',
      })
    if (uploadError) throw uploadError

    const { data: urlData } = admin.storage.from(LOGOS_BUCKET).getPublicUrl(path)
    const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`

    const { data: orgData, error: updateError } = await admin
      .from('organizations')
      .update({ logo_url: logoUrl })
      .eq('id', orgId)
      .select('slug')
      .single()
    if (updateError) throw updateError

    // Mirror to booking_page_config so the booking page reflects the new logo
    // (booking page reads config.logo_url with org.logo_url fallback, and
    // onboarding may have pinned config.logo_url to an older value).
    await admin
      .from('booking_page_config')
      .update({ logo_url: logoUrl })
      .eq('organization_id', orgId)

    // Clear any cached render of the booking page so the new logo shows up.
    if (orgData?.slug) {
      try { revalidatePath(`/book/${orgData.slug}`) } catch { /* noop */ }
    }

    return NextResponse.json({ data: { logo_url: logoUrl } })
  } catch (error) {
    return handleApiError(error)
  }
}
