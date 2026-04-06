'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, DateSelectArg, EventDropArg, DatesSetArg } from '@fullcalendar/core'
import esLocale from '@fullcalendar/core/locales/es'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    appointment: Record<string, unknown>
  }
}

interface Props {
  events: CalendarEvent[]
  onEventClick: (info: EventClickArg) => void
  onDateSelect: (info: DateSelectArg) => void
  onEventDrop: (info: EventDropArg) => void
  onDatesSet: (info: DatesSetArg) => void
  initialView?: string
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmed: { bg: '#0891B2', border: '#0891B2', text: '#FFFFFF' },
  pending_payment: { bg: '#F59E0B', border: '#D97706', text: '#FFFFFF' },
  completed: { bg: '#10B981', border: '#10B981', text: '#FFFFFF' },
  cancelled: { bg: '#94A3B8', border: '#94A3B8', text: '#FFFFFF' },
  no_show: { bg: '#EF4444', border: '#EF4444', text: '#FFFFFF' },
  expired: { bg: '#CBD5E1', border: '#CBD5E1', text: '#475569' },
}

export function getStatusColors(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.confirmed
}

export default function FullCalendarWrapper({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
  onDatesSet,
  initialView = 'timeGridWeek',
}: Props) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView={initialView}
      locale={esLocale}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridDay,timeGridWeek,dayGridMonth',
      }}
      events={events}
      editable={true}
      selectable={true}
      selectMirror={true}
      dayMaxEvents={true}
      weekends={true}
      allDaySlot={false}
      slotMinTime="07:00:00"
      slotMaxTime="22:00:00"
      slotDuration="00:30:00"
      height="auto"
      contentHeight={600}
      eventClick={onEventClick}
      select={onDateSelect}
      eventDrop={onEventDrop}
      datesSet={onDatesSet}
      eventTimeFormat={{
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }}
      slotLabelFormat={{
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }}
    />
  )
}
