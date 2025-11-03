# API Endpoint Implementation Plan: GET /api/offers/available

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za dostarczanie publicznie dostępnej, paginowanej listy ofert inwestycyjnych. Zwraca wyłącznie oferty, które są aktualnie "aktywne" i których termin (`end_at`) jeszcze nie upłynął. Endpoint wspiera paginację i sortowanie, aby umożliwić klientom efektywne przeglądanie dostępnych możliwości inwestycyjnych.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/offers/available`
- **Parametry (Query):**
  - **Wymagane:** Brak
  - **Opcjonalne:**
    - `page` (number, domyślnie 1): Numer strony do wyświetlenia.
    - `limit` (number, domyślnie 10): Liczba ofert na stronie.
    - `sort` (string, domyślnie 'created_at'): Pole, według którego sortowane są wyniki.
- **Request Body:** Brak (dla metody GET).

## 3. Wykorzystywane typy

- **`OfferQueryParams`**: Do typowania i walidacji parametrów zapytania (`page`, `limit`, `sort`).
- **`OfferDTO`**: Do reprezentacji pojedynczej oferty w tablicy `data`.
- **`OfferListResponse`**: Do strukturyzacji całej odpowiedzi, zawierającej `data` (listę ofert) i `pagination` (metadane paginacji).

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):**

  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "target_amount": number,
        "minimum_investment": number,
        "end_at": "ISO8601 datetime",
        "status": "active",
        "created_at": "ISO8601 datetime",
        "updated_at": "ISO8601 datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

- **Odpowiedź błędu (400, 500):**

  ```json
  {
    "error": "string",
    "message": "string",
    "details": [
      {
        "field": "string",
        "message": "string"
      }
    ],
    "statusCode": number
  }
  ```

## 5. Przepływ danych

1. Żądanie GET przychodzi do endpointu `/api/offers/available`.
2. Astro middleware weryfikuje, czy nie ma potrzeby uwierzytelniania (endpoint publiczny).
3. Handler endpointu w `src/pages/api/offers/available.ts` przejmuje żądanie.
4. Parametry zapytania (`page`, `limit`, `sort`) są walidowane przy użyciu schemy Zod.
5. Wywoływana jest metoda `getAvailableOffers` z serwisu `OfferService` (`src/lib/services/offer.service.ts`).
6. Serwis buduje zapytanie do bazy danych Supabase, używając `SupabaseClient` z `context.locals`.
7. Zapytanie filtruje oferty, wybierając tylko te ze statusem `active` i `end_at > NOW()`.
8. Zapytanie uwzględnia paginację (`.range()`) i sortowanie (`.order()`).
9. Serwis wykonuje zapytanie i osobne zapytanie zliczające (`count: 'exact'`), aby uzyskać całkowitą liczbę pasujących ofert.
10. Serwis zwraca dane w formacie `OfferListResponse`.
11. Handler endpointu zwraca odpowiedź w formacie JSON ze statusem 200 OK.

## 6. Względy bezpieczeństwa

- **Walidacja wejścia:** Wszystkie parametry zapytania muszą być walidowane za pomocą Zod, aby zapobiec nieoczekiwanemu zachowaniu i potencjalnym atakom. Należy używać `z.coerce.number()` dla `page` i `limit` oraz `z.enum()` dla `sort`, aby ograniczyć dozwolone wartości.
- **Ochrona przed SQL Injection:** Należy korzystać wyłącznie z buildera zapytań Supabase, unikając surowych zapytań SQL z danymi od użytkownika.
- **Rate Limiting:** Endpoint powinien być chroniony przez mechanizm rate limiting (np. na poziomie infrastruktury lub w middleware), aby zapobiec atakom DoS.
- **Filtrowanie danych:** Logika biznesowa musi rygorystycznie filtrować dane, aby upewnić się, że żadne oferty robocze (`draft`) ani zamknięte (`closed`) nie są publicznie dostępne.

## 7. Obsługa błędów

- **400 Bad Request:** Zwracany, gdy walidacja parametrów zapytania (`page`, `limit`, `sort`) nie powiedzie się. Odpowiedź powinna zawierać szczegóły błędu walidacji.
- **500 Internal Server Error:** Zwracany w przypadku problemów z połączeniem z bazą danych lub innych nieoczekiwanych błędów po stronie serwera. Szczegóły błędu powinny być logowane na serwerze (`console.error`), a klient powinien otrzymać ogólny komunikat o błędzie.

## 8. Rozważania dotyczące wydajności

- **Indeksy bazy danych:** Należy upewnić się, że kolumny `status` i `end_at` w tabeli `offers` są zindeksowane, aby przyspieszyć operacje filtrowania.
- **Paginacja:** Paginacja jest obowiązkowa i powinna mieć rozsądne domyślne i maksymalne wartości `limit`, aby zapobiec pobieraniu zbyt dużych zbiorów danych w jednym żądaniu.
- **Zliczanie rekordów:** Zapytanie zliczające (`count`) jest wykonywane osobno, co jest standardową praktyką, ale dla bardzo dużych tabel może być kosztowne. Na obecnym etapie jest to akceptowalne.

## 9. Etapy wdrożenia

1. **Utworzenie pliku endpointu:** Stwórz plik `src/pages/api/offers/available.ts`.
2. **Walidacja parametrów:** W pliku endpointu zaimplementuj walidację parametrów `page`, `limit` i `sort` przy użyciu biblioteki Zod.
3. **Utworzenie/aktualizacja serwisu:**
    - Jeśli `src/lib/services/offer.service.ts` nie istnieje, utwórz go.
    - Dodaj nową metodę `getAvailableOffers(params: OfferQueryParams)`.
4. **Implementacja logiki serwisu:**
    - W metodzie `getAvailableOffers` zaimplementuj logikę pobierania danych z Supabase.
    - Zbuduj zapytanie filtrujące po `status = 'active'` i `end_at > NOW()`.
    - Dodaj obsługę paginacji (`.range()`) i sortowania (`.order()`).
    - Wykonaj zapytanie, aby pobrać dane oraz zliczyć całkowitą liczbę rekordów.
    - Zwróć obiekt zgodny z typem `OfferListResponse`.
5. **Integracja endpointu z serwisem:**
    - W handlerze endpointu (`available.ts`) wywołaj metodę `offerService.getAvailableOffers()` z poprawnymi parametrami.
    - Zaimplementuj blok `try...catch` do obsługi błędów z serwisu i zwracania odpowiedzi 500.
6. **Testy jednostkowe:**
    - Utwórz plik `src/lib/services/offer.service.test.ts`.
    - Napisz testy jednostkowe dla metody `getAvailableOffers`, mockując `SupabaseClient`, aby przetestować poprawność budowania zapytań i obsługi różnych scenariuszy (dane istnieją, brak danych).
7. **Testy integracyjne:**
    - Utwórz plik `tests/integration/api-offers-available.test.ts`.
    - Użyj `msw` (Mock Service Worker) do mockowania odpowiedzi Supabase na poziomie sieci.
    - Napisz testy sprawdzające poprawność odpowiedzi endpointu dla różnych parametrów zapytania (domyślne, z paginacją, z sortowaniem, z błędnymi parametrami).
    - Sprawdź, czy endpoint poprawnie zwraca kody statusu 200, 400 i 500.
