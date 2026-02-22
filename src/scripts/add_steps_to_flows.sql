-- Add steps column to automation_flows table to allow full customization
ALTER TABLE automation_flows 
ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN automation_flows.steps IS 'JSON array of conversation steps (questions, options, validation)';

-- Migration: Backfill existing flows with default steps based on business_type
-- We will handle this in the backend seeding logic for more complex structures, 
-- but this script ensures the column exists.
