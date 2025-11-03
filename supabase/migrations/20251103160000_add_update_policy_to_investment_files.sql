-- ============================================================================
-- add update policy to investment_files table
-- ============================================================================
--
-- purpose: allow admins to update investment_files (for soft delete)
-- previously only DELETE policy existed, but code uses UPDATE for soft delete
--

-- ============================================================================
-- 1. add update policy for admins
-- ============================================================================

-- policy: admins can update investment files (for soft delete)
create policy "admins can update investment files"
on public.investment_files
for update
using (
  (
    select (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- ============================================================================
-- verification queries
-- ============================================================================

-- verify policy exists
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public' 
  and tablename = 'investment_files'
  and policyname = 'admins can update investment files';
