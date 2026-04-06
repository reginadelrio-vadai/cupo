-- ============================================================
-- CUPO SaaS — Initial Schema
-- Multi-tenant appointment scheduling platform
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get org_id from JWT (for RLS)
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  max_professionals INT NOT NULL DEFAULT 1,
  max_services INT NOT NULL DEFAULT 5,
  max_appointments_per_month INT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ORGANIZATIONS (tenants)
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$'),
  logo_url TEXT,
  primary_color TEXT DEFAULT '#00B8E6',
  timezone TEXT NOT NULL DEFAULT 'America/Bogota',
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ORGANIZATION SUBSCRIPTIONS
-- ============================================================
CREATE TABLE organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_organization_subscriptions_updated_at
  BEFORE UPDATE ON organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_org_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_stripe ON organization_subscriptions(stripe_subscription_id);

-- ============================================================
-- ORGANIZATION MEMBERS (users linked to orgs)
-- ============================================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE TRIGGER tr_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- ============================================================
-- SERVICE CATEGORIES
-- ============================================================
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  buffer_after_minutes INT NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'COP',
  requires_payment BOOLEAN DEFAULT FALSE,
  is_virtual BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_services_org ON services(organization_id);

-- ============================================================
-- PROFESSIONALS
-- ============================================================
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES organization_members(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  google_connected BOOLEAN DEFAULT FALSE,
  google_refresh_token_encrypted TEXT,
  google_calendar_id TEXT,
  google_watch_channel_id TEXT,
  google_watch_resource_id TEXT,
  google_watch_expiration TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_professionals_org ON professionals(organization_id);

-- ============================================================
-- PROFESSIONAL <-> SERVICES (many-to-many)
-- ============================================================
CREATE TABLE professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2),
  custom_duration_minutes INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professional_id, service_id)
);

CREATE INDEX idx_prof_services_org ON professional_services(organization_id);

-- ============================================================
-- PROFESSIONAL SCHEDULES (weekly recurring)
-- ============================================================
CREATE TABLE professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (start_time < end_time)
);

CREATE TRIGGER tr_professional_schedules_updated_at
  BEFORE UPDATE ON professional_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_prof_schedules_prof ON professional_schedules(professional_id);

-- ============================================================
-- PROFESSIONAL SCHEDULE EXCEPTIONS (overrides)
-- ============================================================
CREATE TABLE professional_schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT FALSE,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_professional_schedule_exceptions_updated_at
  BEFORE UPDATE ON professional_schedule_exceptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_prof_exceptions_prof_date ON professional_schedule_exceptions(professional_id, exception_date);

-- ============================================================
-- PROFESSIONAL EXTERNAL EVENTS (Google Calendar sync)
-- ============================================================
CREATE TABLE professional_external_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  summary TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professional_id, google_event_id)
);

CREATE TRIGGER tr_professional_external_events_updated_at
  BEFORE UPDATE ON professional_external_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_prof_external_events_time ON professional_external_events(professional_id, start_time, end_time);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  phone_normalized TEXT,
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','booking_page','whatsapp','api')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, phone_normalized)
);

CREATE TRIGGER tr_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_clients_phone ON clients(organization_id, phone_normalized);

-- ============================================================
-- APPOINTMENTS
-- ============================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  service_id UUID NOT NULL REFERENCES services(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','pending_payment','completed','cancelled','no_show','expired')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','booking_page','whatsapp','api')),
  notes TEXT,
  cancellation_reason TEXT,
  google_event_id TEXT,
  google_meet_url TEXT,
  payment_timeout_minutes INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_appointments_org ON appointments(organization_id);
CREATE INDEX idx_appointments_prof_time ON appointments(professional_id, start_time);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(organization_id, status);

-- UNIQUE PARTIAL INDEX — Safety net against double-booking (patrón Menna)
CREATE UNIQUE INDEX idx_no_double_booking
ON appointments (professional_id, start_time)
WHERE status NOT IN ('cancelled', 'expired');

-- ============================================================
-- APPOINTMENT STATUS LOG (audit trail)
-- ============================================================
CREATE TABLE appointment_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  change_source TEXT DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_log_appointment ON appointment_status_log(appointment_id, created_at DESC);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_appointment ON payments(appointment_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);

-- ============================================================
-- BOOKING PAGE CONFIG
-- ============================================================
CREATE TABLE booking_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  logo_url TEXT,
  primary_color TEXT,
  welcome_message TEXT,
  min_advance_hours INT DEFAULT 2,
  max_advance_days INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_booking_page_config_updated_at
  BEFORE UPDATE ON booking_page_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INTEGRATIONS (generic)
-- ============================================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('google_calendar','whatsapp','stripe')),
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, type)
);

CREATE TRIGGER tr_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- API KEYS (for agent/whaapy)
-- ============================================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['agent'],
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ============================================================
-- WEBHOOK ENDPOINTS (patrón Menna)
-- ============================================================
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WEBHOOK LOGS (patrón Menna)
-- ============================================================
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  target_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed')),
  attempt_count INT DEFAULT 0,
  response_code INT,
  response_body TEXT,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_endpoint ON webhook_logs(endpoint_id, created_at DESC);

-- ============================================================
-- PROCESSED WEBHOOK EVENTS (Stripe idempotency — patrón Menna)
-- ============================================================
CREATE TABLE processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADVISORY LOCK: check_and_lock_slot
-- Prevents double-booking at application level
-- ============================================================
CREATE OR REPLACE FUNCTION check_and_lock_slot(
  p_professional_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_lock_key BIGINT;
  v_conflict_count INT;
BEGIN
  -- Generate deterministic lock key from professional + timeslot
  v_lock_key := abs(hashtext(p_professional_id::TEXT || p_start_time::TEXT));

  -- Acquire advisory lock (session-level, released at end of transaction)
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Check for overlapping appointments
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE professional_id = p_professional_id
    AND status NOT IN ('cancelled', 'expired')
    AND start_time < p_end_time
    AND end_time > p_start_time
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id);

  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: expire_unpaid_appointments
-- Called by cron to expire pending_payment appointments
-- ============================================================
CREATE OR REPLACE FUNCTION expire_unpaid_appointments()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  WITH expired AS (
    UPDATE appointments
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending_payment'
      AND created_at + (payment_timeout_minutes || ' minutes')::INTERVAL < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  -- Log the transitions
  INSERT INTO appointment_status_log (appointment_id, previous_status, new_status, change_source, notes)
  SELECT id, 'pending_payment', 'expired', 'cron', 'Payment timeout expired'
  FROM appointments
  WHERE status = 'expired'
    AND id NOT IN (
      SELECT appointment_id FROM appointment_status_log
      WHERE new_status = 'expired' AND change_source = 'cron'
    );

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_external_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_page_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: members can read their own org
CREATE POLICY "org_read" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = get_user_org_id());

-- Organization subscriptions
CREATE POLICY "org_sub_read" ON organization_subscriptions
  FOR SELECT USING (organization_id = get_user_org_id());

-- Organization members
CREATE POLICY "org_members_read" ON organization_members
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "org_members_update" ON organization_members
  FOR UPDATE USING (organization_id = get_user_org_id());

-- Service categories
CREATE POLICY "categories_read" ON service_categories
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "categories_insert" ON service_categories
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "categories_update" ON service_categories
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "categories_delete" ON service_categories
  FOR DELETE USING (organization_id = get_user_org_id());

-- Services
CREATE POLICY "services_read" ON services
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "services_insert" ON services
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "services_update" ON services
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "services_delete" ON services
  FOR DELETE USING (organization_id = get_user_org_id());

-- Professionals
CREATE POLICY "professionals_read" ON professionals
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "professionals_insert" ON professionals
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "professionals_update" ON professionals
  FOR UPDATE USING (organization_id = get_user_org_id());

-- Professional services
CREATE POLICY "prof_services_read" ON professional_services
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "prof_services_insert" ON professional_services
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "prof_services_update" ON professional_services
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "prof_services_delete" ON professional_services
  FOR DELETE USING (organization_id = get_user_org_id());

-- Professional schedules
CREATE POLICY "schedules_read" ON professional_schedules
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "schedules_insert" ON professional_schedules
  FOR INSERT WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "schedules_update" ON professional_schedules
  FOR UPDATE USING (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "schedules_delete" ON professional_schedules
  FOR DELETE USING (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

-- Professional schedule exceptions
CREATE POLICY "exceptions_read" ON professional_schedule_exceptions
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "exceptions_insert" ON professional_schedule_exceptions
  FOR INSERT WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "exceptions_update" ON professional_schedule_exceptions
  FOR UPDATE USING (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "exceptions_delete" ON professional_schedule_exceptions
  FOR DELETE USING (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

-- Professional external events
CREATE POLICY "external_events_read" ON professional_external_events
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

-- Clients
CREATE POLICY "clients_read" ON clients
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (organization_id = get_user_org_id());

-- Appointments
CREATE POLICY "appointments_read" ON appointments
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "appointments_insert" ON appointments
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "appointments_update" ON appointments
  FOR UPDATE USING (organization_id = get_user_org_id());

-- Appointment status log
CREATE POLICY "status_log_read" ON appointment_status_log
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "status_log_insert" ON appointment_status_log
  FOR INSERT WITH CHECK (
    appointment_id IN (
      SELECT id FROM appointments WHERE organization_id = get_user_org_id()
    )
  );

-- Payments
CREATE POLICY "payments_read" ON payments
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "payments_update" ON payments
  FOR UPDATE USING (organization_id = get_user_org_id());

-- Booking page config
CREATE POLICY "booking_config_read" ON booking_page_config
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "booking_config_insert" ON booking_page_config
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "booking_config_update" ON booking_page_config
  FOR UPDATE USING (organization_id = get_user_org_id());

-- Integrations
CREATE POLICY "integrations_read" ON integrations
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "integrations_insert" ON integrations
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "integrations_update" ON integrations
  FOR UPDATE USING (organization_id = get_user_org_id());

-- API keys
CREATE POLICY "api_keys_read" ON api_keys
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "api_keys_insert" ON api_keys
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "api_keys_update" ON api_keys
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "api_keys_delete" ON api_keys
  FOR DELETE USING (organization_id = get_user_org_id());

-- Webhook endpoints
CREATE POLICY "webhook_endpoints_read" ON webhook_endpoints
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY "webhook_endpoints_insert" ON webhook_endpoints
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "webhook_endpoints_update" ON webhook_endpoints
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "webhook_endpoints_delete" ON webhook_endpoints
  FOR DELETE USING (organization_id = get_user_org_id());

-- Webhook logs
CREATE POLICY "webhook_logs_read" ON webhook_logs
  FOR SELECT USING (organization_id = get_user_org_id());

-- ============================================================
-- SEED DATA: Subscription plans
-- ============================================================
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, max_professionals, max_services, max_appointments_per_month, features) VALUES
  ('Gratis', 'free', 0, 0, 1, 3, 50, '{"booking_page": true, "whatsapp_agent": false, "google_calendar": false, "webhooks": false}'),
  ('Profesional', 'professional', 49900, 479000, 3, 10, 500, '{"booking_page": true, "whatsapp_agent": true, "google_calendar": true, "webhooks": false}'),
  ('Business', 'business', 99900, 959000, 10, 50, null, '{"booking_page": true, "whatsapp_agent": true, "google_calendar": true, "webhooks": true, "api_access": true}');
