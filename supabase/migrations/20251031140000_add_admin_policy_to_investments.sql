-- Migration: Add admin policy to investments table
-- Description: Allows admins to view all investments regardless of ownership
-- Tables affected: investments
-- Special notes: Admins are identified by role='admin' in raw_user_meta_data

-- Create RLS policy for admin users to select all investments
-- Admins can view all investments, not just their own
create policy "investments_select_admin" on public.investments
    for select
    to authenticated
    using (
        (auth.jwt()->>'role') = 'admin' 
        OR 
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
    );

-- Add comment explaining the admin policy
comment on policy "investments_select_admin" on public.investments is 
'Allows admin users to view all investments in the system';
