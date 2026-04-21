'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Webhook, Key, Plug, X, Check, Sparkles, Copy, Link2, Upload, Image as ImageIcon } from 'lucide-react'
import { VALID_TIMEZONES } from '@/lib/constants'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

export default function SettingsPage() {
  const router = useRouter()
  const [org, setOrg] = useState<Record<string, unknown> | null>(null)
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [sub, setSub] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/settings').then(r => r.json()).then(d => {
      setOrg(d.data?.organization); setConfig(d.data?.bookingConfig); setSub(d.data?.subscription)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/dashboard/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization: org, bookingConfig: config }),
    })
    setSaving(false)
    if (res.ok) toast.success('Configuración guardada')
    else toast.error('Error al guardar')
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>

  const plan = sub?.subscription_plans as Record<string, unknown> | null

  return (
    <div>
      <h1 className="text-[28px] font-medium tracking-[-1px]" style={{ color: 'var(--dash-text)' }}>Configuración</h1>
      <p className="mt-1 text-[13px] mb-6" style={{ color: 'var(--dash-text-muted)' }}>Gestiona tu negocio y preferencias</p>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Webhooks', href: '/settings/webhooks', icon: Webhook, desc: 'Endpoints y logs', color: '#0891B2' },
          { label: 'Integraciones', href: '/settings/integrations', icon: Plug, desc: 'Google, Stripe, WhatsApp', color: '#06D6A0' },
          { label: 'API Keys', href: '/settings/api-keys', icon: Key, desc: 'Llaves para el agente', color: '#F59E0B' },
        ].map(link => (
          <button key={link.href} onClick={() => router.push(link.href)}
            className="group rounded-xl border-[0.5px] border-[#E2E8F0] bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${link.color}, transparent)` }} />
            <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${link.color}12` }}>
              <link.icon className="h-4 w-4" style={{ color: link.color }} />
            </div>
            <p className="text-sm font-medium text-[#0F172A]">{link.label}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">{link.desc}</p>
          </button>
        ))}
      </div>

      {/* Subscription info */}
      <div className="rounded-xl border-[0.5px] border-[#E2E8F0] bg-white p-5 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, #00B8E6, #0891B2, #06D6A0, transparent)' }} />
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-2">Plan actual</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-medium text-[#0F172A]">{String(plan?.name || 'Free')}</span>
            <span className="rounded-[4px] bg-[#0891B2]/[0.06] px-2 py-0.5 text-[10px] text-[#0891B2]">
              {String(sub?.status || 'active')}
            </span>
          </div>
          <Button
            onClick={() => setShowPlanModal(true)}
            className="bg-[#00B8E6] text-[#060608] hover:opacity-80 gap-1.5"
            size="sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Mejorar plan
          </Button>
        </div>
      </div>

      {showPlanModal && (
        <PlanComparisonModal
          currentPlanSlug={String(plan?.slug || 'free')}
          onClose={() => setShowPlanModal(false)}
        />
      )}

      {/* Organization settings */}
      <div className="rounded-xl border-[0.5px] border-[#E2E8F0] bg-white p-5 space-y-4 mb-6">
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Negocio</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre</Label>
            <Input value={String(org?.name || '')} onChange={e => setOrg(prev => ({ ...prev!, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Timezone</Label>
            <select value={String(org?.timezone || '')} onChange={e => setOrg(prev => ({ ...prev!, timezone: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {VALID_TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Teléfono</Label>
            <Input value={String(org?.phone || '')} onChange={e => setOrg(prev => ({ ...prev!, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Email</Label>
            <Input value={String(org?.email || '')} onChange={e => setOrg(prev => ({ ...prev!, email: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8] m-0">Color de marca</Label>
          <label className="relative inline-block h-8 w-8 cursor-pointer rounded-lg border border-[#E2E8F0] overflow-hidden">
            <input
              type="color"
              value={String(org?.primary_color || '#00B8E6')}
              onChange={e => setOrg(prev => ({ ...prev!, primary_color: e.target.value }))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <div className="h-full w-full rounded-[7px]" style={{ backgroundColor: String(org?.primary_color || '#00B8E6') }} />
          </label>
        </div>
      </div>

      {/* Logo upload */}
      <LogoUploadSection
        logoUrl={(org?.logo_url as string) || null}
        orgName={String(org?.name || '')}
        onUploaded={(url) => setOrg(prev => ({ ...prev!, logo_url: url }))}
      />

      {/* Booking link */}
      <BookingLinkSection slug={String(org?.slug || '')} />

      {/* Booking page settings */}
      <div className="rounded-xl border-[0.5px] border-[#E2E8F0] bg-white p-5 space-y-4 mb-6">
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Booking page</p>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-[#475569]">Página activa</Label>
          <Switch checked={!!config?.is_active} onCheckedChange={v => setConfig(prev => ({ ...prev!, is_active: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-[#475569]">Mostrar nombre en página de reservas</Label>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Útil ocultarlo si tu logo ya contiene el nombre</p>
          </div>
          <Switch
            checked={config?.show_name_on_booking !== false}
            onCheckedChange={v => setConfig(prev => ({ ...prev!, show_name_on_booking: v }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Mensaje de bienvenida</Label>
          <Input value={String(config?.welcome_message || '')} onChange={e => setConfig(prev => ({ ...prev!, welcome_message: e.target.value }))} placeholder="Bienvenido a nuestro negocio" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Anticipación mínima (horas)</Label>
            <Input type="number" value={String(config?.min_advance_hours ?? 2)} onChange={e => setConfig(prev => ({ ...prev!, min_advance_hours: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Anticipación máxima (días)</Label>
            <Input type="number" value={String(config?.max_advance_days ?? 30)} onChange={e => setConfig(prev => ({ ...prev!, max_advance_days: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-[#00B8E6] text-[#060608] hover:opacity-80">
        {saving ? 'Guardando...' : 'Guardar configuración'}
      </Button>
      <Toaster position="bottom-right" />
    </div>
  )
}

/* ── Logo Upload Section ── */

const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']

function LogoUploadSection({
  logoUrl,
  orgName,
  onUploaded,
}: {
  logoUrl: string | null
  orgName: string
  onUploaded: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError('Formato no soportado. Usa PNG, JPG o SVG.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_LOGO_SIZE) {
      setError('El archivo supera el máximo de 2MB.')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/dashboard/settings/logo', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.message || 'Error al subir el logo')
      } else {
        onUploaded(json.data.logo_url)
        toast.success('Logo actualizado')
      }
    } catch {
      setError('Error de red al subir')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="rounded-xl border-[0.5px] border-[#E2E8F0] bg-white p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="h-4 w-4 text-[#0891B2]" />
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Logo de tu empresa</p>
      </div>
      <div className="flex items-center gap-4">
        <div
          className="h-[120px] w-[120px] rounded-xl border-[0.5px] border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center overflow-hidden flex-shrink-0"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[28px] font-medium text-[#94A3B8]">
              {orgName[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <label className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-[#475569] hover:bg-[#F8FAFC] transition-colors cursor-pointer">
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? 'Subiendo...' : logoUrl ? 'Cambiar logo' : 'Subir logo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
          <p className="mt-2 text-[11px] text-[#94A3B8]">PNG, JPG o SVG. Máximo 2MB.</p>
          {error && <p className="mt-2 text-[12px] text-[#EF4444]">{error}</p>}
        </div>
      </div>
    </div>
  )
}

/* ── Booking Link Section ── */

function BookingLinkSection({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const [bookingUrl, setBookingUrl] = useState('')

  useEffect(() => {
    if (!slug) return
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    const base = envUrl && !envUrl.includes('localhost')
      ? envUrl
      : (typeof window !== 'undefined' ? window.location.origin : envUrl || '')
    setBookingUrl(`${base}/book/${slug}`)
  }, [slug])

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!slug) return null

  return (
    <div className="rounded-xl border-[0.5px] border-[#E2E8F0] bg-white p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="h-4 w-4 text-[#0891B2]" />
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Link de reservas</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={bookingUrl}
          className="flex-1 h-9 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-[13px] text-[#475569] font-mono select-all focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-[#475569] hover:bg-[#F8FAFC] transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

/* ── Plan Comparison Modal ── */

const PLANS = [
  {
    slug: 'free', name: 'Gratis', price: '$0', period: '/mes',
    features: ['1 profesional', '3 servicios', '50 citas/mes', 'Booking page', 'Calendario'],
    missing: ['Agente WhatsApp IA', 'Google Calendar', 'Webhooks', 'API'],
  },
  {
    slug: 'professional', name: 'Profesional', price: '$499', period: '/mes', popular: true,
    features: ['3 profesionales', '10 servicios', '500 citas/mes', 'Booking page', 'Calendario', 'Agente WhatsApp IA', 'Google Calendar sync', 'Pagos con Stripe', 'Recordatorios'],
    missing: ['Webhooks', 'API'],
  },
  {
    slug: 'business', name: 'Business', price: '$999', period: '/mes',
    features: ['10 profesionales', '50 servicios', 'Citas ilimitadas', 'Todo de Profesional +', 'API y webhooks', 'Multi-sucursal', 'Soporte prioritario', 'Onboarding dedicado'],
    missing: [],
  },
]

function PlanComparisonModal({ currentPlanSlug, onClose }: { currentPlanSlug: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[780px] rounded-xl border-[0.5px] border-[#E2E8F0] bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h3 className="text-[17px] font-medium text-[#0F172A]">Mejorar plan</h3>
            <p className="text-[13px] text-[#94A3B8] mt-0.5">Elige el plan ideal para tu negocio</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 p-6">
          {PLANS.map(p => {
            const isCurrent = p.slug === currentPlanSlug
            return (
              <div
                key={p.slug}
                className={`rounded-xl border p-5 relative transition-all duration-200 ${
                  p.popular
                    ? 'border-[#0891B2] shadow-[0_0_20px_rgba(0,184,230,0.1)]'
                    : 'border-[#E2E8F0]'
                } ${isCurrent ? 'opacity-75' : 'hover:-translate-y-0.5'}`}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#0891B2] px-3 py-0.5 text-[9px] font-medium text-white uppercase tracking-[1px]">
                    Recomendado
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute top-3 right-3 rounded-[4px] bg-[#0891B2]/[0.08] px-2 py-0.5 text-[9px] text-[#0891B2] uppercase tracking-[0.5px] font-medium">
                    Plan actual
                  </span>
                )}
                <h4 className="text-[15px] font-medium text-[#0F172A]">{p.name}</h4>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">{p.price}</span>
                  <span className="text-[13px] text-[#94A3B8]">{p.period}</span>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => {
                    console.log('Upgrade to:', p.slug)
                    onClose()
                  }}
                  className={`mt-4 w-full rounded-lg py-2 text-[13px] font-medium transition-all duration-200 active:scale-[0.97] ${
                    isCurrent
                      ? 'bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed'
                      : p.popular
                        ? 'bg-[#00B8E6] text-[#060608] hover:opacity-80'
                        : 'bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {isCurrent ? 'Plan actual' : 'Seleccionar'}
                </button>

                <ul className="mt-5 space-y-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-[#475569]">
                      <Check className="h-3.5 w-3.5 text-[#0891B2] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {p.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-[#CBD5E1]">
                      <X className="h-3.5 w-3.5 text-[#E2E8F0] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <div className="border-t border-[#E2E8F0] px-6 py-3 text-center">
          <p className="text-[11px] text-[#94A3B8]">14 días gratis en cualquier plan. Sin tarjeta. Cancela cuando quieras.</p>
        </div>
      </div>
    </div>
  )
}
