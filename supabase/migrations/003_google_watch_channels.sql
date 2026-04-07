-- Google watch channels for push notifications
CREATE TABLE IF NOT EXISTS google_watch_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL UNIQUE,
  resource_id TEXT,
  google_calendar_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add google_calendar_id and source columns to professional_external_events if missing
ALTER TABLE professional_external_events
  ADD COLUMN IF NOT EXISTS google_calendar_id TEXT NOT NULL DEFAULT 'primary',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'google_calendar',
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW();

-- Add organization_id to professional_external_events if missing
ALTER TABLE professional_external_events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- RLS for new tables
ALTER TABLE google_watch_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watch_channels_read" ON google_watch_channels
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals WHERE organization_id = get_user_org_id()
    )
  );

-- Index for cron renewal queries
CREATE INDEX IF NOT EXISTS idx_watch_channels_expires ON google_watch_channels(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ext_events_org ON professional_external_events(organization_id, start_time);
