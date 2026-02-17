-- Add business_type column to automation_flows table
ALTER TABLE automation_flows 
ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) DEFAULT 'online_shop';

-- Add comment for clarity
COMMENT ON COLUMN automation_flows.business_type IS 'Business type: online_shop, cargo, or custom';

-- Create shipments table for cargo business
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES auth.users(id),
    conversation_id UUID REFERENCES conversations(id),
    package_type VARCHAR(100),
    weight DECIMAL(10, 2),
    pickup_address TEXT,
    delivery_address TEXT,
    phone_number VARCHAR(50),
    delivery_urgency VARCHAR(20) DEFAULT 'standard',
    tracking_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_shipments_merchant_id ON shipments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

-- Enable RLS (Row Level Security)
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create policy for merchants to access their own shipments
CREATE POLICY "Merchants can view their own shipments" ON shipments
    FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert their own shipments" ON shipments
    FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update their own shipments" ON shipments
    FOR UPDATE USING (auth.uid() = merchant_id);
