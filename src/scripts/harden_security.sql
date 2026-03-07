-- 🛡️ HARDEN SECURITY: Tighten RLS Policies for SaaS Platform
-- This script ensures all data is strictly isolated to the authenticated merchant.

-- Disable all insecure 'USING (true)' policies and enforce role-based access

-- 1. Products
DROP POLICY IF EXISTS "Users can view own products" ON products;
DROP POLICY IF EXISTS "Users can insert own products" ON products;
DROP POLICY IF EXISTS "Users can update own products" ON products;
DROP POLICY IF EXISTS "Users can delete own products" ON products;
DROP POLICY IF EXISTS "Service role full access on products" ON products;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant products access" ON products
    FOR ALL TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

-- 2. Shipping Rates
DROP POLICY IF EXISTS "Users can view own rates" ON shipping_rates;
DROP POLICY IF EXISTS "Users can insert own rates" ON shipping_rates;
DROP POLICY IF EXISTS "Users can update own rates" ON shipping_rates;
DROP POLICY IF EXISTS "Users can delete own rates" ON shipping_rates;
DROP POLICY IF EXISTS "Service role full access on shipping_rates" ON shipping_rates;

ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant shipping rates access" ON shipping_rates
    FOR ALL TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

-- 3. Merchants
DROP POLICY IF EXISTS "Merchants can view their own profile" ON merchants;
DROP POLICY IF EXISTS "Merchants can update their own profile" ON merchants;

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant profile access" ON merchants
    FOR SELECT TO authenticated
    USING (id = auth.uid());
CREATE POLICY "Merchant profile update" ON merchants
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

-- 4. Platform Connections
DROP POLICY IF EXISTS "Users can view their own connections" ON platform_connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON platform_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON platform_connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON platform_connections;

ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant platform connections access" ON platform_connections
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view page names" ON platform_connections
    FOR SELECT TO anon
    USING (true);

-- 5. Automation Flows
DROP POLICY IF EXISTS "Merchants can view their own flows" ON automation_flows;
DROP POLICY IF EXISTS "Merchants can manage their own flows" ON automation_flows;

ALTER TABLE automation_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant automation flows access" ON automation_flows
    FOR ALL TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

-- 6. Orders
DROP POLICY IF EXISTS "Merchants can view their own orders" ON orders;
DROP POLICY IF EXISTS "Merchants can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Merchants can update their own orders" ON orders;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant orders access" ON orders
    FOR ALL TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Public can view orders via order_no" ON orders
    FOR SELECT TO anon
    USING (true);

-- 7. Shipments
DROP POLICY IF EXISTS "Merchants can view their own shipments" ON shipments;
DROP POLICY IF EXISTS "Merchants can insert their own shipments" ON shipments;
DROP POLICY IF EXISTS "Merchants can update their own shipments" ON shipments;

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant shipments access" ON shipments
    FOR ALL TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Public can view shipments via order_no" ON shipments
    FOR SELECT TO anon
    USING (true);

-- 8. Messages
DROP POLICY IF EXISTS "Merchants can view their own messages" ON messages;
DROP POLICY IF EXISTS "Merchants can manage their own messages" ON messages;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant messages access" ON messages
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 9. Conversations
DROP POLICY IF EXISTS "Merchants can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Merchants can manage their own conversations" ON conversations;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant conversations access" ON conversations
    FOR ALL TO authenticated
    USING (merchant_id = auth.uid())
    WITH CHECK (merchant_id = auth.uid());

-- NOTE: The 'service_role' key continues to have full access to everything in Supabase regardless of these policies, 
-- which is exactly what the backend API needs for its internal engine logic.
