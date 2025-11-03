-- ============================================================================
-- create investment_files table
-- ============================================================================
--
-- purpose: store metadata about files attached to accepted investments
-- admins can upload files to accepted investments
-- signers can view files attached to their investments
--

-- ============================================================================
-- 1. create investment_files table
-- ============================================================================

create table if not exists public.investment_files (
  id uuid primary key default gen_random_uuid(),
  investment_id uuid not null references public.investments(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  file_type text,
  uploaded_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ============================================================================
-- 2. add indexes for performance
-- ============================================================================

create index idx_investment_files_investment_id on public.investment_files(investment_id) where deleted_at is null;
create index idx_investment_files_uploaded_by on public.investment_files(uploaded_by) where deleted_at is null;
create index idx_investment_files_deleted_at on public.investment_files(deleted_at) where deleted_at is not null;

-- ============================================================================
-- 3. add comments
-- ============================================================================

comment on table public.investment_files is 'stores metadata about files attached to investments';
comment on column public.investment_files.id is 'unique identifier for the file record';
comment on column public.investment_files.investment_id is 'reference to the investment this file belongs to';
comment on column public.investment_files.file_name is 'original filename uploaded by user';
comment on column public.investment_files.file_path is 'path to file in supabase storage bucket';
comment on column public.investment_files.file_size is 'file size in bytes';
comment on column public.investment_files.file_type is 'mime type of the file';
comment on column public.investment_files.uploaded_by is 'user id who uploaded the file';
comment on column public.investment_files.created_at is 'timestamp when record was created';
comment on column public.investment_files.updated_at is 'timestamp when record was last updated';
comment on column public.investment_files.deleted_at is 'soft delete timestamp';

-- ============================================================================
-- 4. enable row level security
-- ============================================================================

alter table public.investment_files enable row level security;

-- ============================================================================
-- 5. rls policies
-- ============================================================================

-- policy: admins can view all investment files
create policy "admins can view all investment files"
on public.investment_files
for select
using (
  (
    select (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  and deleted_at is null
);

-- policy: signers can view files for their own investments
create policy "signers can view their investment files"
on public.investment_files
for select
using (
  exists (
    select 1
    from public.investments
    where investments.id = investment_files.investment_id
      and investments.user_id = auth.uid()
      and investments.deleted_at is null
  )
  and deleted_at is null
);

-- policy: admins can upload files to accepted investments
create policy "admins can upload files to accepted investments"
on public.investment_files
for insert
with check (
  (
    select (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  and exists (
    select 1
    from public.investments
    where investments.id = investment_files.investment_id
      and investments.status = 'accepted'
      and investments.deleted_at is null
  )
);

-- policy: admins can delete files
create policy "admins can delete investment files"
on public.investment_files
for delete
using (
  (
    select (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- ============================================================================
-- 6. create trigger for updated_at
-- ============================================================================

create or replace function public.update_investment_files_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_update_investment_files_updated_at
  before update on public.investment_files
  for each row
  execute function public.update_investment_files_updated_at();

-- ============================================================================
-- verification queries
-- ============================================================================

-- verify table exists
select table_name, table_type
from information_schema.tables
where table_schema = 'public' and table_name = 'investment_files';

-- verify rls is enabled
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'investment_files';

-- verify policies exist
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public' and tablename = 'investment_files'
order by policyname;
