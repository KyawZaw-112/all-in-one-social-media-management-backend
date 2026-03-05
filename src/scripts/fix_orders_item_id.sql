-- Migration: Add item_id to orders table
-- Run this in Supabase SQL Editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES products(id);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON orders(item_id);
