'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Clock, User, Phone, Mail, Calendar, FileText } from 'lucide-react'
import { VALID_STATUS_TRANSITIONS } from '@/lib/constants'
import { toast } from 'sonner'

interface Props {
  appointment: Record<string, unknown>
  onClose: () => void
  onAction: () => void
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmada',
  pending_payment: 'Pago pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No se presentó',
  expired: 'Expirada',
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  confirmed: 'bg-[#0891B2]/[0.06] text-[#0891B2]',
  pending_payment: 'bg-[#F59E0B]/[0.06] text-[#D97706]',
  completed: 'bg-[#10B981]/[0.06] text-[#10B981]',
  cancelled: 'bg-[#94A3B8]/[0.06] text-[#94A3B8]',
  no_show: 'bg-[#EF4444]/[0.06] text-[#EF4444]',
  expired: 'bg-[#CBD5E1]/[0.06] text-[#475569]',
}

export function AppointmentDetailModal({ appointment, onClose, onAction }: Props) {
  const [loading, setLoading] = useState(false)
  const [showCancelInput, setShowCancelInput] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const status = appointment.status as string
  const svc = appointment.services as Record<string, unknown> | null
  const prof = appointment.professionals as Record<string, unknown> | null
  const client = appointment.clients as Record<string, unknown> | null
  const startDate = new Date(appointment.start_time as string)
  const endDate = new Date(appointment.end_time as string)

  const transitions = VALID_STATUS_TRANSITIONS[status] || []

  async function handleAction(newStatus: string, reason?: string) {
    setLoading(true)
    const body: Record<string, unknown> = { status: newStatus }
    if (reason) body.cancellation_reason = reason

    const res = await fetch(`/api/dashboard/appointments/${appointment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.message || 'Error al actualizar')
      return
    }

    toast.success(`Cita ${STATUS_LABELS[newStatus]?.toLowerCase() || 'actualizada'}`)
    onAction()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-[#0F172A]">Detalle de cita</h3>
            <span className={`rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_STYLES[status] || ''}`}>
              {STATUS_LABELS[status] || status}
            </span>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-[#0F172A]">
            <Calendar className="h-4 w-4 text-[#94A3B8]" />
            {format(startDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#0F172A]">
            <Clock className="h-4 w-4 text-[#94A3B8]" />
            {format(startDate, 'HH:mm')} — {format(endDate, 'HH:mm')}
            <span className="text-[#94A3B8]">({String(svc?.duration_minutes)} min)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#0F172A]">
            <FileText className="h-4 w-4 text-[#94A3B8]" />
            {String(svc?.name || 'Servicio')}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#0F172A]">
            <User className="h-4 w-4 text-[#94A3B8]" />
            {String(prof?.display_name || 'Profesional')}
          </div>

          <div className="mt-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-1">
            <p className="text-sm font-medium text-[#0F172A]">{String(client?.name || 'Cliente')}</p>
            {client?.phone ? (
              <p className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <Phone className="h-3 w-3" /> {String(client.phone)}
              </p>
            ) : null}
            {client?.email ? (
              <p className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                <Mail className="h-3 w-3" /> {String(client.email)}
              </p>
            ) : null}
          </div>

          {appointment.notes ? (
            <p className="text-xs text-[#94A3B8]">Notas: {String(appointment.notes)}</p>
          ) : null}

          <p className="text-[10px] uppercase tracking-[1px] text-[#94A3B8]">
            Fuente: {String(appointment.source)}
          </p>
        </div>

        {/* Actions */}
        {transitions.length > 0 && (
          <div className="border-t border-[#E2E8F0] px-5 py-4 space-y-2">
            <div className="flex gap-2">
              {transitions.includes('completed') && (
                <Button
                  size="sm"
                  onClick={() => handleAction('completed')}
                  disabled={loading}
                  className="flex-1 bg-[#10B981] text-white hover:bg-[#10B981]/80"
                >
                  Completada
                </Button>
              )}
              {transitions.includes('no_show') && (
                <Button
                  size="sm"
                  onClick={() => handleAction('no_show')}
                  disabled={loading}
                  className="flex-1 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20"
                >
                  No se presentó
                </Button>
              )}
            </div>

            {transitions.includes('cancelled') && !showCancelInput && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCancelInput(true)}
                disabled={loading}
                className="w-full text-[#94A3B8]"
              >
                Cancelar cita
              </Button>
            )}

            {showCancelInput && (
              <div className="space-y-2">
                <Input
                  placeholder="Razón de cancelación (opcional)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowCancelInput(false)} className="flex-1">
                    Volver
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAction('cancelled', cancelReason)}
                    disabled={loading}
                    className="flex-1 bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
                  >
                    Confirmar cancelación
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
