-- ============================================================================
-- SUPABASE STORAGE POLICIES FOR offer_images BUCKET
-- ============================================================================
-- 
-- UWAGA: Najpierw upewnij się, że bucket 'offer_images' istnieje i jest publiczny
-- Możesz to zrobić w panelu Supabase: Storage -> New bucket -> Name: offer_images, Public: Yes
--

-- ============================================================================
-- 1. USUŃ ISTNIEJĄCE POLITYKI (jeśli istnieją)
-- ============================================================================

DROP POLICY IF EXISTS "Public Access to Offer Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Can Upload Offer Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Can Delete Offer Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Can Update Offer Images" ON storage.objects;

-- ============================================================================
-- 2. POLITYKA SELECT - Wszyscy mogą czytać obrazy ofert (bucket publiczny)
-- ============================================================================

CREATE POLICY "Public Access to Offer Images"
ON storage.objects 
FOR SELECT
USING (bucket_id = 'offer_images');

-- ============================================================================
-- 3. POLITYKA INSERT - Tylko zalogowani administratorzy mogą uploadować
-- ============================================================================

CREATE POLICY "Admin Can Upload Offer Images"
ON storage.objects 
FOR INSERT
WITH CHECK (
  bucket_id = 'offer_images'
  AND auth.uid() IS NOT NULL
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    -- Alternatywna walidacja przez app_metadata (jeśli używasz)
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);

-- ============================================================================
-- 4. POLITYKA UPDATE - Tylko administratorzy mogą aktualizować
-- ============================================================================

CREATE POLICY "Admin Can Update Offer Images"
ON storage.objects 
FOR UPDATE
USING (
  bucket_id = 'offer_images'
  AND auth.uid() IS NOT NULL
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);

-- ============================================================================
-- 5. POLITYKA DELETE - Tylko administratorzy mogą usuwać
-- ============================================================================

CREATE POLICY "Admin Can Delete Offer Images"
ON storage.objects 
FOR DELETE
USING (
  bucket_id = 'offer_images'
  AND auth.uid() IS NOT NULL
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);

-- ============================================================================
-- WERYFIKACJA POLITYK
-- ============================================================================

-- Sprawdź czy polityki zostały utworzone
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%Offer Images%'
ORDER BY policyname;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Jeśli nadal masz problemy z RLS, sprawdź:

-- 1. Czy bucket istnieje i jest publiczny:
SELECT name, public FROM storage.buckets WHERE name = 'offer_images';

-- 2. Sprawdź metadata użytkownika (zastąp EMAIL_USERA swoim emailem):
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data
FROM auth.users 
WHERE email = 'EMAIL_USERA';

-- 3. Jeśli rola nie jest ustawiona, ustaw ją:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'EMAIL_USERA';

-- 4. Jeśli chcesz użyć app_metadata zamiast user_metadata:
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'EMAIL_USERA';

-- ============================================================================
-- TYMCZASOWE ROZWIĄZANIE (tylko dla development!)
-- ============================================================================

-- Jeśli potrzebujesz tymczasowo zezwolić na upload bez sprawdzania roli
-- (NIE UŻYWAJ NA PRODUKCJI!):

-- DROP POLICY IF EXISTS "Temp Allow All Uploads" ON storage.objects;
-- CREATE POLICY "Temp Allow All Uploads"
-- ON storage.objects 
-- FOR INSERT
-- WITH CHECK (
--   bucket_id = 'offer_images'
--   AND auth.uid() IS NOT NULL
-- );

-- Pamiętaj, aby usunąć tę politykę po debugowaniu!
-- DROP POLICY IF EXISTS "Temp Allow All Uploads" ON storage.objects;
