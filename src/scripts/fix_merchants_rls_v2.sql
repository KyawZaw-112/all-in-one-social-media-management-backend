-- DEFINITIVE FIX FOR MERCHANTS RLS
-- Run this in your Supabase SQL Editor

-- 1. Disable "FORCE" RLS which might be causing service_role to be blocked
ALTER TABLE public.merchants NO FORCE ROW LEVEL SECURITY;

-- 2. Temporarily disable RLS to confirm if it's the cause
-- ALTER TABLE public.merchants DISABLE ROW LEVEL SECURITY; 

-- 3. If you want to keep RLS enabled, run these to be absolutely sure
-- First, drop ALL policies (we can't easily do this in one go without knowing names, 
-- so we'll try to use the ones we know and add a generic one)
DROP POLICY IF EXISTS "Merchants can view their own profile" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can insert their own profile" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update their own profile" ON public.merchants;
DROP POLICY IF EXISTS "Service role can manage all merchants" ON public.merchants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.merchants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.merchants;

-- 4. Create a TRULY permissive policy for service_role and authenticated users
CREATE POLICY "Admin full access" 
ON public.merchants 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users manage own profile" 
ON public.merchants 
FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 5. Special policy for the INSERT during registration
-- This allows any authenticated user to insert a record with their own ID
-- Even if they don't have a session JWT yet (sometimes backend inserts behave differently)
CREATE POLICY "Allow registration insert" 
ON public.merchants 
FOR INSERT 
WITH CHECK (true); -- BE CAREFUL: This allows anyone to insert. 
-- In a real production app, you'd want to restrict this.
-- But for unblocking:

-- 6. Ensure RLS is enabled but not forcing owner/admin
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
