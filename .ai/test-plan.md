# Kompleksowy Plan Testów dla Aplikacji BlindInvest

Ten dokument opisuje strategię testowania dla aplikacji `BlindInvest` w wersji MVP. Celem jest zapewnienie wysokiej jakości, stabilności i bezpieczeństwa aplikacji przed jej wdrożeniem. Plan obejmuje różne poziomy testów, od jednostkowych po E2E, i jest dostosowany do stosu technologicznego projektu (Astro, React, Supabase).

## 1. Testy Jednostkowe (Unit Tests)

**Cel:** Weryfikacja poprawności działania najmniejszych, izolowanych fragmentów kodu (funkcji, komponentów, walidatorów) w oderwaniu od reszty systemu.

**Sugerowane narzędzia:**

- **Runner testów:** **Vitest** – nowoczesny i niezwykle szybki framework do testowania, który doskonale integruje się z Astro (opartym na Vite).
- **Testowanie komponentów:** **React Testing Library** – do testowania komponentów React w sposób, w jaki używają ich użytkownicy.
- **Mockowanie:** Wbudowane funkcje mockowania w **Vitest** (`vi.mock`).

**Priorytety i obszary do przetestowania:**

1. **Walidatory Zod (`/src/lib/validators/*.ts`):**
   - **Dlaczego:** Są fundamentem bezpieczeństwa i integralności danych. Są to czyste funkcje, łatwe do testowania.
   - **Co testować:** Poprawność schematów walidacji dla różnych danych wejściowych.
   - **Przykładowe przypadki testowe dla `auth.validator.ts`:**
     - **Rejestracja:**
       - Powinna przejść dla poprawnych danych (np. `email: 'test@example.com'`, `password: 'ValidPassword123'`).
       - Powinna zwrócić błąd dla nieprawidłowego formatu e-mail (np. `'invalid-email'`).
       - Powinna zwrócić błąd dla zbyt krótkiego hasła (np. `'pass'`).
       - Powinna zwrócić błąd dla hasła niespełniającego wymagań (np. `'passwordwithoutnumber'`).
     - **Logowanie:**
       - Powinna przejść dla poprawnych danych.
       - Powinna zwrócić błąd dla pustego e-maila lub hasła.

2. **Serwisy (`/src/lib/services/*.ts`):**
   - **Dlaczego:** Zawierają kluczową logikę biznesową aplikacji.
   - **Co testować:** Logikę funkcji, mockując zewnętrzne zależności (np. klienta Supabase).
   - **Przykład dla `auth.service.ts`:**
     - Test funkcji `login`: Sprawdź, czy wywołuje `supabase.auth.signInWithPassword` z poprawnymi danymi. Zamockuj odpowiedź Supabase, aby przetestować scenariusz sukcesu i porażki.
   - **Przykład dla `offers.service.ts`:**
     - Test funkcji `getOffers`: Sprawdź, czy wywołuje `supabase.from('offers').select()`. Zamockuj odpowiedź, aby zwrócić listę ofert i zweryfikuj, czy serwis poprawnie ją przetwarza.

3. **Funkcje pomocnicze (`/src/lib/utils.ts`):**
   - **Dlaczego:** Często zawierają logikę reużywaną w wielu miejscach.
   - **Co testować:** Każdą czystą funkcję z różnymi danymi wejściowymi, aby sprawdzić poprawność zwracanych przez nią wyników (np. formatowanie dat, obliczenia).

4. **Komponenty React (`/src/components/**/\*.tsx`):\*\*
   - **Dlaczego:** Zapewniają interaktywność.
   - **Co testować:** Renderowanie komponentów na podstawie propsów, interakcje użytkownika (kliknięcia, wpisywanie tekstu) i zmiany stanu.
   - **Przykład dla `LoginForm.tsx`:**
     - Sprawdź, czy komponent renderuje wszystkie pola formularza i przycisk.
     - Symuluj wpisanie danych przez użytkownika i sprawdź, czy stan komponentu się aktualizuje.
     - Symuluj kliknięcie przycisku "Zaloguj" i sprawdź, czy wywoływana jest odpowiednia funkcja (przekazana w propsach).

## 2. Testy Integracyjne (Integration Tests)

**Cel:** Weryfikacja poprawnej współpracy kilku modułów/komponentów.

**Sugerowane narzędzia:**

- **Vitest** + **React Testing Library**.
- **Mock Service Worker (MSW):** Do przechwytywania i mockowania zapytań API na poziomie sieci. Pozwala to testować integrację frontendu z backendem bez uruchamiania prawdziwego serwera.

**Scenariusze testowe:**

1. **Integracja Formularz -> Serwis -> API (mockowane):**
   - **Scenariusz:** Użytkownik wypełnia formularz rejestracji (`RegisterForm.tsx`) i klika "Zarejestruj".
   - **Kroki testu:**
     1. Zrenderuj komponent `RegisterForm.tsx`.
     2. Użyj MSW, aby zamockować endpoint `POST /api/auth/register`. Przygotuj scenariusz odpowiedzi 200 (sukces) i 409 (użytkownik już istnieje).
     3. Symuluj wypełnienie formularza i kliknięcie przycisku.
     4. Sprawdź, czy na ekranie pojawił się komunikat o sukcesie (lub o błędzie, w zależności od zamockowanej odpowiedzi).
     5. Sprawdź, czy zapytanie do API zostało wysłane z poprawnymi danymi.

2. **Integracja Serwis -> Klient Supabase (mockowany):**
   - **Scenariusz:** Testowanie serwisu `offers.service.ts`, który pobiera dane za pomocą klienta Supabase.
   - **Kroki testu:**
     1. Użyj `vi.mock` do zamockowania całego modułu `/src/db/supabase.client.ts`.
     2. W teście funkcji `getOffers` zdefiniuj, co ma zwrócić zamockowana funkcja `supabase.from(...).select()`.
     3. Wywołaj `getOffers` i sprawdź, czy poprawnie przetwarza i zwraca dane otrzymane z mocka Supabase.
     4. Przetestuj również scenariusz, w którym mock Supabase zwraca błąd.

## 3. Testy End-to-End (E2E)

**Cel:** Symulacja rzeczywistych przepływów użytkownika w działającej aplikacji, od początku do końca.

**Sugerowane narzędzia:**

- **Playwright:** Nowoczesne, szybkie i niezawodne narzędzie od Microsoftu. Oferuje świetne funkcje, takie jak auto-waits, nagrywanie testów (Codegen) i testowanie w różnych przeglądarkach. Jest rekomendowany przez zespół Astro.
- **Cypress:** Alternatywa, również bardzo popularna, choć Playwright jest często postrzegany jako bardziej elastyczny.

**Kluczowe ścieżki użytkownika do przetestowania (na podstawie User Stories):**

1. **Pełny cykl uwierzytelniania (US-001, US-002):**
   - Otwórz stronę `/register`.
   - Wypełnij formularz rejestracji i wyślij go.
   - Sprawdź, czy użytkownik został przekierowany na stronę główną i jest zalogowany.
   - Kliknij przycisk "Wyloguj".
   - Sprawdź, czy użytkownik został wylogowany.
   - Przejdź na stronę `/login`, zaloguj się przy użyciu nowo utworzonych danych.
   - Sprawdź, czy logowanie się powiodło.

2. **Cykl inwestycyjny użytkownika "Signer" (US-003, US-006, US-007):**
   - Zaloguj się jako "Signer".
   - Przejdź na stronę z listą ofert.
   - Kliknij w jedną z ofert, aby zobaczyć jej szczegóły.
   - Kliknij przycisk "Inwestuj", wprowadź poprawną kwotę i zatwierdź.
   - Sprawdź, czy pojawiło się potwierdzenie.
   - Przejdź do zakładki "Moje Inwestycje" i zweryfikuj, czy nowa inwestycja jest na liście ze statusem "oczekująca".

3. **Zarządzanie inwestycją przez Administratora (US-009):**
   - Zaloguj się jako "Admin".
   - Przejdź do panelu zarządzania inwestycjami.
   - Znajdź inwestycję złożoną w poprzednim teście.
   - Zmień jej status na "zaakceptowana".
   - Wyloguj się i zaloguj ponownie jako "Signer".
   - Sprawdź w "Moich Inwestycjach", czy status tej inwestycji zmienił się na "zaakceptowana".

## 4. Testy API

**Cel:** Bezpośrednie testowanie endpointów API w celu weryfikacji logiki biznesowej, obsługi błędów i kontraktu danych.

**Sugerowane narzędzia:**

- **Framework do testów API:** Można użyć **Vitest** z biblioteką do zapytań HTTP (np. `supertest` lub `node-fetch`) do testowania endpointów Astro.
- **Narzędzia manualne:** **Postman** lub **Insomnia** do ręcznego wysyłania zapytań podczas developmentu.

**Endpointy i scenariusze testowe:**

- `POST /api/auth/register`
  - **Happy Path:** Poprawne dane -> status 200, zwrot sesji użytkownika.
  - **Błędy:** E-mail już istnieje -> status 409. Nieprawidłowe dane -> status 400.
- `POST /api/auth/login`
  - **Happy Path:** Poprawne dane -> status 200, zwrot sesji.
  - **Błędy:** Błędne hasło/e-mail -> status 401. Nieprawidłowe dane wejściowe -> status 400.
- `POST /api/auth/logout`
  - **Happy Path:** Poprawne wywołanie -> status 200.
- `POST /api/offers` (Tworzenie oferty)
  - **Autoryzacja:** Zapytanie od niezalogowanego użytkownika -> status 401. Zapytanie od "Signer" -> status 403.
  - **Happy Path:** Poprawne dane od "Admina" -> status 201.
  - **Błędy:** Niekompletne dane -> status 400.

## 5. Testy Bezpieczeństwa

**Cel:** Identyfikacja i eliminacja potencjalnych luk w zabezpieczeniach aplikacji.

**Obszary do sprawdzenia:**

1. **Kontrola dostępu (Autoryzacja):**
   - Spróbuj uzyskać dostęp do endpointów i stron przeznaczonych dla administratora (np. `/admin/offers/create`, `POST /api/offers`) jako zalogowany "Signer" oraz jako użytkownik niezalogowany. Oczekiwany rezultat: błąd 403 (Forbidden) lub 401 (Unauthorized).
2. **Walidacja danych wejściowych:**
   - Spróbuj wysłać do API (np. przez Postman) złośliwy kod w polach formularzy (np. `<script>alert('XSS')</script>`). Sprawdź, czy dane są poprawnie sanitowane i czy skrypt nie jest wykonywany po wyświetleniu tych danych na stronie.
3. **Bezpieczeństwo Supabase (Row Level Security - RLS):**
   - **Kluczowe:** To najważniejszy element bezpieczeństwa Twojej aplikacji.
   - **Jak testować:**
     - Napisz skrypty testowe (np. w Node.js z użyciem biblioteki `supabase-js`), które symulują działania różnych użytkowników.
     - **Scenariusz 1:** Zaloguj się jako "Signer" i spróbuj odczytać dane inwestycji innego użytkownika, używając bezpośrednio klienta Supabase. Polityka RLS powinna na to nie pozwolić.
     - **Scenariusz 2:** Zaloguj się jako "Signer" i spróbuj zaktualizować ofertę (`offers`). Polityka RLS powinna zablokować tę operację.
     - **Scenariusz 3:** Sprawdź, czy użytkownik może odczytać tylko swoje własne powiadomienia.

## 6. Testy Dostępności (Accessibility - a11y)

**Cel:** Zapewnienie, że aplikacja jest użyteczna dla jak najszerszej grupy odbiorców, w tym osób z niepełnosprawnościami.

**Sugerowane narzędzia i techniki:**

1. **Automatyczne skanowanie:**
   - **@axe-core/react:** Biblioteka do integracji z React Testing Library, która pozwala na wykrywanie problemów z dostępnością już na poziomie testów jednostkowych i integracyjnych.
   - **Lighthouse (w Chrome DevTools):** Uruchom audyt Lighthouse dla każdej strony, aby uzyskać raport na temat dostępności, wydajności i SEO.
2. **Testy manualne:**
   - **Nawigacja klawiaturą:** Spróbuj poruszać się po całej aplikacji, używając wyłącznie klawisza `Tab`. Sprawdź, czy wszystkie interaktywne elementy (linki, przyciski, pola formularzy) są osiągalne i czy kolejność fokusu jest logiczna.
   - **Czytniki ekranu:** Użyj wbudowanego czytnika ekranu (np. VoiceOver na macOS, NVDA na Windows), aby przetestować kluczowe przepływy. Sprawdź, czy etykiety `aria-label` są poprawnie używane w komponentach `shadcn/ui`.
   - **Kontrast kolorów:** Użyj narzędzi deweloperskich w przeglądarce, aby sprawdzić, czy kontrast między tekstem a tłem jest wystarczający.
