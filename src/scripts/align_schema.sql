-- 1. Update shipments table to match CARGO_FLOW fields exactly
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS item_type TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS item_value TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS address TEXT;

-- Change weight to TEXT to allow string values like "2kg" or "500g"
ALTER TABLE shipments ALTER COLUMN weight TYPE TEXT USING weight::TEXT;

-- 2. Update orders table to match ONLINE_SHOP_FLOW fields exactly
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_source TEXT;
