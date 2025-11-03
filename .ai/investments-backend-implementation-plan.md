# API Endpoint Implementation Plan: GET /api/investments

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za pobieranie listy inwestycji dokonanych przez aktualnie uwierzytelnionego użytkownika. Umożliwia paginację wyników oraz filtrowanie ich na podstawie statusu inwestycji. Zapewnia użytkownikom wgląd w historię i bieżący stan ich działań inwestycyjnych.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/investments`
- **Parametry zapytania (Query Parameters):**
  - **Opcjonalne:**
    - `page` (number): Numer strony wyników. Domyślnie: `1`.
    - `limit` (number): Liczba wyników na stronie. Domyślnie: `10`.
    - `status` (string): Status inwestycji do filtrowania (np. `pending`, `accepted`, `completed`). Musi być jedną z wartości z typu `InvestmentStatus`.
- **Request Body:** Brak (dla metody GET).

## 3. Wykorzystywane typy

- **`InvestmentQueryParams`**: Do walidacji i obsługi parametrów zapytania (`page`, `limit`, `status`).
- **`InvestmentDTO`**: Do reprezentacji pojedynczej inwestycji w odpowiedzi.
- **`PaginatedResponse<InvestmentDTO>` (jako `InvestmentListResponse`)**: Do strukturyzacji odpowiedzi, zawierającej listę inwestycji i metadane paginacji (`pagination`).
- **`UserDTO`**: Do przechowywania informacji o zalogowanym użytkowniku pobranych z `Astro.locals`.

## 4. Szczegóły odpowiedzi

- **200 OK:**
  - **Opis:** Pomyślne pobranie danych.
  - **Struktura Body:** `InvestmentListResponse`

    ```json
    {
      "data": [
        {
          "id": "uuid-goes-here",
          "user_id": "current-user-uuid",
          "offer_id": "offer-uuid",
          "amount": 500000,
          "status": "accepted",
          "created_at": "2025-10-31T10:00:00Z",
          "completed_at": null,
          "reason": null,
          "deleted_at": null
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

- **400 Bad Request:** Nieprawidłowe parametry zapytania.
- **401 Unauthorized:** Użytkownik nie jest uwierzytelniony.
- **500 Internal Server Error:** Błąd serwera.

## 5. Przepływ danych

1. Żądanie `GET` trafia do endpointu `/api/investments` w Astro (`src/pages/api/investments/index.astro`).
2. Middleware Astro weryfikuje token JWT. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`. Dane użytkownika są dostępne w `Astro.locals.user`.
3. Handler endpointu pobiera parametry `page`, `limit`, `status` z URL.
4. Parametry są walidowane przy użyciu schemy `zod`. W przypadku błędu zwracany jest status `400 Bad Request`.
5. Handler wywołuje metodę z serwisu `InvestmentService`, np. `getUserInvestments(user.id, validatedParams, supabase)`, przekazując ID użytkownika, zwalidowane parametry i instancję klienta Supabase z `Astro.locals.supabase`.
6. `InvestmentService` buduje zapytanie do bazy danych Supabase:
    - Pobiera rekordy z tabeli `investments`.
    - Stosuje filtr `where('user_id', 'eq', userId)`.
    - Jeśli podano `status`, dodaje filtr `where('status', 'eq', status)`.
    - Stosuje paginację za pomocą `.range((page - 1) * limit, page * limit - 1)`.
    - Wykonuje drugie zapytanie, aby zliczyć wszystkie pasujące rekordy (`count`) na potrzeby paginacji.
7. Serwis formatuje odpowiedź, tworząc obiekt `InvestmentListResponse` i zwraca go do handlera.
8. Handler serializuje odpowiedź do formatu JSON i wysyła ją z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Dostęp do endpointu musi być chroniony i wymagać ważnego tokenu JWT. Middleware Astro jest odpowiedzialny za weryfikację sesji.
- **Autoryzacja:** Zapytanie do bazy danych musi bezwzględnie zawierać warunek `WHERE user_id = <ID_ZALOGOWANEGO_UŻYTKOWNIKA>`, aby uniemożliwić dostęp do danych innych użytkowników. Należy upewnić się, że polityka RLS (Row Level Security) w Supabase jest skonfigurowana dla tabeli `investments`, aby zapewnić dodatkową warstwę ochrony na poziomie bazy danych.
- **Walidacja wejścia:** Wszystkie parametry zapytania muszą być rygorystycznie walidowane, aby zapobiec błędom i potencjalnym atakom (np. poprzez nieoczekiwane wartości `status`).

## 7. Rozważania dotyczące wydajności

- **Indeksy bazy danych:** Należy upewnić się, że na kolumnach `user_id` i `status` w tabeli `investments` istnieją indeksy, aby przyspieszyć operacje filtrowania i wyszukiwania.
- **Paginacja:** Zawsze należy stosować paginację (`limit`) w zapytaniach do bazy danych, aby uniknąć pobierania dużej liczby rekordów naraz, co mogłoby obciążyć serwer i spowolnić odpowiedź.
- **Zliczanie rekordów:** Zapytanie zliczające (`count`) powinno używać tych samych filtrów co główne zapytanie, aby zapewnić spójność danych paginacji.

## 8. Etapy wdrożenia

1. **Walidacja:** Stworzyć schemę `zod` dla `InvestmentQueryParams` w `src/lib/validators/investment.validator.ts` (jeśli nie istnieje).
2. **Serwis:** Zaimplementować metodę `getUserInvestments` w `src/lib/services/investment.service.ts`. Metoda ta będzie zawierać logikę budowania i wykonywania zapytań do Supabase.
3. **Endpoint:** Utworzyć plik `src/pages/api/investments/index.astro`.
4. **Logika handlera:** W pliku `index.astro`:
    - Sprawdzić, czy użytkownik jest zalogowany (`Astro.locals.user`).
    - Zwalidować parametry zapytania przy użyciu przygotowanej schemy `zod`.
    - Wywołać metodę z `InvestmentService`, przekazując niezbędne dane.
    - Obsłużyć potencjalne błędy (z serwisu lub walidacji) i zwrócić odpowiednie kody statusu.
    - Zwrócić pomyślną odpowiedź w formacie JSON.
5. **Testy:**
    - **Testy jednostkowe/integracyjne (Vitest):** Przetestować logikę `InvestmentService`, mockując klienta Supabase. Sprawdzić poprawność budowania zapytań dla różnych parametrów.
    - **Testy API (Vitest + MSW/Supertest):** Przetestować endpoint API, symulując różne scenariusze:
        - Poprawne żądanie z paginacją i filtrowaniem.
        - Żądanie bez uwierzytelnienia (oczekiwany status 401).
        - Żądanie z nieprawidłowymi parametrami (oczekiwany status 400).
        - Przypadek, gdy baza danych zwraca błąd (oczekiwany status 500).
