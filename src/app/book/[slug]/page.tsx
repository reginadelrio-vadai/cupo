/* eslint-disable @next/next/no-img-element */
import { notFound } from 'next/navigation'
import { resolveOrg } from '@/lib/booking/resolve-org'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { BookingFlow } from '@/components/booking/booking-flow'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  const logo = resolved.config.logo_url || resolved.org.logo_url || null
  const primaryColor = resolved.config.primary_color ?? resolved.org.primary_color

  return (
    <div className="min-h-screen relative" style={{ background: `linear-gradient(160deg, ${primaryColor}B0 0%, ${primaryColor}80 40%, ${primaryColor}50 70%, ${primaryColor}30 100%)` }}>
      {/* Diffused radial blobs for depth */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full" style={{ background: `radial-gradient(circle, ${primaryColor}60, transparent 65%)`, filter: 'blur(80px)' }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full" style={{ background: `radial-gradient(circle, ${primaryColor}30, transparent 65%)`, filter: 'blur(60px)' }} />
      {/* Grain texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.35] mix-blend-overlay">
        <svg width="100%" height="100%"><filter id="bg"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" /></filter><rect width="100%" height="100%" filter="url(#bg)" /></svg>
      </div>

      <div className="relative z-[2] mx-auto max-w-[520px] px-4 pt-12 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-8">
          {logo ? (
            <img
              src={logo}
              alt={resolved.org.name}
              className="h-20 max-h-20 w-auto max-w-[220px] object-contain"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: primaryColor }}
            >
              <span className="text-base font-medium text-white">
                {resolved.org.name[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-[18px] font-medium text-white">{resolved.org.name}</h1>
            {resolved.config.welcome_message && (
              <p className="text-[13px] text-white/70 mt-0.5">{resolved.config.welcome_message}</p>
            )}
          </div>
        </div>

        {/* Booking flow card */}
        <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]">
          <BookingFlow
            slug={params.slug}
            services={services || []}
            primaryColor={primaryColor}
          />
        </div>

        {/* Powered by cupo */}
        <div className="mt-10 text-center">
          <a href="https://cupo.app" className="inline-flex items-center gap-2 text-[12px] text-[#0F172A] hover:text-[#1E293B] transition-colors">
            <span>Powered by</span>
            <span className="flex items-center gap-1">
              <span className="inline-flex h-[14px] w-[14px] rounded-[3px] bg-[#0F172A] items-center justify-center">
                <span className="h-[4px] w-[4px] rounded-full bg-white" />
              </span>
              <span className="font-medium tracking-[0.3px] text-[#0F172A]">cupo</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
