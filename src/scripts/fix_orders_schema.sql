-- CRITICAL FIX: Reset and Recreate Orders Table
-- This will ensure all column constraints are clean and aligned with the system requirements.
-- WARNING: This will delete existing order data if any.

-- 1. Drop the existing table
DROP TABLE IF EXISTS orders;

-- 2. Create the table correctly from scratch
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES auth.users(id),
    conversation_id UUID REFERENCES conversations(id),
    page_id TEXT,
    sender_id TEXT,
    sender_name TEXT,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment TEXT,
    delivery TEXT
);

-- 3. Add necessary indexes
CREATE INDEX idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_page_id ON orders(page_id);

-- 4. Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 5. Setup Policies
CREATE POLICY "Merchants can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update their own orders" ON orders
    FOR UPDATE USING (auth.uid() = merchant_id);

-- 6. Also ensure shipments table constraints are clean for page_id
ALTER TABLE shipments ALTER COLUMN page_id DROP NOT NULL;
