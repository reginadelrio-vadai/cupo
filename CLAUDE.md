# CLAUDE.md

## Proyecto
SaaS multi-tenant de agendamiento de citas. Negocios reciben citas por: booking page pública + agente WhatsApp (Whaapy) + creación manual. Cada negocio es un tenant aislado.

Arquitectura probada en producción con Menna Salud (citas.mennasalud.com).

## Stack (versiones EXACTAS)
- next: 14.2.x (NO 15.x)
- react: 18.x · typescript: 5.x
- @supabase/supabase-js: 2.x · @supabase/ssr: 0.5.x
- stripe: 14.x · googleapis: 131.x · libphonenumber-js: 1.x
- date-fns: 3.x · date-fns-tz: 3.x · recharts: 2.x · crypto-js: 4.x
- resend: 3.x · @react-email/components: latest (emails transaccionales)
- @upstash/ratelimit: 2.x · @upstash/redis: 1.x (rate limiting — opcional)
- @fullcalendar/react + daygrid + timegrid + interaction: 6.x
- tailwindcss: 3.4.x · lucide-react: latest · zod: 3.x
- shadcn/ui: latest (init con `npx shadcn-ui@latest init`)

## shadcn/ui install order
button input label card dialog select dropdown-menu calendar table tabs badge toast separator avatar sheet popover command switch textarea skeleton

## Antigravity Skills disponibles
Este proyecto usa Antigravity IDE con las siguientes skills instaladas. Usarlas activamente:
- **GSD** — Descomponer cada milestone en tareas, ejecutar en orden, verificar checklist
- **UI/UX Pro Max** — Diseño profesional en todos los componentes (no UI genérica)
- **Vercel React Best Practices** — Server Components por default, dynamic imports, optimización de bundle
- **Vercel Composition Patterns** — Layouts, slots, composición de componentes
- **Supabase Developer** — Queries optimizadas, RLS, Edge Functions, storage
- **Next.js Supabase Auth** — Auth flow con App Router, middleware, cookies

## Arquitectura — REGLAS FUNDAMENTALES

### API-First con Service Layer (patrón Menna)
TODA la lógica de negocio vive en `/src/lib/services/`. Los endpoints (agent, booking, dashboard) son CLIENTES del service layer — solo validan input y llaman al servicio.

```
/src/lib/services/
├── appointment.service.ts   ← createBooking(), cancelAppointment(), rescheduleAppointment(), completeAppointment(), markNoShow()
├── availability.service.ts  ← getAvailableSlots(), getAvailableSlotsForRange()
├── client.service.ts        ← findOrCreateClient() con ON CONFLICT upsert
├── payment.service.ts       ← createCheckoutSession(), confirmPayment() con idempotencia
├── notification.service.ts  ← syncGoogleCalendar(), dispatchWebhooks(), sendReminder()
└── google-calendar.service.ts ← createEventWithMeet(), deleteEvent(), refreshTokens()
```

Ejemplo: `POST /api/agent/appointments` y `POST /api/booking/[slug]/book` AMBOS llaman a `appointmentService.createBooking()`. NO duplicar lógica.

### Dos clientes Supabase (patrón Menna)
- `createSupabaseServerClient()` — anon key, contexto de usuario, para dashboard
- `createSupabaseAdminClient()` — service-role, para agent API, booking, crons, webhooks
- NUNCA usar service-role para operaciones del usuario autenticado

### Auth con DAL (patrón Menna)
Crear `/src/lib/dal.ts`:
```typescript
import 'server-only'
import { cache } from 'react'
export const verifySession = cache(async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser() // NO getSession()
  if (error || !user) redirect('/login')
  return { userId: user.id, role: user.app_metadata?.role, organizationId: user.app_metadata?.organization_id }
})
```
Usar `getUser()` (valida con servidor Supabase), NUNCA `getSession()` (solo lee JWT local, puede estar expirado).

### Stripe — Idempotencia obligatoria (patrón Menna)
- `request.text()` para raw body, NUNCA `request.json()`
- SIEMPRE verificar firma con `stripe.webhooks.constructEvent()`
- Tabla `processed_webhook_events` para dedup: antes de procesar, INSERT event_id → si unique violation (23505), skip
- Google Calendar event se crea DESPUÉS del pago confirmado, no al crear la cita

### Rate Limiting — Graceful degradation (patrón Menna)
- Usar `@upstash/ratelimit` con Redis para `/api/agent/*`
- Si Upstash no está configurado (no hay env vars) → dejar pasar todo (no romper)
- Si Redis falla → fail open (permitir request, log error)
- 120 req/min por API key, sliding window

## Estructura de proyecto
```
/src
├── middleware.ts                    # Auth guard (lee JWT, no DB query)
├── /app
│   ├── layout.tsx · page.tsx       # Landing SaaS
│   ├── /(auth)/login · /register · /onboarding
│   ├── /(dashboard)                # Protected por middleware
│   │   ├── layout.tsx              # Sidebar + header
│   │   ├── /dashboard · /calendar · /appointments · /appointments/[id]
│   │   ├── /clients · /clients/[id] · /services · /team · /payments
│   │   └── /settings/*
│   ├── /book/[slug]/page.tsx       # Booking page pública
│   └── /api
│       ├── /agent/*                # Whaapy (auth: X-Agent-Key + rate limit)
│       ├── /booking/[slug]/*       # Booking page (público, sin auth)
│       ├── /webhooks/stripe        # Verificar firma + dedup
│       ├── /google/auth · /callback
│       └── /cron/*                 # Auth: CRON_SECRET
├── /components/ui · /dashboard · /calendar · /booking · /shared
├── /emails                         # React Email templates para Resend
├── /lib
│   ├── /services/                  # ← TODA la lógica de negocio aquí
│   ├── /supabase/server.ts · admin.ts
│   ├── /stripe/client.ts
│   ├── /google/calendar.ts
│   ├── /whaapy/client.ts
│   ├── /notifications/email.ts · whatsapp.ts
│   ├── /rate-limit/index.ts        # Upstash con graceful degradation
│   ├── /webhooks/emitter.ts · signer.ts
│   ├── dal.ts · constants.ts · errors.ts · encryption.ts · phone.ts · utils.ts
├── /hooks · /types/index.ts
```

## Convenciones

### TypeScript
- Strict mode. Types en `/types/index.ts`. Constants en `/lib/constants.ts`.
- NUNCA hardcodear strings de status, roles, sources — importar de constants.

### React
- Server Components por default. `"use client"` solo para interactividad.
- FullCalendar: SIEMPRE `dynamic(() => import(...), { ssr: false })`.

### API Routes
- `/api/agent/*` → auth via `X-Agent-Key` + verificar suscripción + rate limit
- `/api/booking/[slug]/*` → público, resuelve slug→org_id, usa admin client
- `/api/cron/*` → auth via `Authorization: Bearer {CRON_SECRET}`
- `/api/webhooks/stripe` → `req.text()` + verificar firma + dedup via processed_webhook_events
- Responses: `{ data: {...} }` o `{ error: "CODE", message: "..." }`

### Error handling
`/lib/errors.ts`: class `AppError(code, message, statusCode)` + `handleApiError()`. CADA route en try-catch.

### Base de datos
- `updated_at` se actualiza via trigger. NO setear manualmente.
- Teléfonos: normalizar con `libphonenumber-js` a E.164 (ver `/lib/phone.ts`)
- Timezones: validar contra `VALID_TIMEZONES` de constants.ts
- Slugs: regex `/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/`

### Middleware (`/src/middleware.ts`)
- Public: /, /login, /register, /book/*, /api/agent/*, /api/booking/*, /api/webhooks/*, /api/cron/*, /api/google/*
- Sin sesión → /login
- Con sesión sin `app_metadata.organization_id` → /onboarding
- Lee de JWT, NO query a DB

### RLS
- `get_user_org_id()` lee de `auth.jwt() -> app_metadata`. NO subquery.
- NO hay policies públicas. Booking page usa admin client.
- `/api/agent/*` usa admin client, bypasses RLS.

### Seguridad booking page
- NUNCA browser client para queries. Server Components + `/api/booking/[slug]/*`.
- `is_active=false` → "Página no disponible" (no 404).
- Branding: `bookingLogo = config.logo_url ?? org.logo_url`

### Google Calendar (BIDIRECCIONAL)
- Conectar desde Settings → Integraciones (OPCIONAL pero recomendado)
- **Plataforma → Google:** Evento + Google Meet se crean DESPUÉS del pago
- **Google → Plataforma:** Push notifications via watch channels. Eventos externos se guardan en `professional_external_events` y bloquean disponibilidad.
- Al crear eventos en Google: agregar `extendedProperties.private.platform = 'true'` para que el sync inverso los IGNORE
- Eventos externos se muestran como bloques grises en el dashboard (read-only)
- `getAvailableSlots()` consulta TAMBIÉN `professional_external_events` para bloquear horarios
- Watch channels se renuevan cada 7 días via cron
- Si servicio `is_virtual=true` → crear evento CON conferenceData (Google Meet)
- Refresh token antes de cada op. Si falla → `google_connected=false`, NO bloquear
- Error de Google NUNCA bloquea creación/cancelación de cita
- Desconectar Google → eliminar external events + stop watch channels
- Tokens AES-256 con ENCRYPTION_KEY. En producción migrar a Vault/KMS.

### Profesionales en v1
- No tienen login propio. Owner/admin los gestiona como recursos.
- `display_name` en tabla `professionals` (copiado de org_members al crear)
- En v2: invitación por email

### Organizaciones
- NO permitir delete desde dashboard. Solo desactivar.
- Suscripción vencida: banner + booking page desactivada + API keys bloqueadas.

### Notificaciones (patrón Menna)
- Email: Resend con React Email templates en `/src/emails/`
- WhatsApp: Whaapy API (fire-and-forget, nunca bloquea response)
- Enviar AMBOS canales cuando sea posible (email para detalle, WhatsApp para urgencia)

### Webhooks (patrón Menna)
- Tabla `webhook_endpoints` con `events` (array de tipos), `secret` (para firma HMAC)
- Tabla `webhook_logs` con status (pending/delivered/failed), response_code, response_body
- Firmar payload con HMAC-SHA256 si endpoint tiene secret configurado
- `emitWebhook()` registra en log, entrega, actualiza resultado
- Fire-and-forget pero AWAIT en serverless (Vercel mata el proceso si no)

### Reglas de negocio
- Validar transiciones contra `VALID_STATUS_TRANSITIONS`
- `check_and_lock_slot()` SQL antes de crear/reagendar
- Unique partial index como safety net adicional
- Buffer SOLO POSTERIOR
- Reagendar mantiene status actual
- `pending_payment` expira tras `payment_timeout_minutes`
- Client upsert: `ON CONFLICT (organization_id, phone_normalized) DO UPDATE`
- TODA transición → `appointment_status_log`
- TODA cita confirmada → Google Cal (si conectado) + webhooks
- `professional_services`: incluir `organization_id`

## Prioridades de desarrollo
1. Schema SQL + migraciones + seed data
2. Auth + DAL + registro + org creation + middleware
3. Onboarding wizard
4. Service layer: availability.service.ts
5. Service layer: appointment.service.ts + client.service.ts
6. API /api/agent/* con auth + rate limit
7. API /api/booking/[slug]/* + booking page
8. Calendario dashboard (FullCalendar, dynamic import)
9. Service layer: payment.service.ts + google-calendar.service.ts
10. Stripe payments + webhook con idempotencia
11. Google Calendar sync (evento + Meet después de pago)
12. Cron jobs (expire-payments + reminders)
13. Notification service (Resend email + Whaapy WhatsApp)
14. Dashboard analytics
15. Gestión de clientes + CRUD servicios/equipo
16. Settings

## Testing checklists

### Availability:
- [ ] Slots para profesional con horario · [] sin horario · [] excepción día completo
- [ ] Excepción parcial parte rangos · Buffer posterior bloquea slot
- [ ] min_advance_hours filtra · Horario partido genera en ambos rangos

### Agent API:
- [ ] GET /services con key → 200 · sin key → 401 · suscripción cancelada → 403
- [ ] POST /appointments → 201 · slot tomado → 409
- [ ] POST /clients nuevo → is_new:true · existente → is_new:false
- [ ] Rate limit: 121st request in 1 min → 429 (si Upstash configurado)

### Booking page:
- [ ] /book/slug-ok → servicios · slug-no → 404 · is_active=false → "no disponible"
- [ ] NO expone datos de otra org · Teléfono existente no duplica

### Stripe:
- [ ] Webhook → status updated · Firma inválida → 400
- [ ] Mismo event_id dos veces → segundo se ignora (idempotente)
- [ ] Google Calendar + Meet se crea DESPUÉS de pago (no al crear pending_payment)
- [ ] pending_payment expira 15 min → slot libre

### Cron:
- [ ] Recordatorio 24h enviado · No doble envío · Sin CRON_SECRET → 401
