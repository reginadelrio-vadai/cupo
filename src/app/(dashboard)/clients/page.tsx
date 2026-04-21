'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Users, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  source: string
  created_at: string
}

const COUNTRY_CODES = [
  { code: '+52', label: '🇲🇽 +52' },
  { code: '+57', label: '🇨🇴 +57' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+54', label: '🇦🇷 +54' },
  { code: '+56', label: '🇨🇱 +56' },
  { code: '+51', label: '🇵🇪 +51' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+58', label: '🇻🇪 +58' },
  { code: '+593', label: '🇪🇨 +593' },
  { code: '+502', label: '🇬🇹 +502' },
]

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchClients = (query: string) => {
    const params = new URLSearchParams()
    if (query) params.set('search', query)
    params.set('sort', 'created_at')

    fetch(`/api/dashboard/clients?${params}`)
      .then(r => r.json())
      .then(data => { setClients(data.data?.clients || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchClients(search) }, [search])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-medium tracking-[-1px]" style={{ color: 'var(--dash-text)' }}>Clientes</h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--dash-text-muted)' }}>{clients.length} clientes registrados</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-[#00B8E6] text-[#060608] hover:opacity-80">
          <Plus className="h-4 w-4 mr-1" /> Agregar cliente
        </Button>
      </div>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--dash-text-muted)' }} />
        <input
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 rounded-xl border-[0.5px] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 transition-colors"
          style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)', color: 'var(--dash-text)' }}
        />
      </div>

      <div className="mt-4 rounded-xl border-[0.5px] overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--dash-surface)', borderColor: 'var(--dash-border)' }}>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--dash-text-muted)' }} /></div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--dash-text-muted)' }} />
            <p className="text-[13px]" style={{ color: 'var(--dash-text-muted)' }}>No hay clientes aún</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--dash-border)' }}>
                {['Nombre', 'Teléfono', 'Email', 'Fuente'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-[1px] font-normal" style={{ color: 'var(--dash-text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer transition-colors duration-150"
                  style={{ borderBottom: '0.5px solid var(--dash-border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dash-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-[7px] flex items-center justify-center text-[11px] font-medium text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0891B2, #06D6A0)' }}>
                        {client.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--dash-text)' }}>{client.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>{client.phone || '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--dash-text-secondary)' }}>{client.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-[4px] px-2 py-0.5 text-[10px]" style={{ backgroundColor: 'var(--dash-hover)', color: 'var(--dash-text-muted)' }}>
                      {client.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            fetchClients(search)
          }}
        />
      )}

      <Toaster position="bottom-right" />
    </div>
  )
}

function AddClientModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+52')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; general?: string }>({})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const nextErrors: typeof errors = {}
    if (!name.trim()) nextErrors.name = 'El nombre es requerido'
    const localDigits = phone.replace(/\D/g, '')
    if (!localDigits) nextErrors.phone = 'El teléfono es requerido'
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Email inválido'

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setSaving(true)

    const fullPhone = `${countryCode}${localDigits}`
    const res = await fetch('/api/dashboard/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: fullPhone, email: email.trim() || null }),
    })
    setSaving(false)

    if (res.ok) {
      toast.success('Cliente agregado')
      onSaved()
      return
    }

    const json = await res.json().catch(() => ({}))
    const code = json?.error
    if (code === 'DUPLICATE_PHONE') {
      setErrors({ phone: 'Este teléfono ya está registrado' })
    } else if (code === 'INVALID_PHONE') {
      setErrors({ phone: json?.message || 'Teléfono inválido' })
    } else if (code === 'INVALID_NAME') {
      setErrors({ name: json?.message || 'Nombre inválido' })
    } else {
      setErrors({ general: json?.message || 'Error al crear cliente' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <h3 className="text-base font-medium text-[#0F172A]">Nuevo cliente</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre completo *</Label>
            <Input
              value={name}
              onChange={e => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })) }}
              placeholder="Juan Pérez"
            />
            {errors.name && <p className="text-[11px] text-[#EF4444]">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Teléfono *</Label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="h-10 w-[110px] rounded-md border border-input bg-background px-2 text-sm"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <Input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined })) }}
                placeholder="55 1234 5678"
                className="flex-1"
              />
            </div>
            {errors.phone && <p className="text-[11px] text-[#EF4444]">{errors.phone}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Email (opcional)</Label>
            <Input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })) }}
              placeholder="cliente@ejemplo.com"
            />
            {errors.email && <p className="text-[11px] text-[#EF4444]">{errors.email}</p>}
          </div>
          {errors.general && <p className="text-[12px] text-[#EF4444]">{errors.general}</p>}
          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80">
            {saving ? 'Guardando...' : 'Crear cliente'}
          </Button>
        </div>
      </div>
    </div>
  )
}
