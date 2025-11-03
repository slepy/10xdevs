-- Migration: Add admin update policy to investments table
-- Description: Allows admins to update all investments regardless of ownership
-- Tables affected: investments
-- Special notes: Admins are identified by role='admin' in user_metadata

-- Create RLS policy for admin users to update all investments
-- Admins can update any investment, not just their own
create policy "investments_update_admin" on public.investments
    for update
    to authenticated
    using (
        (auth.jwt()->>'role') = 'admin'
        OR
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
    with check (
        (auth.jwt()->>'role') = 'admin'
        OR
        (auth.jwt()->'user_metadata'->>'role') = 'admin'
    );

-- Add comment explaining the admin policy
comment on policy "investments_update_admin" on public.investments is
'Allows admin users to update all investments in the system (e.g., change status, add reason)';
