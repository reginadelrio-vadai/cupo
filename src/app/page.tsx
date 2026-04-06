import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#060608] overflow-hidden">
      {/* Grain texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-10 opacity-30 mix-blend-overlay">
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="h-10 w-10 rounded-xl bg-[#00B8E6] flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-[#060608]" />
          </div>
          <span className="text-2xl font-medium tracking-[0.5px] text-[#E2E8F0]">cupo</span>
        </div>

        {/* Hero */}
        <h1 className="max-w-[600px] text-[34px] font-medium tracking-[-1.2px] text-[#E2E8F0]">
          Agendamiento inteligente para tu negocio
        </h1>
        <p className="mt-4 max-w-[460px] text-sm leading-[1.7] text-[#475569]">
          Recibe citas por booking page, WhatsApp con IA, o creación manual. Todo en un solo lugar.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex gap-3">
          <Link
            href="/register"
            className="inline-flex items-center rounded-lg bg-[#00B8E6] px-6 py-2.5 text-sm font-medium text-[#060608] transition-opacity duration-150 hover:opacity-80"
          >
            Comenzar gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-6 py-2.5 text-sm font-medium text-[#E2E8F0] backdrop-blur-[20px] transition-opacity duration-150 hover:opacity-80"
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Tags */}
        <div className="mt-12 flex gap-3">
          {['Booking page', 'WhatsApp IA', 'Google Calendar', 'Pagos online'].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(8,145,178,0.25)] px-3 py-1 text-[11px] text-[#94A3B8]"
            >
              <span className="h-1 w-1 rounded-full bg-[#00B8E6]" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
