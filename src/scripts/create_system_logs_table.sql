-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES auth.users(id),
    level VARCHAR(20) NOT NULL, -- info, warn, error
    message TEXT NOT NULL,
    details JSONB,
    stack TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_logs_merchant_id ON system_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Merchants can view their own logs" ON system_logs
    FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "System can insert logs" ON system_logs
    FOR INSERT WITH CHECK (true); -- Allow system-level inserts

CREATE POLICY "Merchants can update their own logs" ON system_logs
    FOR UPDATE USING (auth.uid() = merchant_id);
