/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'
import { resolveOrg } from '@/lib/booking/resolve-org'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { BookingFlow } from '@/components/booking/booking-flow'

interface Props {
  params: { slug: string }
}

export default async function BookingPage({ params }: Props) {
  const resolved = await resolveOrg(params.slug)

  if (!resolved) {
    notFound()
  }

  const supabase = createSupabaseAdminClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price, currency, is_virtual, category_id, service_categories(name)')
    .eq('organization_id', resolved.org.id)
    .eq('is_active', true)
    .order('sort_order')

  const logo = resolved.config.logo_url ?? resolved.org.logo_url
  const primaryColor = resolved.config.primary_color ?? resolved.org.primary_color

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[520px] px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {logo ? (
            <img src={logo} alt={resolved.org.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ background: primaryColor }}
            >
              <span className="text-sm font-medium text-white">
                {resolved.org.name[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-lg font-medium text-[#0F172A]">{resolved.org.name}</h1>
            {resolved.config.welcome_message && (
              <p className="text-sm text-[#475569]">{resolved.config.welcome_message}</p>
            )}
          </div>
        </div>

        <BookingFlow
          slug={params.slug}
          services={services || []}
          primaryColor={primaryColor}
        />
      </div>
    </div>
  )
}
