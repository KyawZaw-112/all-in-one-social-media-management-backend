-- Migration: Add item_id to orders table
-- This allows linking orders directly to products for accurate stock deduction

ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES products(id);

-- Optional: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON orders(item_id);

-- Note: No changes to RLS policies are usually needed as they apply to the row level (merchant_id), 
-- but ensure that the item_id can be inserted by the merchant.
