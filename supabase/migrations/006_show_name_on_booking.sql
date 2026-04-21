-- ============================================================
-- BOOKING PAGE: show_name_on_booking toggle
-- Controls whether the organization name is rendered alongside
-- (or in place of) the logo on the public booking page.
-- ============================================================

ALTER TABLE booking_page_config
  ADD COLUMN IF NOT EXISTS show_name_on_booking BOOLEAN DEFAULT TRUE;
