-- Create orders table for online shop business
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES auth.users(id),
    conversation_id UUID REFERENCES conversations(id),
    item_name TEXT,
    item_variant TEXT,
    quantity INTEGER DEFAULT 1,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    payment_method VARCHAR(100),
    order_source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Merchants can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update their own orders" ON orders
    FOR UPDATE USING (auth.uid() = merchant_id);
