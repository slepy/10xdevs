# API Endpoint Implementation Plan: Get Investment Details

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom pobierania szczegółowych informacji o konkretnej inwestycji na podstawie jej identyfikatora. Punkt końcowy zwróci pełne dane inwestycji wraz z danymi powiązanej oferty. Dostęp jest ograniczony do właściciela inwestycji lub użytkowników z rolą administratora.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/investments/:investmentId`
- **Parametry:**
  - **Wymagane:**
    - `investmentId` (parametr ścieżki): Unikalny identyfikator (UUID) inwestycji, która ma zostać pobrana.
  - **Opcjonalne:** Brak.
- **Request Body:** Brak (dla metody GET).

## 3. Wykorzystywane typy

- **`InvestmentDetailsDTO`**: Główny obiekt transferu danych (DTO) używany w odpowiedzi. Będzie zawierał wszystkie pola z `InvestmentDTO` oraz zagnieżdżone obiekty `offer` (typu `OfferDTO`) i `user` (typu `UserDTO`).
- **`ApiErrorResponse`**: Standardowy format odpowiedzi w przypadku wystąpienia błędu.
- **`z.string().uuid()`**: Do walidacji formatu `investmentId`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):**

  ```json
  {
    "data": {
      "id": "uuid-string",
      "user_id": "uuid-string",
      "offer_id": "uuid-string",
      "amount": 500000,
      "status": "pending",
      "created_at": "iso-date-string",
      "completed_at": null,
      "reason": null,
      "offer": {
        "id": "uuid-string",
        "name": "Sample Offer",
        "description": "Offer description.",
        "target_amount": 100000000,
        "min_investment": 100000,
        "status": "active",
        "created_at": "iso-date-string",
        "updated_at": "iso-date-string"
      },
      "user": {
        "id": "uuid-string",
        "email": "user@example.com",
        "role": "signer",
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  }
  ```

- **Odpowiedzi błędów:**
  - **400 Bad Request:** `investmentId` nie jest prawidłowym UUID.
  - **401 Unauthorized:** Użytkownik nie jest uwierzytelniony.
  - **403 Forbidden:** Użytkownik próbuje uzyskać dostęp do zasobu, do którego nie ma uprawnień.
  - **404 Not Found:** Inwestycja o podanym ID nie istnieje.
  - **500 Internal Server Error:** Wystąpił błąd serwera.

## 5. Przepływ danych

1. Żądanie `GET` trafia do endpointu Astro `/src/pages/api/investments/[investmentId].ts`.
2. Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT użytkownika. Jeśli jest nieprawidłowy, zwraca 401. Dane użytkownika i klienta Supabase są umieszczane w `context.locals`.
3. Handler endpointu wyodrębnia `investmentId` z parametrów URL.
4. `investmentId` jest walidowane przy użyciu `zod` w celu sprawdzenia, czy jest to prawidłowy format UUID. W przypadku błędu zwracany jest status 400.
5. Handler wywołuje metodę `getInvestmentDetails(investmentId)` z serwisu `InvestmentService`.
6. `InvestmentService` wykonuje zapytanie do bazy danych Supabase, używając klienta z `context.locals.supabase`. Zapytanie pobiera inwestycję (`investments`) i powiązane z nią dane oferty (`offers`) oraz użytkownika (`users_view`) za pomocą `JOIN`.
7. Zapytanie SQL zawiera klauzulę `WHERE` sprawdzającą, czy `id` inwestycji pasuje oraz czy `user_id` pasuje do ID zalogowanego użytkownika (chyba że użytkownik ma rolę `admin`).
8. Jeśli zapytanie nie zwróci żadnych wyników, serwis zgłasza błąd `NotFoundError`, który jest mapowany na odpowiedź 404.
9. Jeśli dane zostaną znalezione, serwis mapuje je na DTO `InvestmentDetailsDTO` i zwraca do handlera.
10. Handler endpointu opakowuje DTO w standardową strukturę `ApiResponse` i wysyła odpowiedź JSON ze statusem 200.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Dostęp do punktu końcowego jest chroniony przez middleware, który weryfikuje sesję użytkownika Supabase. Wszystkie żądania od nieuwierzytelnionych użytkowników będą odrzucane.
- **Autoryzacja:** Logika autoryzacji zostanie zaimplementowana w `InvestmentService`. Sprawdzi ona, czy `user_id` zalogowanego użytkownika jest zgodne z `user_id` w rekordzie inwestycji. Użytkownicy z rolą `admin` będą mieli dostęp do wszystkich inwestycji. Zapobiegnie to atakom typu IDOR.
- **Walidacja danych wejściowych:** Parametr `investmentId` będzie walidowany, aby upewnić się, że jest to prawidłowy UUID, co zapobiega potencjalnym błędom zapytań do bazy danych.

## 7. Rozważania dotyczące wydajności

- **Zapytanie do bazy danych:** Zamiast wykonywać dwa osobne zapytania (jedno dla inwestycji, drugie dla oferty), zostanie użyte jedno zapytanie z `JOIN`. To minimalizuje liczbę odwołań do bazy danych.
- **Indeksowanie:** Należy upewnić się, że kolumny `id` i `user_id` w tabeli `investments` są odpowiednio zindeksowane, aby zapewnić szybkie wyszukiwanie. Klucze podstawowe i obce są domyślnie indeksowane, więc nie powinno być potrzeby dodatkowych działań.
- **Rozmiar odpowiedzi:** Odpowiedź zawiera tylko niezbędne dane. W przyszłości, w przypadku dołączania większej liczby relacji, można rozważyć wprowadzenie mechanizmu `fields` do ograniczania zwracanych pól.

## 8. Etapy wdrożenia

1. **Utworzenie pliku endpointu:** Stworzyć plik `src/pages/api/investments/[investmentId].ts` z podstawową strukturą handlera `GET`.
2. **Implementacja walidacji:** W handlerze `GET` dodać walidację parametru `investmentId` przy użyciu `zod`.
3. **Rozszerzenie serwisu:** Dodać nową metodę `getInvestmentDetails` do `src/lib/services/investment.service.ts` (lub utworzyć plik, jeśli nie istnieje).
4. **Implementacja logiki pobierania danych:** W `getInvestmentDetails` zaimplementować zapytanie do Supabase, które pobiera inwestycję wraz z danymi oferty, uwzględniając logikę autoryzacji (sprawdzanie `user_id` lub roli `admin`).
5. **Obsługa błędów w serwisie:** Dodać obsługę przypadku, gdy inwestycja nie zostanie znaleziona (zgłoszenie błędu `NotFoundError`).
6. **Integracja serwisu z endpointem:** Wywołać metodę `getInvestmentDetails` z poziomu handlera `GET` i przekazać jej `investmentId` oraz dane użytkownika.
7. **Formatowanie odpowiedzi:** W handlerze `GET` obsłużyć pomyślne wyniki oraz błędy zwrócone przez serwis, formatując je do standardowej struktury `ApiResponse` i wysyłając z odpowiednim kodem statusu.
8. **Napisanie testów jednostkowych:** Utworzyć plik `investment.service.test.ts` i napisać testy dla nowej metody, sprawdzając scenariusze sukcesu, braku uprawnień i nieznalezienia zasobu.
9. **Napisanie testów integracyjnych:** Utworzyć plik `api-investment-details.test.ts` w `tests/integration`, aby przetestować cały przepływ od żądania HTTP do odpowiedzi, używając MSW do mockowania Supabase.
