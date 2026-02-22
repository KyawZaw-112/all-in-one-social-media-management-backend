-- ═══════════════════════════════════════════════════════════════
-- Products Table — Product Catalog + Warehouse Inventory
-- ═══════════════════════════════════════════════════════════════

-- Drop old table if exists (safe: new feature, no production data)
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'MMK',
    variants TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast merchant lookups
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
    ON products FOR SELECT
    USING (merchant_id = auth.uid());

CREATE POLICY "Users can insert own products"
    ON products FOR INSERT
    WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Users can update own products"
    ON products FOR UPDATE
    USING (merchant_id = auth.uid());

CREATE POLICY "Users can delete own products"
    ON products FOR DELETE
    USING (merchant_id = auth.uid());

-- Service role bypass (for backend API)
CREATE POLICY "Service role full access on products"
    ON products FOR ALL
    USING (true)
    WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- Shipping Rates Table — Merchant-configurable rate calculator
-- ═══════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS shipping_rates CASCADE;

CREATE TABLE shipping_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    shipping_type TEXT NOT NULL,
    rate_per_kg NUMERIC NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'THB',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_merchant_id ON shipping_rates(merchant_id);

ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rates"
    ON shipping_rates FOR SELECT
    USING (merchant_id = auth.uid());

CREATE POLICY "Users can insert own rates"
    ON shipping_rates FOR INSERT
    WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Users can update own rates"
    ON shipping_rates FOR UPDATE
    USING (merchant_id = auth.uid());

CREATE POLICY "Users can delete own rates"
    ON shipping_rates FOR DELETE
    USING (merchant_id = auth.uid());

CREATE POLICY "Service role full access on shipping_rates"
    ON shipping_rates FOR ALL
    USING (true)
    WITH CHECK (true);
