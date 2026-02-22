-- SQL to fix RLS for merchants table
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Merchants can view their own profile" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can insert their own profile" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update their own profile" ON public.merchants;
DROP POLICY IF EXISTS "Service role can manage all merchants" ON public.merchants;

-- 3. Create policies for authenticated users
-- Allow users to see only their own profile
CREATE POLICY "Merchants can view their own profile"
ON public.merchants
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to insert their own profile (important for signup if service role is not used)
CREATE POLICY "Merchants can insert their own profile"
ON public.merchants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Merchants can update their own profile"
ON public.merchants
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Explicitly allow service_role to bypass RLS (Supabase usually does this by default, but it's good for clarity)
CREATE POLICY "Service role can manage all merchants"
ON public.merchants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Verify policy
-- SELECT * FROM pg_policies WHERE tablename = 'merchants';
