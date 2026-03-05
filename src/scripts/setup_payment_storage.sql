-- 💳 Setup Storage Policies for Payment Proofs (Simplified)
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure the bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view own proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own proofs" ON storage.objects;
DROP POLICY IF EXISTS "Debug: Allow all authenticated access" ON storage.objects;

-- 3. Policy: Allow authenticated users to upload to their own folder
-- This uses a simple string prefix match which is very reliable
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'payment-proofs' AND
    (name LIKE auth.uid()::text || '/%')
);

-- 4. Policy: Allow users to view their own uploaded proofs
CREATE POLICY "Allow users to view own proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'payment-proofs' AND
    (name LIKE auth.uid()::text || '/%')
);

-- 5. Policy: Allow users to delete their own proofs
CREATE POLICY "Allow users to delete own proofs"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'payment-proofs' AND
    (name LIKE auth.uid()::text || '/%')
);

-- 6. [NUCLEAR DEBUG] Use this ONLY if upload still fails.
-- This allows EVERYONE (even logged-out users) to upload to this bucket.
-- ONLY use this for 2 minutes of testing, then delete it!
DROP POLICY IF EXISTS "Nuclear Debug: Allow all" ON storage.objects;
CREATE POLICY "Nuclear Debug: Allow all" 
ON storage.objects FOR ALL 
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');
