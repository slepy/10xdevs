-- ============================================================================
-- fix investment_files update policy
-- ============================================================================
--
-- purpose: add WITH CHECK clause to allow admins to update rows (soft delete)
-- the previous policy only had USING clause which checks existing rows
-- we need WITH CHECK to validate the updated rows
--

-- ============================================================================
-- 1. drop existing update policy
-- ============================================================================

drop policy if exists "admins can update investment files" on public.investment_files;

-- ============================================================================
-- 2. create new update policy with both USING and WITH CHECK
-- ============================================================================

-- policy: admins can update investment files (for soft delete)
create policy "admins can update investment files"
on public.investment_files
for update
using (
  (
    select (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
)
with check (
  (
    select (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- ============================================================================
-- verification queries
-- ============================================================================

-- verify policy exists with both using and with_check
select 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname = 'public' 
  and tablename = 'investment_files'
  and policyname = 'admins can update investment files';
