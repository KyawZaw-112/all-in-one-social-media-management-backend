-- SaaS Subscription Enhancement for Merchants
-- This migration adds plan and trial tracking for SaaS monetization

-- 1. Add subscription columns to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free_trial',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active', -- active, expired, cancelled
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- 2. Add comment for clarity
COMMENT ON COLUMN merchants.subscription_plan IS 'Plan type: shop, cargo, or custom';
COMMENT ON COLUMN merchants.trial_ends_at IS 'Date when the 7-day free trial ends';

-- 3. Update existing merchants to have a trial end date (7 days from now as default)
UPDATE merchants 
SET trial_ends_at = NOW() + INTERVAL '7 days',
    subscription_plan = 'shop'
WHERE trial_ends_at IS NULL;

-- 4. Create an index for subscription status
CREATE INDEX IF NOT EXISTS idx_merchants_subscription_status ON merchants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_merchants_trial_ends_at ON merchants(trial_ends_at);
