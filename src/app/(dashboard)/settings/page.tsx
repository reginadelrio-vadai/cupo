'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Webhook, Key, Plug } from 'lucide-react'
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
      <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Configuración</h1>
      <p className="mt-1 text-sm text-[#475569] mb-6">Gestiona tu negocio y preferencias</p>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Webhooks', href: '/settings/webhooks', icon: Webhook, desc: 'Endpoints y logs' },
          { label: 'Integraciones', href: '/settings/integrations', icon: Plug, desc: 'Google, Stripe, WhatsApp' },
          { label: 'API Keys', href: '/settings/api-keys', icon: Key, desc: 'Llaves para el agente' },
        ].map(link => (
          <button key={link.href} onClick={() => router.push(link.href)}
            className="rounded-[10px] border border-[#E2E8F0] bg-white p-4 text-left hover:border-[#CBD5E1] transition-colors">
            <link.icon className="h-5 w-5 text-[#0891B2] mb-2" />
            <p className="text-sm font-medium text-[#0F172A]">{link.label}</p>
            <p className="text-[11px] text-[#94A3B8]">{link.desc}</p>
          </button>
        ))}
      </div>

      {/* Subscription info */}
      <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5 mb-6">
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-2">Plan actual</p>
        <div className="flex items-center gap-3">
          <span className="text-lg font-medium text-[#0F172A]">{String(plan?.name || 'Free')}</span>
          <span className="rounded-[4px] bg-[#0891B2]/[0.06] px-2 py-0.5 text-[10px] text-[#0891B2]">
            {String(sub?.status || 'active')}
          </span>
        </div>
      </div>

      {/* Organization settings */}
      <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5 space-y-4 mb-6">
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
      </div>

      {/* Booking page settings */}
      <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5 space-y-4 mb-6">
        <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">Booking page</p>
        <div className="flex items-center justify-between">
          <Label className="text-sm text-[#475569]">Página activa</Label>
          <Switch checked={!!config?.is_active} onCheckedChange={v => setConfig(prev => ({ ...prev!, is_active: v }))} />
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
