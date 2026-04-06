'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Professional {
  id: string
  display_name: string
}

interface Service {
  id: string
  name: string
  duration_minutes: number
}

interface Props {
  professionals: Professional[]
  services: Service[]
  defaults: { start?: string; end?: string; professionalId?: string }
  onClose: () => void
  onCreate: () => void
}

export function CreateAppointmentModal({ professionals, services, defaults, onClose, onCreate }: Props) {
  const [serviceId, setServiceId] = useState('')
  const [professionalId, setProfessionalId] = useState(defaults.professionalId || '')
  const [startTime, setStartTime] = useState(defaults.start?.slice(0, 16) || '')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!serviceId || !professionalId || !startTime || !clientName || !clientPhone) {
      setError('Todos los campos marcados son requeridos')
      return
    }

    setLoading(true)

    const res = await fetch('/api/dashboard/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        professional_id: professionalId,
        start_time: new Date(startTime).toISOString(),
        client: { name: clientName, phone: clientPhone, email: clientEmail || undefined },
        notes: notes || undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.message || 'Error al crear cita')
      return
    }

    toast.success('Cita creada')
    onCreate()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <h3 className="text-base font-medium text-[#0F172A]">Nueva cita</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Servicio *</Label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Profesional *</Label>
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Fecha y hora *</Label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="border-t border-[#E2E8F0] pt-4">
            <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-3">Datos del cliente</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Nombre *</Label>
                <Input
                  placeholder="Nombre completo"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Teléfono *</Label>
                <Input
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5 mt-3">
              <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Email (opcional)</Label>
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-[1.5px] text-[#94A3B8]">Notas (opcional)</Label>
            <Textarea
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-[#EF4444]">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00B8E6] text-[#060608] hover:opacity-80 transition-opacity duration-150"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...</> : 'Crear cita'}
          </Button>
        </form>
      </div>
    </div>
  )
}
