import Link from 'next/link'
import {
  Calendar, MessageSquare, BarChart3, Globe, Clock, CreditCard,
  Bell, Users, Video, Webhook, ChevronDown, Check, X as XIcon,
  ArrowRight, Zap, Shield, Smartphone, LayoutDashboard, Settings,
} from 'lucide-react'

/* ── Reusable ── */

function Arcs({ className, opacity = 0.12 }: { className?: string; opacity?: number }) {
  return (
    <div className={`pointer-events-none absolute z-0 ${className || ''}`}>
      {[220, 320, 420, 520, 620].map((s, i) => (
        <div key={s} className="absolute rounded-full" style={{ width: s, height: s, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: `0.5px solid rgba(0,184,230,${Math.max(opacity - i * 0.02, 0.01)})` }} />
      ))}
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(8,145,178,0.25)] px-3 py-1 text-[10px] uppercase tracking-[1.5px] text-[#94A3B8] mb-4">
      <span className="h-1 w-1 rounded-full bg-[#00B8E6]" />{children}
    </span>
  )
}

/* ── CSS Mockup components ── */

function DashboardMockup() {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F1419] overflow-hidden shadow-[0_0_40px_rgba(0,184,230,0.08)]">
      {/* Top bar */}
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #00B8E6, #0891B2, #06D6A0, transparent)' }} />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-36 border-r border-[rgba(255,255,255,0.06)] p-3 space-y-1.5 hidden md:block">
          <div className="flex items-center gap-1.5 mb-4"><div className="h-5 w-5 rounded bg-[#00B8E6]" /><span className="text-[10px] text-[#94A3B8]">cupo</span></div>
          {[{ icon: LayoutDashboard, l: 'Dashboard', a: true }, { icon: Calendar, l: 'Calendario', a: false }, { icon: Users, l: 'Clientes', a: false }, { icon: CreditCard, l: 'Pagos', a: false }, { icon: Settings, l: 'Config', a: false }].map(n => (
            <div key={n.l} className={`flex items-center gap-1.5 rounded px-2 py-1 text-[9px] ${n.a ? 'bg-[#0891B2]/10 text-[#0891B2]' : 'text-[#475569]'}`}>
              <n.icon className="h-3 w-3" />{n.l}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-3 space-y-2.5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[{ l: 'Citas hoy', v: '12', c: '#0891B2' }, { l: 'Ingresos', v: '$8.4K', c: '#10B981' }, { l: 'No-show', v: '3%', c: '#EF4444' }].map(s => (
              <div key={s.l} className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-2">
                <p className="text-[7px] uppercase tracking-[0.5px] text-[#475569]">{s.l}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
          {/* Mini calendar */}
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-2">
            <div className="grid grid-cols-5 gap-1">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map(d => <div key={d} className="text-[7px] text-center text-[#475569]">{d}</div>)}
              {[
                { h: '9:00', c: '#0891B2' }, { h: '9:00', c: '#06D6A0' }, { h: '', c: '' }, { h: '10:00', c: '#0891B2' }, { h: '9:30', c: '#F59E0B' },
                { h: '11:00', c: '#0891B2' }, { h: '', c: '' }, { h: '11:00', c: '#06D6A0' }, { h: '11:30', c: '#0891B2' }, { h: '', c: '' },
              ].map((b, i) => (
                <div key={i} className="h-4 rounded" style={{ background: b.c ? `${b.c}30` : 'transparent', borderLeft: b.c ? `2px solid ${b.c}` : 'none' }}>
                  {b.h && <span className="text-[6px] pl-0.5" style={{ color: b.c }}>{b.h}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingFlowMockup() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Step 1: Service */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F1419] p-3">
        <p className="text-[8px] uppercase tracking-[0.5px] text-[#94A3B8] mb-2">Servicio</p>
        {['Consulta general', 'Limpieza dental', 'Ortodoncia'].map((s, i) => (
          <div key={s} className={`rounded-lg border px-2 py-1.5 mb-1 text-[9px] ${i === 1 ? 'border-[#0891B2] bg-[#0891B2]/10 text-[#00B8E6]' : 'border-[rgba(255,255,255,0.06)] text-[#94A3B8]'}`}>
            {s}
          </div>
        ))}
      </div>
      {/* Step 2: Date */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F1419] p-3">
        <p className="text-[8px] uppercase tracking-[0.5px] text-[#94A3B8] mb-2">Fecha y hora</p>
        <div className="flex gap-1 mb-2">
          {['Mar 8', 'Mié 9', 'Jue 10'].map((d, i) => (
            <div key={d} className={`rounded px-1.5 py-0.5 text-[8px] ${i === 1 ? 'bg-[#0891B2]/20 text-[#00B8E6]' : 'text-[#475569]'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {['09:00', '11:30', '15:00', '17:00'].map((t, i) => (
            <div key={t} className={`rounded text-center py-1 text-[9px] ${i === 1 ? 'bg-[#0891B2]/20 text-[#00B8E6]' : 'border border-[rgba(255,255,255,0.06)] text-[#94A3B8]'}`}>{t}</div>
          ))}
        </div>
      </div>
      {/* Step 3: Confirm */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F1419] p-3">
        <p className="text-[8px] uppercase tracking-[0.5px] text-[#94A3B8] mb-2">Confirmar</p>
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] p-2 space-y-1 mb-2">
          <p className="text-[9px] text-[#E2E8F0]">Limpieza dental</p>
          <p className="text-[8px] text-[#475569]">Mié 9 · 11:30 · Dra. García</p>
        </div>
        <div className="rounded-lg bg-[#0891B2] py-1.5 text-center text-[9px] text-[#060608] font-medium">Confirmar</div>
      </div>
    </div>
  )
}

function ClientCardMockup() {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F1419] p-4 shadow-[0_0_40px_rgba(6,214,160,0.06)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-[7px] flex items-center justify-center text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #0891B2, #06D6A0)' }}>MR</div>
        <div><p className="text-sm text-[#E2E8F0] font-medium">María Rodríguez</p><p className="text-[10px] text-[#475569]">+52 55 8234 5678</p></div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[{ l: 'Citas', v: '28', c: '#0891B2' }, { l: 'Total', v: '$12.5K', c: '#10B981' }, { l: 'Asistencia', v: '94%', c: '#06D6A0' }].map(s => (
          <div key={s.l} className="text-center rounded-lg border border-[rgba(255,255,255,0.06)] py-2">
            <p className="text-[8px] uppercase tracking-[0.5px] text-[#475569]">{s.l}</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {[{ d: 'Hoy 15:00', s: 'Consulta', st: '#0891B2' }, { d: 'Mar 3', s: 'Limpieza', st: '#10B981' }, { d: 'Feb 18', s: 'Ortodoncia', st: '#10B981' }].map(a => (
          <div key={a.d} className="flex items-center justify-between text-[10px] py-1 border-b border-[rgba(255,255,255,0.04)] last:border-0">
            <span className="text-[#94A3B8]">{a.d}</span><span className="text-[#CBD5E1]">{a.s}</span>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.st }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniChatMockup() {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0F1419] p-3 shadow-[0_0_30px_rgba(0,184,230,0.06)] max-w-[280px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div className="h-6 w-6 rounded-full bg-[#25D366] flex items-center justify-center"><MessageSquare className="h-3 w-3 text-white" /></div>
        <p className="text-[10px] text-[#94A3B8]">Agente IA · En línea</p>
      </div>
      <div className="space-y-1.5">
        <div className="rounded-lg bg-[rgba(255,255,255,0.05)] px-2.5 py-1.5 max-w-[75%]"><p className="text-[10px] text-[#CBD5E1]">Quiero reagendar mi cita</p></div>
        <div className="rounded-lg bg-[#0891B2]/20 px-2.5 py-1.5 max-w-[80%] ml-auto"><p className="text-[10px] text-[#00B8E6]">Claro, tienes opciones mañana a las 10:00 y 14:30. ¿Cuál prefieres?</p></div>
        <div className="rounded-lg bg-[rgba(255,255,255,0.05)] px-2.5 py-1.5 max-w-[50%]"><p className="text-[10px] text-[#CBD5E1]">14:30</p></div>
        <div className="rounded-lg bg-[#0891B2]/20 px-2.5 py-1.5 max-w-[80%] ml-auto"><p className="text-[10px] text-[#00B8E6]">Listo, reagendada para mañana 14:30. ✅</p></div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div id="top" className="relative bg-[#060608] text-[#E2E8F0]">
      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 z-[5] opacity-[0.25] mix-blend-overlay">
        <svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" /></filter><rect width="100%" height="100%" filter="url(#g)" /></svg>
      </div>

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#060608]/80 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center justify-between px-6 md:px-12 py-4 max-w-[1200px] mx-auto">
          <a href="#top" className="flex items-center gap-2 cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-[#00B8E6] flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-[#060608]" /></div>
            <span className="text-base font-medium tracking-[0.5px]">cupo</span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#precios" className="relative text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors hidden md:block group">Precios<span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-[#00B8E6] group-hover:w-full transition-all duration-300" /></a>
            <a href="#faq" className="relative text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors hidden md:block group">FAQ<span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-[#00B8E6] group-hover:w-full transition-all duration-300" /></a>
            <Link href="/login" className="text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition-colors">Iniciar sesión</Link>
            <Link href="/register" className="rounded-[8px] bg-[#00B8E6] px-4 py-2 text-sm font-medium text-[#060608] transition-all duration-200 hover:scale-[0.97] active:scale-[0.95]">Empezar gratis</Link>
          </div>
        </div>
      </nav>

      {/* ═══ 1. HERO ═══ */}
      <section className="relative overflow-hidden">
        <Arcs className="-top-40 -right-40" opacity={0.12} />
        <div className="pointer-events-none absolute top-1/2 right-[15%] -translate-y-1/2 w-[500px] h-[500px] rounded-full z-0" style={{ background: 'radial-gradient(circle, rgba(0,184,230,0.08) 0%, transparent 70%)' }} />
        <div className="relative z-20 px-6 md:px-12 pt-20 pb-28 max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex gap-2 mb-6">
                {['WhatsApp IA', 'Booking page', 'Pagos'].map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(8,145,178,0.25)] px-3 py-1 text-[10px] uppercase tracking-[1.5px] text-[#94A3B8]"><span className="h-1 w-1 rounded-full bg-[#00B8E6]" />{t}</span>
                ))}
              </div>
              <h1 className="text-[34px] md:text-[44px] tracking-[-1.2px] leading-[1.08]">
                <span className="font-normal">Cada horario </span><span className="font-medium text-[#00B8E6]">lleno</span><span className="font-normal">,</span><br />
                <span className="font-normal">cada cliente </span><span className="font-medium bg-gradient-to-r from-[#00B8E6] to-[#06D6A0] bg-clip-text text-transparent">atendido.</span>
              </h1>
              <p className="mt-5 text-[15px] leading-[1.7] text-[#94A3B8] max-w-[440px]">El sistema de agendamiento con IA que atiende tu WhatsApp 24/7, agenda citas, cobra y te deja enfocarte en lo que importa.</p>
              <div className="mt-8 flex gap-3">
                <Link href="/register" className="group rounded-[8px] bg-[#00B8E6] px-6 py-3 text-sm font-medium text-[#060608] transition-all duration-300 hover:bg-gradient-to-r hover:from-[#00B8E6] hover:to-[#06D6A0] active:scale-[0.97]">Empezar gratis — 14 días</Link>
                <a href="#como-funciona" className="rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-3 text-sm font-medium backdrop-blur-[20px] transition-all duration-200 hover:border-[rgba(255,255,255,0.15)] active:scale-[0.97]">Ver cómo funciona</a>
              </div>
              <div className="mt-10 inline-flex rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] backdrop-blur-[20px] p-4 gap-4">
                <div><p className="text-[10px] uppercase tracking-[1.5px] text-[#94A3B8]">Citas esta semana</p><p className="text-[26px] font-medium tracking-[-1px]">847</p></div>
                <div className="w-[1px] bg-[rgba(255,255,255,0.08)]" />
                <div><p className="text-[10px] uppercase tracking-[1.5px] text-[#10B981]">+12%</p><p className="text-xs text-[#475569] mt-1">vs semana pasada</p></div>
              </div>
            </div>
            {/* WhatsApp preview */}
            <div className="rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] backdrop-blur-[20px] p-5 max-w-[380px] ml-auto shadow-[0_0_60px_rgba(0,184,230,0.06)]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.06)]">
                <div className="h-8 w-8 rounded-full bg-[#25D366] flex items-center justify-center"><MessageSquare className="h-4 w-4 text-white" /></div>
                <div><p className="text-sm font-medium">Clínica Dental Sonríe</p><p className="text-[10px] text-[#94A3B8]">Agente IA · En línea</p></div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-[rgba(255,255,255,0.06)] px-3.5 py-2.5 max-w-[80%]"><p className="text-[13px] text-[#CBD5E1]">Hola, quiero agendar una limpieza dental para mañana</p><p className="text-[9px] text-[#475569] text-right mt-1">10:23</p></div>
                <div className="rounded-xl bg-[#0891B2]/20 px-3.5 py-2.5 max-w-[85%] ml-auto">
                  <p className="text-[13px] text-[#00B8E6]">¡Hola! Claro, tenemos estos horarios disponibles mañana para limpieza dental:</p>
                  <div className="mt-2 flex flex-wrap gap-1">{['09:00', '11:30', '15:00', '17:00'].map(t => (<span key={t} className="rounded bg-[rgba(0,184,230,0.15)] px-2 py-0.5 text-[11px] text-[#00B8E6]">{t}</span>))}</div>
                  <p className="text-[13px] text-[#00B8E6] mt-2">¿Cuál te queda mejor?</p>
                  <div className="flex items-center gap-1 mt-1"><span className="h-1 w-1 rounded-full bg-[#00B8E6]" /><p className="text-[9px] text-[#0891B2]">Agente IA · 10:23</p></div>
                </div>
                <div className="rounded-xl bg-[rgba(255,255,255,0.06)] px-3.5 py-2.5 max-w-[60%]"><p className="text-[13px] text-[#CBD5E1]">El de las 11:30 porfa</p><p className="text-[9px] text-[#475569] text-right mt-1">10:24</p></div>
                <div className="rounded-xl bg-[#0891B2]/20 px-3.5 py-2.5 max-w-[85%] ml-auto">
                  <p className="text-[13px] text-[#00B8E6]">¡Listo! Tu cita queda confirmada para mañana a las 11:30 con la Dra. García. Te enviaré un recordatorio. ✅</p>
                  <div className="flex items-center gap-1 mt-1"><span className="h-1 w-1 rounded-full bg-[#00B8E6]" /><p className="text-[9px] text-[#0891B2]">Agente IA · 10:24</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), transparent)' }} />

      {/* ═══ 2. PROBLEMA — horizontal layout ═══ */}
      <section className="relative z-20 px-6 md:px-12 py-20 max-w-[1200px] mx-auto">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={{ background: 'linear-gradient(to bottom, #EF4444, #F59E0B, transparent)' }} />
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-16 items-start pl-6">
          <div>
            <Tag>El problema</Tag>
            <h2 className="text-[36px] font-medium tracking-[-1px] leading-[1.15]">¿Tu negocio pierde citas por estas razones?</h2>
          </div>
          <div className="space-y-6">
            {[
              { icon: Smartphone, title: 'Agendas por WhatsApp personal', desc: 'Se te pierden mensajes, olvidas responder, y los clientes se van con la competencia.' },
              { icon: BarChart3, title: 'Tu libreta o Excel no te avisa', desc: 'No sabes quién canceló, quién no llegó, ni cuánto dejas de ganar por huecos en tu agenda.' },
              { icon: Clock, title: 'Pierdes horas contestando lo mismo', desc: '"¿Qué horarios tienen?" "¿Cuánto cuesta?" Una y otra vez. Todo el día.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 rounded-[10px] bg-[rgba(255,255,255,0.03)] p-4">
                <div className="h-2 w-2 rounded-full bg-[#EF4444] mt-2.5 flex-shrink-0" />
                <div>
                  <h3 className="text-[18px] font-medium text-[#E2E8F0]">{item.title}</h3>
                  <p className="text-[14px] text-[#94A3B8] leading-[1.6] mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center mt-12 text-sm text-[#94A3B8] pl-6">
          No eres tú — es que <span className="bg-gradient-to-r from-[#00B8E6] to-[#06D6A0] bg-clip-text text-transparent font-medium">no tienes el sistema correcto.</span>
        </p>
      </section>

      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(8,145,178,0.3), transparent)' }} />

      {/* ═══ 3. SOLUCIÓN — left text + right mockup ═══ */}
      <section className="relative z-20 px-6 md:px-12 py-24 max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Tag>La solución</Tag>
            <h2 className="text-[28px] font-medium tracking-[-1px] leading-[1.2]">
              cupo hace todo esto por ti, <span className="bg-gradient-to-r from-[#00B8E6] to-[#06D6A0] bg-clip-text text-transparent">automáticamente</span>
            </h2>
            <div className="mt-8 space-y-6">
              {[
                { icon: MessageSquare, title: 'Agente de WhatsApp con IA', desc: 'Responde a tus clientes 24/7, muestra horarios disponibles, agenda y cobra. Como tener una recepcionista que nunca descansa.', color: '#25D366' },
                { icon: Globe, title: 'Página de reservas profesional', desc: 'Tus clientes agendan solos desde una página con tu marca. Sin llamadas, sin esperas.', color: '#00B8E6' },
                { icon: BarChart3, title: 'Panel de control inteligente', desc: 'Calendario, clientes, pagos, estadísticas — todo en un solo lugar. Desde tu celular o computadora.', color: '#06D6A0' },
              ].map(item => (
                <div key={item.title} className="flex gap-4">
                  <div className="h-10 w-10 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                    <item.icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#E2E8F0]">{item.title}</h3>
                    <p className="text-[13px] text-[#94A3B8] leading-[1.6] mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="md:pl-6">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,184,230,0.2), rgba(6,214,160,0.2), transparent)' }} />

      {/* ═══ 4. CÓMO FUNCIONA — horizontal steps + booking mockup ═══ */}
      <section id="como-funciona" className="relative z-20 px-6 md:px-12 py-24 max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <Tag>Cómo funciona</Tag>
          <h2 className="text-[28px] font-medium tracking-[-1px]">Listo en 5 minutos, sin técnicos</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative mb-16">
          {[
            { num: '01', title: 'Configura tu negocio', desc: 'Nombre, servicios, horarios, equipo. Un wizard te guía paso a paso.' },
            { num: '02', title: 'Comparte tu página', desc: 'Envía el link de tu booking page por WhatsApp, redes sociales, o tu sitio web.' },
            { num: '03', title: 'Recibe citas automáticas', desc: 'Tus clientes agendan solos. La IA contesta WhatsApp. Tú solo atiendes.' },
          ].map(step => (
            <div key={step.num} className="relative text-center">
              <div className="relative z-10 inline-flex items-center justify-center h-20 w-20 mx-auto mb-4">
                <span className="text-[48px] font-medium tracking-[-2px]" style={{ WebkitTextStroke: '1.5px #0891B2', WebkitTextFillColor: 'transparent' }}>{step.num}</span>
              </div>
              <h3 className="text-base font-medium mb-2">{step.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-[1.7]">{step.desc}</p>
            </div>
          ))}
        </div>

        <BookingFlowMockup />
      </section>

      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(8,145,178,0.3), transparent)' }} />

      {/* ═══ 5. FEATURES — alternating groups with mockups ═══ */}
      <section className="relative z-20 px-6 md:px-12 py-24 max-w-[1200px] mx-auto space-y-24">
        <div className="text-center">
          <Tag>Funcionalidades</Tag>
          <h2 className="text-[28px] font-medium tracking-[-1px]">Todo lo que necesitas para llenar tu agenda</h2>
        </div>

        {/* Group 1: Calendar — mockup LEFT, features RIGHT */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <DashboardMockup />
          <div className="space-y-5">
            <h3 className="text-[28px] font-medium tracking-[-0.5px] bg-gradient-to-r from-[#00B8E6] to-[#06D6A0] bg-clip-text text-transparent">Calendario y Reservas</h3>
            {[
              { icon: Calendar, title: 'Calendario inteligente', desc: 'Vista día, semana y mes. Arrastra para reagendar. Crea citas manuales.' },
              { icon: Zap, title: 'Google Calendar sync', desc: 'Sincronización bidireccional. Tus bloqueos personales se respetan automáticamente.' },
              { icon: Video, title: 'Citas virtuales con Meet', desc: 'Para consultas online, se genera un link de Google Meet automáticamente.' },
            ].map(f => (
              <div key={f.title} className="flex gap-3">
                <f.icon className="h-4 w-4 text-[#0891B2] mt-0.5 flex-shrink-0" />
                <div><h4 className="text-sm font-medium">{f.title}</h4><p className="text-[13px] text-[#94A3B8] leading-[1.6] mt-0.5">{f.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Group 2: Clients — features LEFT, mockup RIGHT */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5 md:order-1">
            <h3 className="text-[28px] font-medium tracking-[-0.5px] bg-gradient-to-r from-[#06D6A0] to-[#10B981] bg-clip-text text-transparent">Pagos y Clientes</h3>
            {[
              { icon: CreditCard, title: 'Pagos con Stripe', desc: 'Cobra anticipos o el servicio completo. El dinero llega directo a tu cuenta.' },
              { icon: Users, title: 'Gestión de clientes', desc: 'Historial de citas, gastos, no-shows. Conoce a tus clientes mejor que nadie.' },
              { icon: Bell, title: 'Recordatorios automáticos', desc: 'WhatsApp y email 24h y 2h antes. Reduce no-shows hasta 80%.' },
            ].map(f => (
              <div key={f.title} className="flex gap-3">
                <f.icon className="h-4 w-4 text-[#06D6A0] mt-0.5 flex-shrink-0" />
                <div><h4 className="text-sm font-medium">{f.title}</h4><p className="text-[13px] text-[#94A3B8] leading-[1.6] mt-0.5">{f.desc}</p></div>
              </div>
            ))}
          </div>
          <div className="md:order-2">
            <ClientCardMockup />
          </div>
        </div>

        {/* Group 3: Automation — mockup LEFT, features RIGHT */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <MiniChatMockup />
          <div className="space-y-5">
            <h3 className="text-[28px] font-medium tracking-[-0.5px] bg-gradient-to-r from-[#F59E0B] to-[#FB923C] bg-clip-text text-transparent">Automatización</h3>
            {[
              { icon: Shield, title: 'Multi-profesional', desc: 'Cada profesional con sus servicios, horarios y excepciones independientes.' },
              { icon: Webhook, title: 'Webhooks y API', desc: 'Conecta con N8N, Make, Zapier, o tu CRM. Tu negocio, tu ecosistema.' },
            ].map(f => (
              <div key={f.title} className="flex gap-3">
                <f.icon className="h-4 w-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                <div><h4 className="text-sm font-medium">{f.title}</h4><p className="text-[13px] text-[#94A3B8] leading-[1.6] mt-0.5">{f.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(8,145,178,0.3), transparent)' }} />

      {/* ═══ 6. COMPARACIÓN ═══ */}
      <section className="relative z-20 px-6 md:px-12 py-20 max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <Tag>Comparación</Tag>
          <h2 className="text-[28px] font-medium tracking-[-1px]">¿Por qué cupo y no otra herramienta?</h2>
        </div>
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden max-w-[800px] mx-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, rgba(8,145,178,0.15), rgba(6,214,160,0.1))' }}>
                <th className="px-5 py-4 text-left text-[10px] uppercase tracking-[1px] text-[#94A3B8] font-normal">Funcionalidad</th>
                <th className="px-4 py-4 text-center bg-[rgba(0,184,230,0.08)]"><span className="text-[#00B8E6] font-medium text-xs">cupo</span></th>
                <th className="px-4 py-4 text-center text-[#94A3B8] text-xs">Calendly</th>
                <th className="px-4 py-4 text-center text-[#94A3B8] text-xs">Manual</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Agente WhatsApp IA', true, false, false], ['Página de reservas', true, true, false],
                ['Google Calendar bidireccional', true, true, false], ['Pagos integrados', true, true, false],
                ['Precios en MXN/COP', true, false, false], ['Soporte en español', true, false, false],
              ].map(([feat, cupo, cal, manual]) => (
                <tr key={String(feat)} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <td className="px-5 py-3 text-[#CBD5E1] text-[13px]">{String(feat)}</td>
                  <td className="px-4 py-3 text-center bg-[rgba(0,184,230,0.04)]">{cupo ? <Check className="h-4 w-4 text-[#00B8E6] mx-auto" /> : <XIcon className="h-4 w-4 text-[#333] mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{cal ? <Check className="h-4 w-4 text-[#475569] mx-auto" /> : <XIcon className="h-4 w-4 text-[#333] mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{manual ? <Check className="h-4 w-4 text-[#475569] mx-auto" /> : <XIcon className="h-4 w-4 text-[#333] mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,184,230,0.2), transparent)' }} />

      {/* ═══ 7. PRECIOS ═══ */}
      <section id="precios" className="relative z-20 px-6 md:px-12 py-24 max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <Tag>Precios</Tag>
          <h2 className="text-[28px] font-medium tracking-[-1px]">Planes que crecen contigo</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 max-w-[920px] mx-auto items-start">
          {[
            { name: 'Starter', price: '$499', period: '/mes', popular: false, features: ['3 profesionales', 'Booking page', 'Calendario inteligente', 'Recordatorios email', 'Gestión de clientes'] },
            { name: 'Pro', price: '$999', period: '/mes', popular: true, features: ['10 profesionales', 'Todo de Starter +', 'Agente WhatsApp IA', 'Google Calendar sync', 'Analytics avanzados', 'Pagos con Stripe'] },
            { name: 'Business', price: '$2,499', period: '/mes', popular: false, features: ['30 profesionales', 'Todo de Pro +', 'API y webhooks', 'Multi-sucursal', 'Soporte prioritario', 'Onboarding dedicado'] },
          ].map(plan => (
            <div key={plan.name} className={`rounded-xl border p-6 relative transition-all duration-300 hover:-translate-y-1 ${
              plan.popular
                ? 'border-[#0891B2] md:-mt-4 md:pb-8 shadow-[0_0_40px_rgba(0,184,230,0.15)]'
                : 'border-[rgba(255,255,255,0.06)] opacity-90'
            }`} style={plan.popular ? { background: 'linear-gradient(to bottom, rgba(0,184,230,0.06), rgba(6,214,160,0.03))' } : { background: 'rgba(255,255,255,0.02)' }}>
              {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0891B2] px-3 py-0.5 text-[10px] font-medium text-white uppercase tracking-[1px]">Popular</span>}
              <h3 className="text-base font-medium">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className={`font-medium tracking-[-1px] ${plan.popular ? 'text-[36px]' : 'text-[32px]'}`}>{plan.price}</span>
                <span className="text-sm text-[#475569]">{plan.period}</span>
              </div>
              <Link href="/register" className={`mt-5 block w-full rounded-[8px] py-2.5 text-center text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                plan.popular ? 'bg-[#00B8E6] text-[#060608] hover:bg-gradient-to-r hover:from-[#00B8E6] hover:to-[#06D6A0]' : 'bg-[rgba(255,255,255,0.06)] text-[#E2E8F0] hover:bg-[rgba(255,255,255,0.1)]'
              }`}>Empezar gratis</Link>
              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (<li key={f} className="flex items-center gap-2 text-[13px] text-[#94A3B8]"><Check className="h-3.5 w-3.5 text-[#0891B2] flex-shrink-0" />{f}</li>))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center mt-8 text-xs text-[#475569]">14 días gratis en cualquier plan. Sin tarjeta. Cancela cuando quieras.</p>
      </section>

      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

      {/* ═══ 8. FAQ — left title, right accordion ═══ */}
      <section id="faq" className="relative z-20 px-6 md:px-12 py-20 max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-[1fr_1.5fr] gap-16">
          <div>
            <Tag>FAQ</Tag>
            <h2 className="text-[28px] font-medium tracking-[-1px] leading-[1.2]">Preguntas frecuentes</h2>
            <p className="mt-3 text-sm text-[#94A3B8]">¿Tienes dudas? Aquí las respuestas más comunes.</p>
          </div>
          <div className="space-y-2">
            {[
              { q: '¿Necesito saber de tecnología?', a: 'No. Te toma 5 minutos configurar todo con nuestro wizard. Si sabes usar WhatsApp, sabes usar cupo.' },
              { q: '¿Funciona para mi tipo de negocio?', a: 'Si agendas citas (salón, clínica, gym, consultoría, spa, veterinaria, etc.), funciona para ti.' },
              { q: '¿Los pagos llegan a mi cuenta?', a: 'Sí. Conectas tu propio Stripe y los pagos van directo a ti. cupo no toca tu dinero.' },
              { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí. Sin contratos, sin penalizaciones. Cancelas y listo.' },
              { q: '¿El agente de WhatsApp realmente funciona?', a: 'Sí. Usa inteligencia artificial para entender lo que tu cliente necesita, mostrar horarios reales y agendar. No es un bot de menús.' },
              { q: '¿Qué pasa si ya tengo Google Calendar?', a: 'Se sincroniza bidireccional. Lo que bloquees en Google se respeta en cupo y viceversa.' },
            ].map(item => (
              <details key={item.q} className="group rounded-lg border border-[rgba(255,255,255,0.06)] open:border-l-[3px] open:border-l-[#0891B2] transition-all">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium list-none">
                  {item.q}<ChevronDown className="h-4 w-4 text-[#94A3B8] group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <p className="px-5 pb-4 text-[13px] text-[#94A3B8] leading-[1.7]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 9. CTA FINAL ═══ */}
      <section className="relative overflow-hidden py-28">
        <Arcs className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" opacity={0.15} />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,184,230,0.1) 0%, rgba(6,214,160,0.05) 40%, transparent 70%)' }} />
        <div className="relative z-20 text-center px-6">
          <h2 className="text-[36px] font-medium tracking-[-1.2px]">
            ¿Listo para llenar tu <span className="bg-gradient-to-r from-[#00B8E6] to-[#06D6A0] bg-clip-text text-transparent">agenda</span>?
          </h2>
          <p className="mt-3 text-sm text-[#94A3B8]">Únete a los negocios que ya usan cupo para automatizar sus citas.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-[8px] bg-[#00B8E6] px-12 py-4 text-sm font-medium text-[#060608] transition-all duration-300 hover:bg-gradient-to-r hover:from-[#00B8E6] hover:to-[#06D6A0] active:scale-[0.97]">
            Empezar gratis <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-[#475569]">Configuración en 5 minutos · 14 días gratis · Sin tarjeta</p>
        </div>
      </section>

      {/* ═══ 10. FOOTER ═══ */}
      <footer className="relative z-20 bg-[#040406] border-t border-[rgba(255,255,255,0.04)] px-6 md:px-12 py-10">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2"><div className="h-6 w-6 rounded-md bg-[#00B8E6] flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-[#060608]" /></div><span className="text-sm font-medium tracking-[0.5px]">cupo</span></div>
          <div className="flex items-center gap-6 text-xs text-[#475569]">
            <a href="#precios" className="hover:text-[#E2E8F0] transition-colors">Precios</a>
            <a href="#faq" className="hover:text-[#E2E8F0] transition-colors">FAQ</a>
            <span>Términos</span><span>Privacidad</span>
          </div>
          <p className="text-xs text-[#475569]">Hecho con amor por VADAI desde México</p>
        </div>
      </footer>
    </div>
  )
}
