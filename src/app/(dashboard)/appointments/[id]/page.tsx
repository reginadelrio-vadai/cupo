'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, Clock, User, Phone, Mail, Calendar, Loader2 } from 'lucide-react'
import { VALID_STATUS_TRANSITIONS } from '@/lib/constants'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada', pending_payment: 'Pago pendiente', completed: 'Completada',
  cancelled: 'Cancelada', no_show: 'No-show', expired: 'Expirada',
}
const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-[#0891B2]/[0.06] text-[#0891B2]', pending_payment: 'bg-[#F59E0B]/[0.06] text-[#D97706]',
  completed: 'bg-[#10B981]/[0.06] text-[#10B981]', cancelled: 'bg-[#94A3B8]/[0.06] text-[#94A3B8]',
  no_show: 'bg-[#EF4444]/[0.06] text-[#EF4444]', expired: 'bg-[#CBD5E1]/[0.06] text-[#475569]',
}

export default function AppointmentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)

  const fetchData = useCallback(() => {
    Promise.all([
      fetch(`/api/dashboard/appointments?start=2020-01-01&end=2030-01-01`).then(r => r.json()),
    ]).then(([apptData]) => {
      const appt = (apptData.data?.appointments || []).find((a: Record<string, unknown>) => a.id === id)
      setAppointment(appt || null)
      setLoading(false)
    })
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (status: string, reason?: string) => {
    setActionLoading(true)
    const body: Record<string, unknown> = { status }
    if (reason) body.cancellation_reason = reason

    const res = await fetch(`/api/dashboard/appointments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setActionLoading(false)

    if (res.ok) { toast.success(`Cita ${STATUS_LABELS[status]?.toLowerCase()}`); fetchData() }
    else { const d = await res.json(); toast.error(d.message || 'Error') }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#94A3B8]" /></div>
  if (!appointment) return <p className="text-[#94A3B8] text-center py-20">Cita no encontrada</p>

  const status = String(appointment.status)
  const transitions = VALID_STATUS_TRANSITIONS[status] || []
  const svc = appointment.services as Record<string, unknown> | null
  const prof = appointment.professionals as Record<string, unknown> | null
  const client = appointment.clients as Record<string, unknown> | null
  const startDate = new Date(String(appointment.start_time))
  const endDate = new Date(String(appointment.end_time))

  return (
    <div>
      <button onClick={() => router.push('/appointments')} className="flex items-center gap-1 text-sm text-[#475569] mb-4 hover:text-[#0F172A]">
        <ChevronLeft className="h-4 w-4" /> Citas
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-[28px] font-medium tracking-[-1px] text-[#0F172A]">Detalle de cita</h1>
        <span className={`rounded-[4px] px-2.5 py-1 text-[11px] font-medium ${STATUS_BADGE[status] || ''}`}>
          {STATUS_LABELS[status] || status}
        </span>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-6">
        {/* Left: appointment info */}
        <div className="space-y-4">
          <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-[#0F172A]">
              <Calendar className="h-4 w-4 text-[#94A3B8]" />
              {format(startDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#0F172A]">
              <Clock className="h-4 w-4 text-[#94A3B8]" />
              {format(startDate, 'HH:mm')} — {format(endDate, 'HH:mm')}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#0F172A]">
              <User className="h-4 w-4 text-[#94A3B8]" />
              {String(svc?.name || 'Servicio')} con {String(prof?.display_name || 'Profesional')}
            </div>
            <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">
              Fuente: {String(appointment.source)}
            </p>
            {appointment.notes ? <p className="text-xs text-[#94A3B8]">Notas: {String(appointment.notes)}</p> : null}
          </div>

          {/* Client card */}
          <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
            <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-3">Cliente</p>
            <p className="text-sm font-medium text-[#0F172A]">{String(client?.name || 'Cliente')}</p>
            {client?.phone ? <p className="flex items-center gap-1.5 text-xs text-[#94A3B8] mt-1"><Phone className="h-3 w-3" />{String(client.phone)}</p> : null}
            {client?.email ? <p className="flex items-center gap-1.5 text-xs text-[#94A3B8] mt-1"><Mail className="h-3 w-3" />{String(client.email)}</p> : null}
            <button onClick={() => router.push(`/clients/${client?.id}`)} className="mt-2 text-xs text-[#0891B2] hover:underline">
              Ver ficha completa
            </button>
          </div>

          {/* Actions */}
          {transitions.length > 0 && (
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5 space-y-2">
              <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-2">Acciones</p>
              <div className="flex gap-2">
                {transitions.includes('completed') && (
                  <Button size="sm" onClick={() => handleAction('completed')} disabled={actionLoading}
                    className="bg-[#10B981] text-white hover:bg-[#10B981]/80">Completada</Button>
                )}
                {transitions.includes('no_show') && (
                  <Button size="sm" onClick={() => handleAction('no_show')} disabled={actionLoading}
                    className="bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20">No-show</Button>
                )}
              </div>
              {transitions.includes('cancelled') && !showCancelInput && (
                <Button size="sm" variant="outline" onClick={() => setShowCancelInput(true)} className="text-[#94A3B8]">
                  Cancelar cita
                </Button>
              )}
              {showCancelInput && (
                <div className="flex gap-2">
                  <Input placeholder="Razón (opcional)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="text-sm" />
                  <Button size="sm" onClick={() => handleAction('cancelled', cancelReason)} disabled={actionLoading}
                    className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80">Confirmar</Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: status timeline */}
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8] mb-4">Timeline</p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#0891B2]" />
              <div>
                <p className="text-xs text-[#0F172A]">Cita creada</p>
                <p className="text-[10px] text-[#94A3B8]">{format(new Date(String(appointment.created_at)), "d MMM yyyy, HH:mm", { locale: es })}</p>
              </div>
            </div>
            {status !== 'confirmed' && status !== 'pending_payment' && (
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full" style={{ background: status === 'completed' ? '#10B981' : status === 'no_show' ? '#EF4444' : '#94A3B8' }} />
                <div>
                  <p className="text-xs text-[#0F172A]">{STATUS_LABELS[status]}</p>
                  <p className="text-[10px] text-[#94A3B8]">{format(new Date(String(appointment.updated_at || appointment.created_at)), "d MMM yyyy, HH:mm", { locale: es })}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster position="bottom-right" />
    </div>
  )
}
