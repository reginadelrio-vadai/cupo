// ============================================================
// CUPO — Constants
// ============================================================

export const APPOINTMENT_STATUSES = ['confirmed', 'pending_payment', 'completed', 'cancelled', 'no_show', 'expired'] as const

export const APPOINTMENT_SOURCES = ['manual', 'booking_page', 'whatsapp', 'api'] as const

export const CLIENT_SOURCES = ['manual', 'booking_page', 'whatsapp', 'api'] as const

export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const

export const MEMBER_ROLES = ['owner', 'admin', 'member'] as const

export const SUBSCRIPTION_STATUSES = ['active', 'past_due', 'cancelled', 'trialing'] as const

export const INTEGRATION_TYPES = ['google_calendar', 'whatsapp', 'stripe'] as const

// Valid status transitions: from → [allowed to states]
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['completed', 'cancelled', 'no_show'],
  pending_payment: ['confirmed', 'expired', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
  expired: [],
}

// Webhook event types
export const WEBHOOK_EVENTS = [
  'appointment.created',
  'appointment.confirmed',
  'appointment.cancelled',
  'appointment.completed',
  'appointment.no_show',
  'appointment.rescheduled',
  'payment.completed',
  'payment.failed',
  'client.created',
] as const

// Slug validation
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/

// Timezone validation
export const VALID_TIMEZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Europe/London',
] as const

// Industries
export const INDUSTRIES = [
  { value: 'salud', label: 'Salud y bienestar' },
  { value: 'belleza', label: 'Belleza y estética' },
  { value: 'fitness', label: 'Fitness y deporte' },
  { value: 'educacion', label: 'Educación y tutorías' },
  { value: 'legal', label: 'Legal y consultoría' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'veterinaria', label: 'Veterinaria' },
  { value: 'automotriz', label: 'Automotriz' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'otro', label: 'Otro' },
] as const

// Service durations (minutes)
export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
] as const

// Days of week
export const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
] as const

// Rate limiting
export const RATE_LIMIT_AGENT = { requests: 120, window: '1 m' } as const

// Payment
export const DEFAULT_PAYMENT_TIMEOUT_MINUTES = 15
export const DEFAULT_CURRENCY = 'COP'

// Booking
export const DEFAULT_MIN_ADVANCE_HOURS = 2
export const DEFAULT_MAX_ADVANCE_DAYS = 30

// Google Calendar
export const GOOGLE_WATCH_RENEWAL_DAYS = 7
export const PLATFORM_EVENT_TAG = 'true'
