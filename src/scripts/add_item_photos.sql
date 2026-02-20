-- Add item_photos column to shipments table
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS item_photos JSONB;

-- Add item_photos column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS item_photos JSONB;

-- Add comments for clarity
COMMENT ON COLUMN shipments.item_photos IS 'Array of photo URLs collected during the bot flow';
COMMENT ON COLUMN orders.item_photos IS 'Array of photo URLs collected during the bot flow';
