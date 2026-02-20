-- Add order_no column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_no VARCHAR(100);

-- Add order_no column to shipments table
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS order_no VARCHAR(100);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_shipments_order_no ON shipments(order_no);
