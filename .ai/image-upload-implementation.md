# Implementacja Upload Obrazów dla Ofert

## Przegląd

Dodano funkcjonalność uploadu obrazów do formularza tworzenia ofert. Administrator może teraz dodać do 5 obrazów dla każdej oferty.

## Zaimplementowane pliki

### 1. Komponent MultiImageUpload

**Plik:** `src/components/ui/MultiImageUpload.tsx`

Główny komponent obsługujący:

- Drag & drop wielu plików jednocześnie
- Wybór plików z dysku
- Walidację formatu i rozmiaru plików
- Upload do Supabase Storage z wskaźnikiem postępu
- Podgląd miniatur obrazów
- Usuwanie obrazów
- Oznaczenie pierwszego obrazu jako "Główny"

**Props:**

- `value?: string[]` - tablica URL-i obrazów
- `onChange: (urls: string[]) => void` - callback przy zmianie
- `maxFiles?: number` - max liczba plików (domyślnie 5)
- `maxFileSize?: number` - max rozmiar w bajtach (domyślnie 5MB)
- `acceptedFormats?: string[]` - dozwolone formaty
- `disabled?: boolean` - czy komponent jest wyłączony

### 2. Aktualizacja CreateOfferForm

**Plik:** `src/components/forms/CreateOfferForm.tsx`

Dodano:

- Import `Controller` z `react-hook-form`
- Import `MultiImageUpload`
- Pole `images` w defaultValues
- Sekcję z komponentem `MultiImageUpload` w formularzu
- Przekazanie tablicy `images` do DTO podczas wysyłania

### 3. Endpoint API Upload

**Plik:** `src/pages/api/upload.ts`

Implementuje dwa endpointy:

#### POST /api/upload

- Walidacja autoryzacji (tylko admin)
- Walidacja typu pliku (jpg, jpeg, png, webp)
- Walidacja rozmiaru (max 5MB)
- Upload do Supabase Storage bucket `offer-images`
- Zwraca publiczny URL obrazu

#### DELETE /api/upload

- Walidacja autoryzacji (tylko admin)
- Ekstrakcja ścieżki pliku z URL
- Usunięcie pliku z Supabase Storage

### 4. Aktualizacja walidatora

**Plik:** `src/lib/validators/offers.validator.ts`

Dodano pole `images` do schematu walidacji:

```typescript
images: z.array(z.string().url("Nieprawidłowy URL obrazu")).max(5, "Możesz dodać maksymalnie 5 obrazów").optional()
```

## Wymagana konfiguracja Supabase

### Storage Bucket

Należy utworzyć publiczny bucket o nazwie `offer-images` w Supabase Storage.

Szczegółowe instrukcje konfiguracji znajdują się w pliku:
`.ai/supabase-storage-setup.md`

### Polityki RLS

1. **SELECT** - publiczny dostęp do odczytu
2. **INSERT** - tylko administratorzy mogą uploadować
3. **DELETE** - tylko administratorzy mogą usuwać

## Przepływ użytkownika

1. Administrator otwiera formularz tworzenia oferty
2. Przeciąga i upuszcza do 5 obrazów lub wybiera je z dysku
3. Każdy obraz jest walidowany (typ, rozmiar)
4. Obrazy są kolejno uploadowane do Supabase Storage
5. Wyświetlany jest wskaźnik postępu dla każdego obrazu
6. Po pomyślnym uploadzie wyświetlane są miniatury
7. Administrator może usunąć pojedyncze obrazy
8. Pierwszy obraz jest oznaczony jako "Główny"
9. Przy wysyłaniu formularza, tablica URL-i jest zapisywana w kolumnie `images` w tabeli `offers`

## Walidacje

### Po stronie klienta (MultiImageUpload)

- Typ pliku: jpg, jpeg, png, webp
- Rozmiar pliku: max 5MB
- Liczba plików: max 5

### Po stronie serwera (API /api/upload)

- Autoryzacja: tylko zalogowani użytkownicy
- Rola: tylko administratorzy
- Typ pliku: jpg, jpeg, png, webp
- Rozmiar pliku: max 5MB

### Walidacja Zod

- Tablica URL-i
- Max 5 elementów
- Każdy element musi być prawidłowym URL

## Obsługa błędów

- **Nieprawidłowy format** - komunikat pod polem uploadu
- **Za duży plik** - komunikat pod polem uploadu
- **Za dużo plików** - komunikat pod polem uploadu
- **Błąd uploadu** - komunikat na miniaturze obrazu
- **Błąd usuwania** - komunikat pod polem uploadu
- **Błąd serwera** - komunikat w konsoli + użytkownikowi

## Testowanie

### Test 1: Upload obrazów

1. Zaloguj się jako admin
2. Przejdź do `/admin/offers/create`
3. Przeciągnij 3 obrazy JPG do pola uploadu
4. Sprawdź czy obrazy są uploadowane z wskaźnikiem postępu
5. Sprawdź czy miniatury są wyświetlane

### Test 2: Walidacja formatu

1. Spróbuj dodać plik PDF
2. Sprawdź czy wyświetla się błąd o nieprawidłowym formacie

### Test 3: Walidacja rozmiaru

1. Spróbuj dodać obraz większy niż 5MB
2. Sprawdź czy wyświetla się błąd o za dużym rozmiarze

### Test 4: Limit obrazów

1. Dodaj 5 obrazów
2. Spróbuj dodać szósty obraz
3. Sprawdź czy wyświetla się błąd o przekroczonym limicie

### Test 5: Usuwanie obrazów

1. Dodaj 3 obrazy
2. Usuń drugi obraz
3. Sprawdź czy obraz znika z listy i jest usuwany z Storage

### Test 6: Tworzenie oferty z obrazami

1. Wypełnij formularz oferty
2. Dodaj 2 obrazy
3. Wyślij formularz
4. Sprawdź czy oferta została utworzona z obrazami w bazie

## Możliwe usprawnienia

1. **Drag & drop reorder** - zmiana kolejności obrazów przez przeciąganie
2. **Crop/resize** - edycja obrazów przed uploadem
3. **Lazy loading** - ładowanie miniatur na żądanie
4. **Batch upload** - upload wszystkich obrazów jednocześnie
5. **Preview modal** - powiększony podgląd obrazu po kliknięciu
6. **Cleanup job** - automatyczne usuwanie nieużywanych obrazów
7. **Image optimization** - kompresja obrazów po stronie serwera
8. **CDN integration** - użycie CDN dla lepszej wydajności

## Zależności

- `react-hook-form` - zarządzanie formularzem
- `@hookform/resolvers` - integracja z Zod
- `zod` - walidacja
- `@supabase/ssr` - Supabase client dla SSR
- Komponent `BaseAlert` - wyświetlanie błędów

## Bezpieczeństwo

- ✅ Autoryzacja na poziomie API
- ✅ Walidacja roli administratora
- ✅ Walidacja typu pliku
- ✅ Walidacja rozmiaru pliku
- ✅ RLS policies w Supabase Storage
- ✅ Sanityzacja nazw plików (timestamp prefix)
