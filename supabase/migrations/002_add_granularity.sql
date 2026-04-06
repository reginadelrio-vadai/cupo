-- Add slot granularity to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slot_granularity_minutes INT NOT NULL DEFAULT 15;
