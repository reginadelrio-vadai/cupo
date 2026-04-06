// ============================================================
// CUPO — Type definitions
// ============================================================

// --- Enums as const objects (import from constants.ts for runtime) ---

export type AppointmentStatus = 'confirmed' | 'pending_payment' | 'completed' | 'cancelled' | 'no_show' | 'expired'
export type AppointmentSource = 'manual' | 'booking_page' | 'whatsapp' | 'api'
export type ClientSource = 'manual' | 'booking_page' | 'whatsapp' | 'api'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type MemberRole = 'owner' | 'admin' | 'member'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing'
export type WebhookLogStatus = 'pending' | 'delivered' | 'failed'
export type IntegrationType = 'google_calendar' | 'whatsapp' | 'stripe'

// --- Database row types ---

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  timezone: string
  phone: string | null
  email: string | null
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: MemberRole
  display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  max_professionals: number
  max_services: number
  max_appointments_per_month: number | null
  features: Record<string, boolean>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationSubscription {
  id: string
  organization_id: string
  plan_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface ServiceCategory {
  id: string
  organization_id: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  organization_id: string
  category_id: string | null
  name: string
  description: string | null
  duration_minutes: number
  buffer_after_minutes: number
  price: number
  currency: string
  requires_payment: boolean
  is_virtual: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Professional {
  id: string
  organization_id: string
  member_id: string | null
  display_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  google_connected: boolean
  google_calendar_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProfessionalService {
  id: string
  organization_id: string
  professional_id: string
  service_id: string
  custom_price: number | null
  custom_duration_minutes: number | null
  is_active: boolean
  created_at: string
}

export interface ProfessionalSchedule {
  id: string
  professional_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProfessionalScheduleException {
  id: string
  professional_id: string
  exception_date: string
  is_available: boolean
  start_time: string | null
  end_time: string | null
  reason: string | null
  created_at: string
  updated_at: string
}

export interface ProfessionalExternalEvent {
  id: string
  professional_id: string
  google_event_id: string
  summary: string | null
  start_time: string
  end_time: string
  is_all_day: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  organization_id: string
  name: string
  email: string | null
  phone: string | null
  phone_normalized: string | null
  notes: string | null
  source: ClientSource
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  organization_id: string
  professional_id: string
  service_id: string
  client_id: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  source: AppointmentSource
  notes: string | null
  cancellation_reason: string | null
  google_event_id: string | null
  google_meet_url: string | null
  payment_timeout_minutes: number
  created_at: string
  updated_at: string
}

export interface AppointmentStatusLog {
  id: string
  appointment_id: string
  previous_status: string | null
  new_status: string
  changed_by: string | null
  change_source: string
  notes: string | null
  created_at: string
}

export interface Payment {
  id: string
  organization_id: string
  appointment_id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  payment_method: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface BookingPageConfig {
  id: string
  organization_id: string
  is_active: boolean
  logo_url: string | null
  primary_color: string | null
  welcome_message: string | null
  min_advance_hours: number
  max_advance_days: number
  created_at: string
  updated_at: string
}

export interface Integration {
  id: string
  organization_id: string
  type: IntegrationType
  config: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  organization_id: string
  name: string
  key_hash: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface WebhookEndpoint {
  id: string
  organization_id: string
  name: string
  url: string
  events: string[]
  secret: string | null
  is_active: boolean
  created_at: string
}

export interface WebhookLog {
  id: string
  organization_id: string
  endpoint_id: string | null
  event_type: string
  payload: Record<string, unknown>
  target_url: string
  status: WebhookLogStatus
  attempt_count: number
  response_code: number | null
  response_body: string | null
  last_attempt_at: string | null
  created_at: string
}

// --- Session / Auth ---

export interface SessionUser {
  userId: string
  organizationId: string | undefined
  role: string | undefined
  email: string
}

// --- API Response types ---

export interface ApiSuccessResponse<T = unknown> {
  data: T
}

export interface ApiErrorResponse {
  error: string
  message: string
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse
