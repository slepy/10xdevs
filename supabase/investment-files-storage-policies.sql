-- ============================================================================
-- supabase storage policies for investment_files bucket
-- ============================================================================
--
-- note: first create bucket 'investment_files' with public = false
-- in supabase dashboard: storage -> new bucket -> name: investment_files, public: no
--

-- ============================================================================
-- 1. remove existing policies (if any)
-- ============================================================================

drop policy if exists "admins can view all investment files" on storage.objects;
drop policy if exists "signers can view their investment files" on storage.objects;
drop policy if exists "admins can upload investment files" on storage.objects;
drop policy if exists "admins can delete investment files" on storage.objects;
drop policy if exists "admins can update investment files" on storage.objects;

-- ============================================================================
-- 2. select policy - admins can view all files
-- ============================================================================

create policy "admins can view all investment files"
on storage.objects
for select
using (
  bucket_id = 'investment_files'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- 3. select policy - signers can view files from their investments
-- ============================================================================

-- note: path format is: investment_files/{investment_id}/{filename}
-- we extract investment_id from path and check if user owns that investment

create policy "signers can view their investment files"
on storage.objects
for select
using (
  bucket_id = 'investment_files'
  and auth.uid() is not null
  and exists (
    select 1
    from public.investments
    where investments.id = (
      -- extract investment_id from path (first segment after bucket)
      select split_part(storage.objects.name, '/', 1)::uuid
    )
    and investments.user_id = auth.uid()
    and investments.deleted_at is null
  )
);

-- ============================================================================
-- 4. insert policy - admins can upload files to accepted investments
-- ============================================================================

create policy "admins can upload investment files"
on storage.objects
for insert
with check (
  bucket_id = 'investment_files'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  and exists (
    select 1
    from public.investments
    where investments.id = (
      -- extract investment_id from path
      select split_part(storage.objects.name, '/', 1)::uuid
    )
    and investments.status = 'accepted'
    and investments.deleted_at is null
  )
);

-- ============================================================================
-- 5. update policy - admins can update files
-- ============================================================================

create policy "admins can update investment files"
on storage.objects
for update
using (
  bucket_id = 'investment_files'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- 6. delete policy - admins can delete files
-- ============================================================================

create policy "admins can delete investment files"
on storage.objects
for delete
using (
  bucket_id = 'investment_files'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- verification
-- ============================================================================

-- check policies
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where tablename = 'objects'
  and schemaname = 'storage'
  and policyname like '%investment files%'
order by policyname;

-- check bucket exists
select name, public from storage.buckets where name = 'investment_files';
