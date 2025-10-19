# API Endpoint Implementation Plan: Create Offer

## 1. Przegląd punktu końcowego

Endpoint służy do tworzenia nowych ofert inwestycyjnych w systemie. Jest dostępny wyłącznie dla użytkowników z uprawnieniami administratora. Endpoint przyjmuje dane nowej oferty, waliduje je zgodnie z wymaganiami biznesowymi i zapisuje w bazie danych. Po pomyślnym utworzeniu zwraca pełne dane nowo utworzonej oferty.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/offers`
- **Content-Type:** `application/json`
- **Autoryzacja:** Wymagana (Admin only)

### Parametry

- **Wymagane:**
  - `name` (string) - Nazwa oferty, maksymalnie 255 znaków
  - `target_amount` (number) - Docelowa kwota w złotych (będzie przekonwertowana na centy)
  - `minimum_investment` (number) - Minimalna inwestycja w złotych (będzie przekonwertowana na centy)
  - `end_at` (string) - Data zakończenia oferty w formacie ISO8601

- **Opcjonalne:**
  - `description` (string) - Opis oferty

- **Automatycznie generowane:**
  - `status` - Status oferty (domyślnie "draft")
  - `created_at` - Data utworzenia (automatycznie przez bazę danych)
  - `updated_at` - Data ostatniej modyfikacji (automatycznie przez bazę danych)

### Request Body Example

```json
{
  "name": "Startup XYZ Series A",
  "description": "Inwestycja w innowacyjny startup technologiczny",
  "target_amount": 100000,
  "minimum_investment": 1000,
  "end_at": "2025-12-31T23:59:59Z"
}
```

## 3. Wykorzystywane typy

### DTOs

- `CreateOfferDTO` - Dane wejściowe dla tworzenia oferty (już zdefiniowane w types.ts)
- `OfferDTO` - Pełne dane oferty zwracane w odpowiedzi (już zdefiniowane w types.ts)
- `ApiResponse<OfferDTO>` - Wrapper odpowiedzi API (już zdefiniowany w types.ts)

### Validation Schema (Zod)

```typescript
const createOfferSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana").max(255, "Nazwa może mieć maksymalnie 255 znaków"),
  description: z.string().optional(),
  target_amount: z.number().positive("Docelowa kwota musi być większa od 0"),
  minimum_investment: z.number().positive("Minimalna inwestycja musi być większa od 0"),
  end_at: z.string().datetime("Nieprawidłowy format daty"),
});
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Startup XYZ Series A",
    "description": "Inwestycja w innowacyjny startup technologiczny",
    "target_amount": 10000000,
    "minimum_investment": 100000,
    "end_at": "2025-12-31T23:59:59.000Z",
    "status": "draft",
    "created_at": "2025-10-09T12:00:00.000Z",
    "updated_at": "2025-10-09T12:00:00.000Z"
  }
}
```

### Błędy

- **400 Bad Request:** Nieprawidłowe dane wejściowe
- **401 Unauthorized:** Brak tokenu autoryzacji
- **403 Forbidden:** Użytkownik nie ma uprawnień administratora
- **500 Internal Server Error:** Błąd serwera lub bazy danych

## 5. Przepływ danych

1. **Odbiór żądania** - Astro endpoint otrzymuje żądanie POST
2. **Autoryzacja** - Sprawdzenie czy użytkownik jest zalogowany i ma uprawnienia administratora
3. **Walidacja danych** - Użycie Zod schema do walidacji danych wejściowych
4. **Transformacja danych** - Konwersja kwot z złotych na centy (×100)
5. **Generowanie statusu** - Dodanie `status` ("draft")
6. **Zapis do bazy** - Wykorzystanie Supabase klienta do zapisu w tabeli `offers`
7. **Zwrócenie odpowiedzi** - Formatowanie i zwrócenie danych nowo utworzonej oferty

```text
POST /api/offers
     ↓
[Auth Middleware] → Sprawdzenie uprawnień admin
     ↓
[Validation] → Zod schema validation (w tym end_at)
     ↓
[Data Transform] → Konwersja kwot (PLN → centy)
     ↓
[Auto Status] → Dodanie status ("draft")
     ↓
[Database] → Supabase INSERT do tabeli offers
     ↓
[Response] → Zwrócenie OfferDTO z kodem 201
```

## 6. Względy bezpieczeństwa

### Autoryzacja

- Sprawdzenie obecności ważnego tokenu JWT w header Authorization
- Weryfikacja roli użytkownika (admin) poprzez Supabase Auth
- Użycie middleware Astro do centralizacji logiki autoryzacji

### Walidacja danych

- Wszystkie dane wejściowe walidowane przez Zod schema
- Sanityzacja stringów przed zapisem do bazy
- Walidacja formatu daty ISO8601 dla `end_at`
- Sprawdzenie czy kwoty są dodatnie
- Automatyczne generowanie statusu w kodzie aplikacji

### Zabezpieczenia bazy danych

- Wykorzystanie Row Level Security (RLS) w Supabase
- Prepared statements zapobiegające SQL injection
- Walidacja na poziomie bazy danych (NOT NULL constraints)

## 7. Obsługa błędów

### Scenariusze błędów i kody odpowiedzi

| Scenariusz                   | Kod | Opis                                               |
| ---------------------------- | --- | -------------------------------------------------- |
| Brak autoryzacji             | 401 | Missing or invalid authorization token             |
| Niewystarczające uprawnienia | 403 | User is not an administrator                       |
| Brakujące wymagane pola      | 400 | Missing required fields: name, target_amount, etc. |
| Nieprawidłowy format daty    | 400 | Invalid datetime format for end_at field           |
| Ujemne kwoty                 | 400 | Amounts must be positive numbers                   |
| Nazwa zbyt długa             | 400 | Name exceeds 255 characters limit                  |
| Błąd bazy danych             | 500 | Database connection or constraint error            |
| Nieoczekiwany błąd           | 500 | Internal server error                              |

### Struktura odpowiedzi błędu

```json
{
  "error": "Validation failed",
  "message": "Podane dane są nieprawidłowe",
  "details": [
    {
      "field": "target_amount",
      "message": "Docelowa kwota musi być większa od 0"
    }
  ]
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

- Operacje zapisu do bazy danych Supabase
- Walidacja złożonych danych wejściowych
- Autoryzacja przy każdym żądaniu

### Strategie optymalizacji

- **Caching:** Cache uprawnień użytkownika w sesji/JWT
- **Database indexing:** Indeksy na kolumnach `status`, `created_at` dla przyszłych zapytań
- **Connection pooling:** Wykorzystanie connection poolingu Supabase
- **Validation caching:** Cache skompilowanych schematów Zod

## 9. Etapy wdrożenia

### 1. Przygotowanie struktury plików

- Utworzenie `src/pages/api/offers.ts` - główny endpoint
- Utworzenie `src/lib/services/offers.service.ts` - logika biznesowa
- Utworzenie `src/lib/validators/offers.validator.ts` - schematy Zod

### 2. Implementacja walidacji

- Zdefiniowanie `createOfferSchema` w validators
- Implementacja funkcji walidacyjnych z odpowiednimi komunikatami błędów
- Testy jednostkowe dla walidacji

### 3. Implementacja serwisu

- Utworzenie `OffersService` z metodą `createOffer`
- Implementacja logiki konwersji kwot (PLN → centy)
- Implementacja automatycznego generowania `status` ("draft")
- Implementacja komunikacji z Supabase
- Obsługa błędów bazy danych

### 4. Implementacja endpointu API

- Utworzenie handler funkcji POST w `src/pages/api/offers.ts`
- Integracja z middleware autoryzacji
- Połączenie walidacji z serwisem
- Formatowanie odpowiedzi zgodnie z ApiResponse

### 5. Middleware autoryzacji

- Implementacja sprawdzania uprawnień administratora
- Integracja z Supabase Auth
- Centralizacja logiki autoryzacji w `src/middleware/index.ts`

### 6. Testy i walidacja

- Testy jednostkowe serwisu
- Testy integracyjne endpointu
- Testy autoryzacji i bezpieczeństwa
- Walidacja z różnymi scenariuszami danych

### 7. Dokumentacja i finalizacja

- Aktualizacja dokumentacji API
- Przegląd kodu (code review)
- Deployment na środowisko testowe
- Finalne testy akceptacyjne

### Struktura plików po implementacji

```text
src/
├── pages/api/
│   └── offers.ts                 # POST endpoint
├── lib/
│   ├── services/
│   │   └── offers.service.ts     # Business logic
│   └── validators/
│       └── offers.validator.ts   # Zod schemas
└── middleware/
    └── index.ts                  # Auth middleware (extended)
```

### Definicja gotowości (Definition of Done)

- [ ] Endpoint zwraca poprawne kody statusu HTTP
- [ ] Walidacja wszystkich wymaganych i opcjonalnych pól
- [ ] Autoryzacja admin-only działa poprawnie
- [ ] Obsługa wszystkich scenariuszy błędów
- [ ] Testy jednostkowe i integracyjne przechodzą
- [ ] Dokumentacja API zaktualizowana
- [ ] Code review przeprowadzony
- [ ] Deployment na środowisko testowe
