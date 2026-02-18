-- SQL to fix RLS for platform_connections
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own connections" ON public.platform_connections;

-- 3. Create a comprehensive policy for authenticated users
-- This allows users to see and manage only their own data
CREATE POLICY "Users can manage their own connections"
ON public.platform_connections
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Verify policy
-- SELECT * FROM pg_policies WHERE tablename = 'platform_connections';
