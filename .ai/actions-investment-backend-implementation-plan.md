# API Endpoint Implementation Plan: Update Investment Status

## 1. Przegląd punktu końcowego

Celem jest wdrożenie dwóch punktów końcowych REST API do zarządzania statusem inwestycji. Pierwszy endpoint (`PUT /api/investments/:investmentId`) jest przeznaczony dla administratorów do zmiany statusu na `accepted`, `rejected` lub `closed`. Drugi (`PUT /api/investments/:investmentId/cancel`) pozwala użytkownikom (`Signer`) na anulowanie własnych, oczekujących inwestycji.

## 2. Szczegóły żądania

### Endpoint 1: Aktualizacja przez administratora

- **Metoda HTTP:** `PUT`
- **Struktura URL:** `/api/investments/:investmentId`
- **Parametry URL:**
  - Wymagane: `investmentId` (UUID)
- **Request Body:**

  ```json
  {
    "status": "accepted" | "rejected" | "closed",
    "reason": "string" 
  }
  ```

- **Parametry Body:**
  - Wymagane: `status`
  - Warunkowo wymagane: `reason` (gdy `status` to `rejected`)

### Endpoint 2: Anulowanie przez użytkownika

- **Metoda HTTP:** `PUT`
- **Struktura URL:** `/api/investments/:investmentId/cancel`
- **Parametry URL:**
  - Wymagane: `investmentId` (UUID)
- **Request Body:**

  ```json
  {
    "reason": "string"
  }
  ```

- **Parametry Body:**
  - Wymagane: `reason`

## 3. Wykorzystywane typy

- **`UpdateInvestmentStatusDTO`**: Istniejący typ dla żądania administratora.
- **`CancelInvestmentDTO` (nowy)**: Do utworzenia dla żądania anulowania przez użytkownika.

  ```typescript
  // in src/types.ts
  export interface CancelInvestmentDTO {
    reason: string;
  }
  ```

- **`InvestmentDTO`**: Istniejący typ dla danych inwestycji w odpowiedzi.
- **`zod` schemy walidacyjne (nowe)**: Do utworzenia w `src/lib/validators/investment.validator.ts` dla obu endpointów.

## 4. Szczegóły odpowiedzi

- **200 OK**: Zwraca zaktualizowany obiekt `InvestmentDTO`.
- **400 Bad Request**: Zwraca błąd walidacji lub błąd logiki biznesowej (np. nieprawidłowe przejście statusu).

  ```json
  { "error": "Invalid state transition", "message": "Cannot cancel an investment that is not pending." }
  ```

- **401 Unauthorized**: Użytkownik niezalogowany.
- **403 Forbidden**: Użytkownik nie ma uprawnień (nie jest adminem lub właścicielem).
- **404 Not Found**: Inwestycja o podanym ID nie istnieje.
- **500 Internal Server Error**: Błąd serwera.

## 5. Przepływ danych

1. Żądanie trafia do odpowiedniego endpointu w `src/pages/api/investments/`.
2. Middleware weryfikuje token JWT i rolę użytkownika (`admin` lub `signer`).
3. Handler endpointu parsuje `investmentId` z URL i body żądania.
4. Dane wejściowe są walidowane za pomocą odpowiedniej schemy `zod`.
5. Handler wywołuje metodę z serwisu `InvestmentService` (`updateInvestmentStatus` lub `cancelInvestment`).
6. Serwis pobiera aktualny stan inwestycji z bazy danych Supabase.
7. Serwis weryfikuje logikę biznesową (uprawnienia, dozwolone przejścia statusów).
8. Jeśli walidacja biznesowa przejdzie pomyślnie, serwis aktualizuje rekord w tabeli `investments` w bazie danych.
9. Serwis zwraca zaktualizowany obiekt inwestycji do handlera.
10. Handler wysyła odpowiedź 200 OK z danymi inwestycji.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wszystkie żądania muszą być uwierzytelnione za pomocą tokena JWT (obsługiwane przez middleware Astro).
- **Autoryzacja**:
  - Endpoint `/api/investments/:investmentId` musi być dostępny tylko dla użytkowników z rolą `admin`.
  - Endpoint `/api/investments/:investmentId/cancel` musi sprawdzać, czy zalogowany użytkownik jest właścicielem danej inwestycji (`investments.user_id`).
- **Walidacja danych**: Wszystkie dane wejściowe (`investmentId`, `status`, `reason`) muszą być rygorystycznie walidowane za pomocą `zod`, aby zapobiec błędom i potencjalnym atakom.

## 7. Rozważania dotyczące wydajności

- Zapytania do bazy danych powinny być zoptymalizowane. Należy pobierać tylko niezbędne dane do weryfikacji statusu i uprawnień.
- Użycie indeksów na kolumnach `id` i `user_id` w tabeli `investments` zapewni szybkie wyszukiwanie.

## 8. Etapy wdrożenia

1. **Aktualizacja typów**: Dodaj `CancelInvestmentDTO` do pliku `src/types.ts`.
2. **Walidacja**: W pliku `src/lib/validators/investment.validator.ts` (utwórz, jeśli nie istnieje) dodaj dwie schemy `zod`:
    - `updateInvestmentStatusSchema` dla endpointu admina.
    - `cancelInvestmentSchema` dla endpointu użytkownika.
3. **Serwis**: W pliku `src/lib/services/investment.service.ts` (utwórz, jeśli nie istnieje) zaimplementuj logikę biznesową:
    - `updateInvestmentStatus(investmentId, status, reason, supabase)`
    - `cancelInvestment(investmentId, userId, reason, supabase)`
4. **Implementacja Endpointu Admina**: Utwórz plik `src/pages/api/investments/[investmentId].astro` z handlerem `PUT`, który:
    - Weryfikuje rolę admina.
    - Waliduje dane wejściowe.
    - Wywołuje `investmentService.updateInvestmentStatus`.
    - Obsługuje błędy i zwraca odpowiednie kody statusu.
5. **Implementacja Endpointu Użytkownika**: Utwórz plik `src/pages/api/investments/[investmentId]/cancel.astro` z handlerem `PUT`, który:
    - Weryfikuje, czy użytkownik jest zalogowany.
    - Waliduje dane wejściowe.
    - Wywołuje `investmentService.cancelInvestment`, przekazując ID zalogowanego użytkownika.
    - Obsługuje błędy i zwraca odpowiednie kody statusu.
6. **Testy jednostkowe**: Napisz testy dla logiki w `investment.service.ts`, mockując Supabase. Przetestuj wszystkie ścieżki (pomyślne i błędne).
7. **Testy integracyjne**: Napisz testy dla obu endpointów API, używając `msw` do mockowania odpowiedzi bazy danych i weryfikacji logiki autoryzacji oraz obsługi błędów.
