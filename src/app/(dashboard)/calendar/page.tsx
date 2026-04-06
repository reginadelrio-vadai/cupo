import { verifySession } from '@/lib/dal'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/calendar/calendar-view'
import { Toaster } from '@/components/ui/sonner'

export default async function CalendarPage() {
  const session = await verifySession()

  const supabase = await createSupabaseServerClient()

  const [profsResult, servicesResult] = await Promise.all([
    supabase
      .from('professionals')
      .select('id, display_name')
      .eq('organization_id', session.organizationId!)
      .eq('is_active', true),
    supabase
      .from('services')
      .select('id, name, duration_minutes')
      .eq('organization_id', session.organizationId!)
      .eq('is_active', true)
      .order('sort_order'),
  ])

  return (
    <div>
      <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">
        Calendario
      </h1>
      <p className="mt-1 text-sm text-[#475569] mb-6">
        Gestiona tus citas visualmente
      </p>

      <CalendarView
        professionals={profsResult.data || []}
        services={servicesResult.data || []}
      />

      <Toaster position="bottom-right" />
    </div>
  )
}
