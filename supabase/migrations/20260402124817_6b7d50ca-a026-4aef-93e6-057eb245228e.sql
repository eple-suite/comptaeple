-- Remove the redundant "Only admins can create establishments" INSERT policy
-- Admins already have full access via the "Admins can manage establishments" ALL policy
-- This eliminates the confusing dual-permissive INSERT situation
DROP POLICY IF EXISTS "Only admins can create establishments" ON public.establishments;