-- Add metadata column to automation_flows table for dynamic customizations
ALTER TABLE automation_flows
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN automation_flows.metadata IS 'Stores user-defined overrides for questions, step toggles, and messages.';
