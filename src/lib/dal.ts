import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const verifySession = cache(async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  return {
    userId: user.id,
    organizationId: user.app_metadata?.organization_id as string | undefined,
    role: user.app_metadata?.role as string | undefined,
    email: user.email!,
  }
})
