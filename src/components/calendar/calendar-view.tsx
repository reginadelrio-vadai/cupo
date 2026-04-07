'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { CalendarSkeleton } from './calendar-skeleton'
import { getStatusColors } from './fullcalendar-wrapper'
import type { CalendarEvent } from './fullcalendar-wrapper'
import type { EventClickArg, DateSelectArg, EventDropArg, DatesSetArg } from '@fullcalendar/core'
import { AppointmentDetailModal } from './appointment-detail-modal'
import { CreateAppointmentModal } from './create-appointment-modal'
import { toast } from 'sonner'

const FullCalendarComponent = dynamic(
  () => import('./fullcalendar-wrapper'),
  { ssr: false, loading: () => <CalendarSkeleton /> }
)

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
}

export function CalendarView({ professionals, services }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Record<string, unknown> | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createDefaults, setCreateDefaults] = useState<{ start?: string; end?: string; professionalId?: string }>({})
  const [filterProfessional, setFilterProfessional] = useState<string>('')
  const currentRange = useRef<{ start: string; end: string } | null>(null)

  const fetchAppointments = useCallback(async (start: string, end: string, profFilter?: string) => {
    const params = new URLSearchParams({ start, end })
    const profId = profFilter !== undefined ? profFilter : filterProfessional
    if (profId) params.set('professional_id', profId)

    const [apptRes, extRes] = await Promise.all([
      fetch(`/api/dashboard/appointments?${params}`),
      fetch(`/api/dashboard/external-events?${params}`),
    ])

    const apptData = await apptRes.json()
    const extData = await extRes.json()

    const apptEvents: CalendarEvent[] = (apptData.data?.appointments || []).map((appt: Record<string, unknown>) => {
      const svc = appt.services as Record<string, unknown> | null
      const client = appt.clients as Record<string, unknown> | null
      const colors = getStatusColors(appt.status as string)
      return {
        id: appt.id as string,
        title: `${svc?.name || 'Cita'} — ${client?.name || 'Cliente'}`,
        start: appt.start_time as string,
        end: appt.end_time as string,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: { appointment: appt },
      }
    })

    const extEvents: CalendarEvent[] = (extData.data?.events || []).map((ext: Record<string, unknown>) => ({
      id: `ext-${ext.id}`,
      title: String(ext.summary || '(Bloqueado)'),
      start: ext.start_time as string,
      end: ext.end_time as string,
      backgroundColor: '#9CA3AF',
      borderColor: '#6B7280',
      textColor: '#FFFFFF',
      extendedProps: { appointment: { ...ext, _type: 'external' } },
    }))

    setEvents([...apptEvents, ...extEvents])
  }, [filterProfessional])

  // BUG FIX 1: Re-fetch when filter changes
  useEffect(() => {
    if (currentRange.current) {
      fetchAppointments(currentRange.current.start, currentRange.current.end, filterProfessional)
    }
  }, [filterProfessional]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    const start = info.startStr
    const end = info.endStr
    currentRange.current = { start, end }
    fetchAppointments(start, end)
  }, [fetchAppointments])

  const handleEventClick = useCallback((info: EventClickArg) => {
    const appt = info.event.extendedProps.appointment as Record<string, unknown>
    if (appt?._type === 'external') return
    setSelectedAppointment(appt)
    setShowDetailModal(true)
  }, [])

  const handleDateSelect = useCallback((info: DateSelectArg) => {
    setCreateDefaults({
      start: info.startStr,
      end: info.endStr,
      professionalId: filterProfessional || undefined,
    })
    setShowCreateModal(true)
  }, [filterProfessional])

  // BUG FIX 2: Refresh events after drag-and-drop reschedule
  const handleEventDrop = useCallback(async (info: EventDropArg) => {
    const apptId = info.event.id
    const newStart = info.event.startStr

    const res = await fetch(`/api/dashboard/appointments/${apptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_time: newStart }),
    })

    if (!res.ok) {
      info.revert()
      const data = await res.json()
      toast.error(data.message || 'No se pudo reagendar')
      return
    }

    toast.success('Cita reagendada')
    // Refetch all events to get updated data for modals
    if (currentRange.current) {
      fetchAppointments(currentRange.current.start, currentRange.current.end)
    }
  }, [fetchAppointments])

  const refresh = useCallback(() => {
    if (currentRange.current) {
      fetchAppointments(currentRange.current.start, currentRange.current.end)
    }
  }, [fetchAppointments])

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <select
          value={filterProfessional}
          onChange={(e) => setFilterProfessional(e.target.value)}
          className="h-9 rounded-md border-[0.5px] border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00B8E6]/20"
        >
          <option value="">Todos los profesionales</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>{p.display_name}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3 text-[10px] uppercase tracking-[1px] text-[#94A3B8]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#0891B2]" />Confirmada</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" />Pago pendiente</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#10B981]" />Completada</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#EF4444]" />No-show</span>
        </div>
      </div>

      <div className="rounded-[10px] border-[0.5px] border-[#E2E8F0] bg-white p-4 [&_.fc]:text-sm [&_.fc-button]:!text-xs [&_.fc-button]:!rounded-lg [&_.fc-button]:!border-[#E2E8F0] [&_.fc-button]:!bg-white [&_.fc-button]:!text-[#475569] [&_.fc-button-active]:!bg-[#0891B2] [&_.fc-button-active]:!text-white [&_.fc-button-active]:!border-[#0891B2] [&_.fc-toolbar-title]:!text-base [&_.fc-toolbar-title]:!font-medium [&_.fc-event]:!rounded-md [&_.fc-event]:!border-0 [&_.fc-event]:!text-xs [&_.fc-event]:!px-1.5 [&_.fc-timegrid-slot]:!h-10 [&_.fc-col-header-cell]:!py-2 [&_.fc-col-header-cell]:!text-[10px] [&_.fc-col-header-cell]:!uppercase [&_.fc-col-header-cell]:!tracking-[1px] [&_.fc-col-header-cell]:!text-[#94A3B8] [&_.fc-col-header-cell]:!font-normal">
        <FullCalendarComponent
          events={events}
          onEventClick={handleEventClick}
          onDateSelect={handleDateSelect}
          onEventDrop={handleEventDrop}
          onDatesSet={handleDatesSet}
        />
      </div>

      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => { setShowDetailModal(false); setSelectedAppointment(null) }}
          onAction={refresh}
        />
      )}

      {showCreateModal && (
        <CreateAppointmentModal
          professionals={professionals}
          services={services}
          defaults={createDefaults}
          onClose={() => setShowCreateModal(false)}
          onCreate={refresh}
        />
      )}
    </div>
  )
}
