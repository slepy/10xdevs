-- Update user metadata for user 7c5d2fdb-4777-4e50-a607-f369a96afff5
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)

UPDATE auth.users
SET
  raw_user_meta_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{firstName}',
        '"Andrzej"'
      ),
      '{lastName}',
      '"Ziemba"'
    ),
    '{role}',
    '"admin"'
  ),
  updated_at = now()
WHERE id = '7c5d2fdb-4777-4e50-a607-f369a96afff5';

-- Verify the update
SELECT
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE id = '7c5d2fdb-4777-4e50-a607-f369a96afff5';
