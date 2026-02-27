-- 1. Ensure all columns for ONLINE_SHOP_FLOW in 'orders' table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS page_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_variant TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_source VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_photos JSONB;

-- 2. Ensure all columns for CARGO_FLOW in 'shipments' table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS order_no VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS page_id TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS item_type TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS item_value TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS item_photos JSONB;

-- Add indexes for better performance on common lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_shipments_order_no ON shipments(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_page_id ON orders(page_id);
CREATE INDEX IF NOT EXISTS idx_shipments_page_id ON shipments(page_id);

-- Update weight column type to TEXT in shipments to support "2kg", "500g"
DO $$ 
BEGIN 
    ALTER TABLE shipments ALTER COLUMN weight TYPE TEXT USING weight::TEXT;
EXCEPTION 
    WHEN others THEN NULL; 
END $$;
