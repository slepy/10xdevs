-- migration: add function to update user metadata
-- this function allows updating user_metadata for auth.users table

create or replace function public.update_user_metadata(
  user_id uuid,
  metadata jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  -- update the user_metadata in auth.users table
  update auth.users
  set
    raw_user_meta_data = raw_user_meta_data || metadata,
    updated_at = now()
  where id = user_id;

  -- return the updated user data
  select json_build_object(
    'id', id,
    'email', email,
    'user_metadata', raw_user_meta_data
  )
  into result
  from auth.users
  where id = user_id;

  return result;
end;
$$;

-- grant execute permission to authenticated users (you may want to restrict this further)
grant execute on function public.update_user_metadata(uuid, jsonb) to authenticated;
