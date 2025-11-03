-- Migration: Extend users_view with user metadata
-- Description: Recreates users_view to include firstName and lastName from raw_user_meta_data
-- Tables affected: users_view (view)
-- Special notes: Adds firstName and lastName fields from JSON metadata

-- Drop existing view first
DROP VIEW IF EXISTS public.users_view;

-- Recreate view with metadata fields
CREATE VIEW public.users_view AS
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'firstName' as first_name,
    raw_user_meta_data->>'lastName' as last_name
FROM auth.users;

-- Grant select permission to authenticated users
GRANT SELECT ON public.users_view TO authenticated;
GRANT SELECT ON public.users_view TO anon;

-- Add comment explaining the view
COMMENT ON VIEW public.users_view IS 'Public view of users table with metadata (firstName, lastName, role)';
