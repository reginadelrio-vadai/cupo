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
  const showName = resolved.config.show_name_on_booking ?? true

  return (
    <div
      className="min-h-screen relative"
      style={{
        // Solid saturated base so the color is unmistakable.
        backgroundColor: primaryColor,
        // Stacked overlays (top layer first):
        //   1) Diagonal fade to white in the bottom-right — keeps brand color
        //      clearly dominant for the first 65% then eases to pure white
        //      at the bottom-right corner for depth and card contrast.
        //   2) Subtle light→shadow wash for frosted-gradient depth.
        backgroundImage: `
          linear-gradient(160deg, transparent 0%, transparent 65%, rgba(255,255,255,0.5) 85%, #FFFFFF 100%),
          linear-gradient(160deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 40%, rgba(0,0,0,0.12) 100%)
        `,
      }}
    >
      {/* Diffused radial blobs for depth: a bright tint + a soft shadow + a warm brand-color glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-[620px] h-[620px] rounded-full" style={{ background: `radial-gradient(circle, rgba(255,255,255,0.28), transparent 65%)`, filter: 'blur(90px)' }} />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[520px] h-[520px] rounded-full" style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 65%)`, mixBlendMode: 'screen', filter: 'blur(90px)' }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[560px] h-[560px] rounded-full" style={{ background: `radial-gradient(circle, rgba(0,0,0,0.22), transparent 65%)`, filter: 'blur(80px)' }} />
      {/* Grain texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.25] mix-blend-overlay">
        <svg width="100%" height="100%"><filter id="bg"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" /></filter><rect width="100%" height="100%" filter="url(#bg)" /></svg>
      </div>

      <div className="relative z-[2] mx-auto max-w-[520px] px-4 pt-12 pb-16">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex flex-row items-center justify-center gap-4">
            {logo ? (
              <>
                <img
                  src={logo}
                  alt={resolved.org.name}
                  className="h-28 max-h-28 w-auto max-w-[280px] object-contain"
                />
                {showName && (
                  <h1 className="text-[22px] font-medium text-white tracking-[-0.3px]">{resolved.org.name}</h1>
                )}
              </>
            ) : (
              <h1 className="text-[24px] font-medium text-white tracking-[-0.5px]">{resolved.org.name}</h1>
            )}
          </div>
          {resolved.config.welcome_message && (
            <p className="mt-3 text-[13px] text-white/75 max-w-[400px]">{resolved.config.welcome_message}</p>
          )}
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
