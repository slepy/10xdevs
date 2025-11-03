# API Endpoint Implementation Plan: Submit Investment (POST /api/investments)

## 1. Przegląd punktu końcowego

Endpoint umożliwia zalogowanym użytkownikom (z rolą SIGNER lub ADMIN) złożenie deklaracji inwestycji w aktywną ofertę. System waliduje czy:

- Użytkownik jest autoryzowany
- Oferta istnieje i jest aktywna
- Kwota inwestycji spełnia wymagane minimum
- Data zakończenia oferty nie minęła

Po pomyślnej walidacji tworzy nowy rekord inwestycji ze statusem "pending".

## 2. Szczegóły żądania

### Metoda HTTP

POST

### Struktura URL

```
/api/investments
```

### Nagłówki

```
Content-Type: application/json
Cookie: sb-access-token, sb-refresh-token (automatycznie zarządzane przez Supabase middleware)
```

### Parametry

#### Wymagane (Request Body)

```typescript
{
  "offer_id": "uuid",  // UUID oferty, w którą inwestujemy
  "amount": number     // Kwota inwestycji w PLN (zostanie przekonwertowana na centy)
}
```

#### Parametry z kontekstu (nie są przekazywane w body)

- `user_id` - automatycznie pobierany z `locals.user.id` (dane sesji użytkownika)

### Przykład request body

```json
{
  "offer_id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 5000
}
```

## 3. Wykorzystywane typy

### Typy istniejące (src/types.ts)

```typescript
// DTO dla tworzenia inwestycji (Request Body)
export type CreateInvestmentDTO = Pick<TablesInsert<"investments">, "offer_id" | "amount">;

// DTO zwracanego rekordu inwestycji (Response)
export type InvestmentDTO = Tables<"investments">;

// Standardowa odpowiedź API
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Struktura błędu walidacji
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Struktura odpowiedzi błędu
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: ValidationError[];
  statusCode: number;
}

// Statusy inwestycji
export const INVESTMENT_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

export type InvestmentStatus = (typeof INVESTMENT_STATUSES)[keyof typeof INVESTMENT_STATUSES];
```

### Typy do utworzenia

#### 1. Validator (src/lib/validators/investments.validator.ts)

```typescript
import { z } from "zod";

/**
 * Schema walidacji dla tworzenia nowej inwestycji
 * Kwota w złotych (PLN) - będzie przekonwertowana na centy w serwisie
 */
export const createInvestmentSchema = z.object({
  offer_id: z
    .string()
    .uuid("Nieprawidłowy format ID oferty"),

  amount: z
    .number()
    .positive("Kwota musi być większa od 0")
    .max(100000000, "Kwota jest zbyt duża"), // 1 mln PLN - zgodne z limitem z offers.validator.ts
});

/**
 * Typ wynikowy z walidacji dla tworzenia inwestycji
 */
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
```

#### 2. Service (src/lib/services/investments.service.ts)

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateInvestmentInput } from "../validators/investments.validator";
import type { InvestmentDTO } from "../../types";
import { INVESTMENT_STATUSES, OFFER_STATUSES } from "../../types";

/**
 * Serwis do zarządzania inwestycjami
 */
export class InvestmentsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Tworzy nową inwestycję
   * @param data Dane inwestycji po walidacji
   * @param userId ID użytkownika z sesji
   * @returns Utworzona inwestycja lub błąd
   */
  async createInvestment(
    data: CreateInvestmentInput,
    userId: string
  ): Promise<InvestmentDTO> {
    // Implementacja w sekcji 8
  }

  /**
   * Konwertuje kwotę z PLN na centy (grosz)
   * @param amount Kwota w PLN
   * @returns Kwota w groszach
   */
  private convertToSatoshi(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Konwertuje kwotę z groszy na PLN
   * @param satoshi Kwota w groszach
   * @returns Kwota w PLN
   */
  private convertFromSatoshi(satoshi: number): number {
    return satoshi / 100;
  }
}
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "offer_id": "uuid",
    "amount": 5000,
    "status": "pending",
    "created_at": "2025-10-31T10:30:00.000Z",
    "updated_at": "2025-10-31T10:30:00.000Z",
    "completed_at": null,
    "deleted_at": null,
    "reason": null
  },
  "message": "Inwestycja została złożona pomyślnie"
}
```

**Uwaga:** Kwota w odpowiedzi jest zwracana w PLN (po konwersji z centów), tak samo jak w OffersService.

### Błędy

#### 401 Unauthorized (użytkownik niezalogowany)

```json
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany, aby złożyć inwestycję",
  "statusCode": 401
}
```

#### 403 Forbidden (brak uprawnień)

```json
{
  "error": "Forbidden",
  "message": "Nie masz uprawnień do składania inwestycji",
  "statusCode": 403
}
```

#### 400 Bad Request (nieprawidłowy JSON)

```json
{
  "error": "Bad Request",
  "message": "Nieprawidłowy format JSON",
  "statusCode": 400
}
```

#### 400 Bad Request (błąd walidacji Zod)

```json
{
  "error": "Validation failed",
  "message": "Podane dane są nieprawidłowe",
  "details": [
    {
      "field": "offer_id",
      "message": "Nieprawidłowy format ID oferty",
      "code": "invalid_string"
    }
  ],
  "statusCode": 400
}
```

#### 404 Not Found (oferta nie istnieje)

```json
{
  "error": "Not Found",
  "message": "Nie znaleziono oferty o podanym ID",
  "statusCode": 404
}
```

#### 400 Bad Request (walidacja biznesowa - oferta nieaktywna)

```json
{
  "error": "Bad Request",
  "message": "Ta oferta nie jest dostępna do inwestycji",
  "statusCode": 400
}
```

#### 400 Bad Request (walidacja biznesowa - oferta wygasła)

```json
{
  "error": "Bad Request",
  "message": "Oferta jest już nieaktywna",
  "statusCode": 400
}
```

#### 400 Bad Request (kwota poniżej minimum)

```json
{
  "error": "Bad Request",
  "message": "Kwota inwestycji musi wynosić co najmniej 1 000,00 zł",
  "statusCode": 400
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Wystąpił nieoczekiwany błąd serwera",
  "statusCode": 500
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. HTTP POST /api/investments
   ↓
2. Middleware (src/middleware/index.ts)
   - Inicjalizacja Supabase client z ciasteczkami
   - Pobranie danych użytkownika z sesji
   - Zapisanie w locals.supabase i locals.user
   ↓
3. API Route Handler (src/pages/api/investments/index.ts)
   - Sprawdzenie autoryzacji (locals.user)
   - Sprawdzenie roli (SIGNER lub ADMIN)
   - Parsowanie request body (JSON)
   - Walidacja strukturalna (Zod schema)
   ↓
4. InvestmentsService.createInvestment()
   - Pobranie oferty z bazy (supabase.from("offers").select().eq("id", offer_id))
   - Walidacja biznesowa:
     a) Czy oferta istnieje? → jeśli nie: throw Error (404)
     b) Czy status === "active"? → jeśli nie: throw Error (400)
     c) Czy end_at > now()? → jeśli nie: throw Error (400)
     d) Czy amount >= minimum_investment? → jeśli nie: throw Error (400)
   - Konwersja kwoty z PLN na centy (×100)
   - Utworzenie rekordu:
     supabase.from("investments").insert({
       user_id,
       offer_id,
       amount: convertToSatoshi(amount),
       status: "pending"
     })
   - Konwersja kwoty z powrotem na PLN (÷100)
   - Zwrócenie InvestmentDTO
   ↓
5. API Route Handler
   - Zwrócenie odpowiedzi 201 Created z danymi inwestycji
   ↓
6. Client (frontend)
   - Otrzymuje utworzony rekord inwestycji
   - Wyświetla komunikat sukcesu
   - Przekierowuje do listy inwestycji lub szczegółów oferty
```

### Interakcje z bazą danych

1. **SELECT offers** - pobranie szczegółów oferty do walidacji

   ```sql
   SELECT * FROM offers WHERE id = $1
   ```

2. **INSERT investments** - utworzenie nowego rekordu inwestycji

   ```sql
   INSERT INTO investments (user_id, offer_id, amount, status)
   VALUES ($1, $2, $3, 'pending')
   RETURNING *
   ```

### Row Level Security (RLS)

Endpoint nie odpowiada za RLS - to jest zarządzane przez polityki Supabase na poziomie bazy danych. Oczekiwane polityki:

- **offers.select** - authenticated users mogą czytać aktywne oferty
- **investments.insert** - authenticated users mogą tworzyć inwestycje dla siebie (user_id = auth.uid())
- **investments.select** - authenticated users mogą czytać własne inwestycje, admin może czytać wszystkie

## 6. Względy bezpieczeństwa

### 1. Autoryzacja i uwierzytelnianie

**Sprawdzenie autoryzacji:**

```typescript
if (!locals.user) {
  return new Response(JSON.stringify({
    error: "Unauthorized",
    message: "Musisz być zalogowany, aby złożyć inwestycję",
    statusCode: 401,
  }), { status: 401 });
}
```

**Sprawdzenie uprawnień (role):**

```typescript
// Obydwie role (SIGNER i ADMIN) mogą składać inwestycje
if (locals.user.role !== USER_ROLES.SIGNER && locals.user.role !== USER_ROLES.ADMIN) {
  return new Response(JSON.stringify({
    error: "Forbidden",
    message: "Nie masz uprawnień do składania inwestycji",
    statusCode: 403,
  }), { status: 403 });
}
```

**User ID z sesji:**

```typescript
// NIGDY nie ufaj user_id z request body - zawsze używaj user_id z sesji
const userId = locals.user.id;
```

### 2. Walidacja danych wejściowych

**Walidacja strukturalna (Zod):**

- `offer_id` - weryfikacja formatu UUID (zapobiega SQL injection)
- `amount` - weryfikacja typu number i wartości dodatniej (zapobiega ujemnym kwotom)

**Walidacja biznesowa (w serwisie):**

- Weryfikacja czy oferta istnieje
- Weryfikacja czy oferta jest aktywna
- Weryfikacja czy data zakończenia nie minęła
- Weryfikacja czy kwota spełnia minimum

### 3. Zapobieganie atakom

**SQL Injection:**

- Supabase client API używa parametryzowanych zapytań automatycznie
- Dodatkowo Zod schema weryfikuje format UUID

**XSS (Cross-Site Scripting):**

- Endpoint nie zwraca HTML, tylko JSON
- Frontend odpowiada za escapowanie danych przed wyświetleniem

**CSRF (Cross-Site Request Forgery):**

- Supabase używa ciasteczek httpOnly z session tokens
- Wymaga prawidłowych nagłówków CORS

**Race Conditions:**

- Teoretycznie możliwe, że wiele użytkowników jednocześnie inwestuje i przekracza target_amount
- Można rozważyć dodatkową walidację w przyszłości (sprawdzenie sumy istniejących inwestycji)
- Na tym etapie MVP ta walidacja nie jest wymagana

### 4. Zarządzanie błędami

**Nie ujawniaj szczegółów wewnętrznych:**

```typescript
catch (error) {
  console.error("Create investment API error:", error);

  // Nie zwracaj stack trace ani szczegółów bazy danych
  const errorMessage = error instanceof Error
    ? error.message
    : "Wystąpił nieoczekiwany błąd serwera";

  return new Response(JSON.stringify({
    error: "Internal Server Error",
    message: errorMessage,
    statusCode: 500,
  }), { status: 500 });
}
```

### 5. Rate Limiting

W MVP nie implementujemy rate limiting, ale w przyszłości warto rozważyć:

- Limit 10 requestów na minutę na użytkownika
- Implementacja przez middleware lub Cloudflare

## 7. Obsługa błędów

### Katalog błędów

| Typ błędu | Status | Kod błędu | Komunikat | Kiedy występuje |
|-----------|--------|-----------|-----------|-----------------|
| Brak autoryzacji | 401 | Unauthorized | "Musisz być zalogowany, aby złożyć inwestycję" | `locals.user` jest null/undefined |
| Brak uprawnień | 403 | Forbidden | "Nie masz uprawnień do składania inwestycji" | `locals.user.role` nie jest SIGNER ani ADMIN |
| Nieprawidłowy JSON | 400 | Bad Request | "Nieprawidłowy format JSON" | `request.json()` throws error |
| Błąd walidacji Zod | 400 | Validation failed | "Podane dane są nieprawidłowe" + details | `schema.safeParse()` zwraca success: false |
| Oferta nie istnieje | 404 | Not Found | "Nie znaleziono oferty o podanym ID" | Zapytanie SELECT zwraca null |
| Oferta nieaktywna | 400 | Bad Request | "Ta oferta nie jest dostępna do inwestycji" | `offer.status !== "active"` |
| Oferta wygasła | 400 | Bad Request | "Oferta jest już nieaktywna" | `offer.end_at <= new Date()` |
| Kwota poniżej minimum | 400 | Bad Request | "Kwota inwestycji musi wynosić co najmniej {minimum}" | `amount < offer.minimum_investment` |
| Błąd bazy danych | 500 | Internal Server Error | "Wystąpił nieoczekiwany błąd serwera" | Supabase error podczas INSERT |
| Brak konfiguracji | 500 | Server configuration error | "Błąd konfiguracji serwera" | `locals.supabase` jest null/undefined |

### Strategia obsługi błędów w serwisie

```typescript
// W InvestmentsService.createInvestment()

// 1. Sprawdzenie czy oferta istnieje
const { data: offer, error: offerError } = await this.supabase
  .from("offers")
  .select("*")
  .eq("id", data.offer_id)
  .single();

if (offerError || !offer) {
  throw new Error("Nie znaleziono oferty o podanym ID");
}

// 2. Sprawdzenie czy oferta jest aktywna
if (offer.status !== OFFER_STATUSES.ACTIVE) {
  throw new Error("Ta oferta nie jest dostępna do inwestycji");
}

// 3. Sprawdzenie czy oferta nie wygasła
const now = new Date();
const endDate = new Date(offer.end_at);
if (endDate <= now) {
  throw new Error("Oferta jest już nieaktywna");
}

// 4. Sprawdzenie minimalnej kwoty (przed konwersją na centy)
const offerMinimumInPln = this.convertFromSatoshi(offer.minimum_investment);
if (data.amount < offerMinimumInPln) {
  throw new Error(
    `Kwota inwestycji musi wynosić co najmniej ${this.formatCurrency(offerMinimumInPln)}`
  );
}

// 5. Utworzenie inwestycji
const { data: investment, error: insertError } = await this.supabase
  .from("investments")
  .insert({
    user_id: userId,
    offer_id: data.offer_id,
    amount: this.convertToSatoshi(data.amount),
    status: INVESTMENT_STATUSES.PENDING,
  })
  .select()
  .single();

if (insertError || !investment) {
  throw new Error("Nie udało się utworzyć inwestycji");
}
```

### Rozróżnianie błędów w API route

```typescript
try {
  const investment = await investmentsService.createInvestment(
    validationResult.data,
    locals.user.id
  );

  return new Response(JSON.stringify({
    data: investment,
    message: "Inwestycja została złożona pomyślnie",
  }), { status: 201 });

} catch (error) {
  console.error("Create investment API error:", error);

  if (error instanceof Error) {
    const message = error.message;

    // Określenie kodu statusu na podstawie komunikatu błędu
    if (message.includes("Nie znaleziono oferty")) {
      return new Response(JSON.stringify({
        error: "Not Found",
        message,
        statusCode: 404,
      }), { status: 404 });
    }

    if (
      message.includes("nie jest dostępna") ||
      message.includes("jest już nieaktywna") ||
      message.includes("musi wynosić co najmniej")
    ) {
      return new Response(JSON.stringify({
        error: "Bad Request",
        message,
        statusCode: 400,
      }), { status: 400 });
    }
  }

  // Domyślny błąd 500
  return new Response(JSON.stringify({
    error: "Internal Server Error",
    message: "Wystąpił nieoczekiwany błąd serwera",
    statusCode: 500,
  }), { status: 500 });
}
```

## 8. Rozważania dotyczące wydajności

### 1. Optymalizacja zapytań do bazy danych

**Pojedyncze zapytanie do pobrania oferty:**

```typescript
// Pobieramy tylko potrzebne pola zamiast SELECT *
const { data: offer } = await this.supabase
  .from("offers")
  .select("id, status, end_at, minimum_investment")
  .eq("id", data.offer_id)
  .single();
```

**Używanie .single() zamiast przetwarzania tablic:**

```typescript
// ✅ Dobre - single() zwraca pojedynczy obiekt
.single();

// ❌ Złe - niepotrzebne przetwarzanie tablicy
const results = await query;
const offer = results[0];
```

### 2. Indeksy bazy danych

Wymagane indeksy dla optymalnej wydajności:

```sql
-- Indeks na offer_id dla szybkiego wyszukiwania oferty
CREATE INDEX IF NOT EXISTS idx_offers_id ON offers(id);

-- Indeks na status dla filtrowania aktywnych ofert
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- Indeks na user_id dla szybkiego pobierania inwestycji użytkownika
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);

-- Indeks na offer_id dla szybkiego pobierania inwestycji w ofertę
CREATE INDEX IF NOT EXISTS idx_investments_offer_id ON investments(offer_id);

-- Złożony indeks na (user_id, offer_id) dla sprawdzania duplikatów
CREATE INDEX IF NOT EXISTS idx_investments_user_offer
ON investments(user_id, offer_id);
```

### 3. Potencjalne wąskie gardła

**Problem:** N+1 queries (nie dotyczy tego endpointa, ale może pojawić się w GET /api/investments)

**Problem:** Duplikaty inwestycji - czy użytkownik może inwestować wielokrotnie w tę samą ofertę?

- **Rozwiązanie:** Jeśli biznesowo nie jest to dozwolone, dodać UNIQUE constraint: `UNIQUE(user_id, offer_id)`
- **Rozwiązanie:** Jeśli jest dozwolone, nie ma problemu

**Problem:** Race condition - przekroczenie target_amount

- **Rozwiązanie MVP:** Nie obsługujemy na tym etapie
- **Rozwiązanie przyszłościowe:**

  ```typescript
  // Sprawdzenie sumy inwestycji przed utworzeniem nowej
  const { data: sumResult } = await this.supabase
    .rpc("get_total_investments", { p_offer_id: offer_id });

  if (sumResult.total + amount > offer.target_amount) {
    throw new Error("Przekroczono maksymalną kwotę inwestycji dla tej oferty");
  }
  ```

### 4. Caching

Na tym etapie MVP nie implementujemy cachingu, ale w przyszłości można rozważyć:

- Cachowanie szczegółów oferty (Redis, in-memory cache)
- Cache invalidation po zmianie statusu oferty
- TTL (Time To Live) dla cache: 5 minut

### 5. Monitoring wydajności

Metryki do śledzenia:

- Średni czas odpowiedzi endpointa (target: < 500ms)
- Liczba błędów 500 (target: < 0.1%)
- Liczba błędów 400 (target: monitoring dla wykrywania ataków)
- Liczba utworzonych inwestycji na godzinę

## 9. Etapy wdrożenia

### Krok 1: Utworzenie validatora Zod

**Plik:** `src/lib/validators/investments.validator.ts`

**Zadania:**

1. Zaimportować Zod
2. Zdefiniować `createInvestmentSchema` z polami:
   - `offer_id` (string, uuid)
   - `amount` (number, positive, max 100M)
3. Wyeksportować typ `CreateInvestmentInput`

**Zależności:** Brak

**Testy:** Utworzyć `investments.validator.test.ts` z testami:

- Walidacja poprawnych danych
- Walidacja nieprawidłowych UUID
- Walidacja ujemnych kwot
- Walidacja zbyt dużych kwot

### Krok 2: Utworzenie serwisu InvestmentsService

**Plik:** `src/lib/services/investments.service.ts`

**Zadania:**

1. Utworzyć klasę `InvestmentsService`
2. Dodać konstruktor przyjmujący `SupabaseClient`
3. Zaimplementować metodę `createInvestment()`:
   - Pobranie oferty z bazy
   - Walidacja biznesowa (status, data, minimum)
   - Konwersja kwoty na centy
   - Utworzenie rekordu inwestycji
   - Konwersja kwoty na PLN przed zwróceniem
4. Dodać metody pomocnicze:
   - `convertToSatoshi(amount: number): number`
   - `convertFromSatoshi(satoshi: number): number`
   - `formatCurrency(amount: number): string` (opcjonalnie)

**Zależności:** Krok 1 (validator)

**Testy:** Utworzyć `investments.service.test.ts` z testami:

- Mockowanie Supabase client
- Test pomyślnego utworzenia inwestycji
- Test błędu gdy oferta nie istnieje
- Test błędu gdy oferta nieaktywna
- Test błędu gdy oferta wygasła
- Test błędu gdy kwota poniżej minimum
- Test konwersji kwot (PLN ↔ centy)

### Krok 3: Utworzenie API route

**Plik:** `src/pages/api/investments/index.ts`

**Zadania:**

1. Ustawić `export const prerender = false`
2. Zaimportować potrzebne typy i serwis
3. Zaimplementować handler `POST`:
   - Sprawdzenie autoryzacji (`locals.user`)
   - Sprawdzenie uprawnień (SIGNER lub ADMIN)
   - Parsowanie request body
   - Walidacja Zod schema
   - Wywołanie `InvestmentsService.createInvestment()`
   - Zwrócenie odpowiedzi 201 Created
4. Obsługa błędów:
   - 401 dla niezalogowanych
   - 403 dla nieuprawnionych
   - 400 dla błędów walidacji
   - 404 dla nieistniejącej oferty
   - 400 dla błędów biznesowych
   - 500 dla błędów serwera

**Zależności:** Krok 1 (validator), Krok 2 (service)

**Testy:** Utworzyć `tests/integration/api-investments-create.test.ts`:

- Test pomyślnego utworzenia inwestycji
- Test błędu 401 (niezalogowany)
- Test błędu 403 (brak uprawnień)
- Test błędu 400 (nieprawidłowy JSON)
- Test błędu 400 (błąd walidacji Zod)
- Test błędu 404 (oferta nie istnieje)
- Test błędu 400 (oferta nieaktywna)
- Test błędu 400 (oferta wygasła)
- Test błędu 400 (kwota poniżej minimum)

### Krok 4: Migracja bazy danych (jeśli potrzebna)

**Plik:** `supabase/migrations/YYYYMMDDHHMMSS_add_investments_indexes.sql`

**Zadania:**

1. Utworzyć migrację z indeksami:

   ```sql
   -- Indeksy dla tabeli investments
   create index if not exists idx_investments_user_id
   on investments(user_id);

   create index if not exists idx_investments_offer_id
   on investments(offer_id);

   create index if not exists idx_investments_user_offer
   on investments(user_id, offer_id);

   -- Komentarze
   comment on index idx_investments_user_id is
   'Index for fast lookup of investments by user';

   comment on index idx_investments_offer_id is
   'Index for fast lookup of investments by offer';

   comment on index idx_investments_user_offer is
   'Composite index for checking user investment in specific offer';
   ```

2. (Opcjonalnie) Dodać UNIQUE constraint jeśli użytkownik nie może inwestować wielokrotnie:

   ```sql
   alter table investments
   add constraint unique_user_offer_investment
   unique (user_id, offer_id);
   ```

**Zależności:** Brak

**Testy:**

- Uruchomić `supabase db reset` lokalnie
- Zweryfikować że indeksy zostały utworzone:

  ```sql
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'investments';
  ```

### Krok 5: Weryfikacja RLS policies

**Plik:** `supabase/migrations/*_create_investments_table.sql` (istniejąca migracja)

**Zadania:**

1. Sprawdzić czy istnieją prawidłowe RLS policies dla tabeli `investments`:
   - **INSERT policy:** Użytkownik może tworzyć inwestycje tylko dla siebie

     ```sql
     create policy "Users can create investments for themselves"
     on investments for insert
     with check (auth.uid() = user_id);
     ```

   - **SELECT policy:** Użytkownik może czytać własne inwestycje, admin wszystkie

     ```sql
     create policy "Users can view their own investments"
     on investments for select
     using (auth.uid() = user_id);

     create policy "Admins can view all investments"
     on investments for select
     using (
       auth.jwt() ->> 'role' = 'admin'
     );
     ```

2. Jeśli policies nie istnieją, utworzyć nową migrację

**Zależności:** Brak

**Testy:**

- Test w Supabase client - próba utworzenia inwestycji dla innego użytkownika (powinno się nie udać)
- Test w Supabase client - próba odczytu inwestycji innego użytkownika jako SIGNER (powinno się nie udać)
- Test w Supabase client - próba odczytu inwestycji innego użytkownika jako ADMIN (powinno się udać)

### Krok 6: Testy integracyjne

**Plik:** `tests/integration/api-investments-create.test.ts`

**Zadania:**

1. Użyć Vitest + MSW do mockowania Supabase
2. Utworzyć test suite z następującymi przypadkami:
   - Pomyślne utworzenie inwestycji (201)
   - Użytkownik niezalogowany (401)
   - Użytkownik bez uprawnień (403)
   - Nieprawidłowy JSON (400)
   - Błąd walidacji Zod (400)
   - Oferta nie istnieje (404)
   - Oferta nieaktywna (400)
   - Oferta wygasła (400)
   - Kwota poniżej minimum (400)
   - Błąd serwera (500)

3. Mockować `locals.user` i `locals.supabase`

**Zależności:** Krok 3 (API route)

**Uruchomienie:** `npm run test`

### Krok 7: Testy End-to-End (Playwright)

**Plik:** `tests/e2e/investments-flow.spec.ts`

**Zadania:**

1. Utworzyć test E2E dla pełnego przepływu:
   - Logowanie jako SIGNER
   - Przejście do listy ofert
   - Wybranie aktywnej oferty
   - Kliknięcie "Inwestuj"
   - Wypełnienie formularza z kwotą
   - Wysłanie formularza
   - Weryfikacja komunikatu sukcesu
   - Weryfikacja że inwestycja pojawia się na liście użytkownika

2. Utworzyć test negatywny:
   - Wypełnienie formularza z kwotą poniżej minimum
   - Weryfikacja komunikatu błędu

**Zależności:** Krok 3 (API route), implementacja frontendu

**Uruchomienie:** `npm run test:e2e`

### Krok 8: Dokumentacja API

**Plik:** `.ai/api-plan.md` (aktualizacja istniejącego pliku)

**Zadania:**

1. Dodać dokumentację endpointa POST /api/investments:
   - URL i metoda
   - Request body
   - Response bodies (sukces i błędy)
   - Kody statusu
   - Przykłady

**Zależności:** Krok 3 (API route)

### Krok 9: Code review i refactoring

**Zadania:**

1. Przegląd kodu pod kątem:
   - Zgodności ze standardami projektu
   - Kompletności obsługi błędów
   - Jakości komunikatów błędów
   - Konsystencji z innymi endpointami
   - Bezpieczeństwa (authorization, validation)

2. Refactoring jeśli potrzebny:
   - Wydzielenie wspólnej logiki (np. formatowanie kwot)
   - Usunięcie duplikacji kodu
   - Poprawa czytelności

**Zależności:** Wszystkie poprzednie kroki

### Krok 10: Deployment i monitoring

**Zadania:**

1. Merge do głównej gałęzi
2. Uruchomienie pipeline CI/CD (Github Actions)
3. Deployment na środowisko staging
4. Smoke tests na staging
5. Deployment na produkcję
6. Monitoring:
   - Sprawdzenie logów błędów
   - Sprawdzenie metryk wydajności
   - Sprawdzenie czy endpoint odpowiada prawidłowo

**Zależności:** Wszystkie poprzednie kroki

## 10. Checklisty i pomocne komendy

### Checklist przed wdrożeniem

- [ ] Utworzono validator Zod z testami
- [ ] Utworzono serwis InvestmentsService z testami
- [ ] Utworzono API route z obsługą błędów
- [ ] Utworzono migrację z indeksami (jeśli potrzebna)
- [ ] Zweryfikowano RLS policies
- [ ] Napisano testy integracyjne (Vitest)
- [ ] Napisano testy E2E (Playwright)
- [ ] Zaktualizowano dokumentację API
- [ ] Przeprowadzono code review
- [ ] Wszystkie testy przechodzą (unit + integration + e2e)
- [ ] Endpoint działa lokalnie z prawdziwym Supabase

### Pomocne komendy

```bash
# Uruchomienie środowiska lokalnego
npm run dev
supabase start

# Uruchomienie testów
npm run test                  # Unit + integration tests
npm run test:watch           # Tests w trybie watch
npm run test:coverage        # Raport coverage
npm run test:e2e            # End-to-end tests
npm run test:e2e:ui         # E2E z Playwright UI

# Zarządzanie bazą danych
supabase db reset                                              # Reset bazy z migracjami
supabase gen types typescript --local > src/db/database.types.ts  # Regeneracja typów

# Code quality
npm run lint                 # ESLint
npm run lint:fix            # Auto-fix ESLint issues
npm run format              # Prettier

# Build
npm run build               # Production build
npm run preview             # Preview production build
```

## 11. Potencjalne rozszerzenia (przyszłość)

Funkcjonalności, które można dodać w przyszłości:

1. **Walidacja sumy inwestycji:**
   - Sprawdzenie czy suma wszystkich inwestycji nie przekracza `target_amount`
   - Funkcja PostgreSQL `get_total_investments(offer_id)`

2. **Rate limiting:**
   - Limit 10 requestów na minutę na użytkownika
   - Implementacja przez middleware

3. **Notyfikacje:**
   - Wysyłanie notyfikacji do admina o nowej inwestycji
   - Integracja z tabelą `notifications`

4. **Webhooks:**
   - Wywołanie webhook po utworzeniu inwestycji
   - Integracja z zewnętrznymi systemami

5. **Optymistic locking:**
   - Dodanie pola `version` do tabeli `investments`
   - Zapobieganie race conditions

6. **Audit log:**
   - Logowanie wszystkich zmian w inwestycjach
   - Tabela `investment_history`

7. **Duplikaty:**
   - Sprawdzanie czy użytkownik już inwestował w daną ofertę
   - UNIQUE constraint lub walidacja w serwisie

8. **Limity:**
   - Maksymalna kwota inwestycji na użytkownika
   - Maksymalna liczba inwestycji na użytkownika

## 12. Podsumowanie

Endpoint POST /api/investments to kluczowy element funkcjonalności systemu, umożliwiający użytkownikom składanie deklaracji inwestycji. Plan implementacji obejmuje:

- **Walidację wielopoziomową:** strukturalną (Zod) i biznesową (serwis)
- **Bezpieczeństwo:** autoryzację, uwierzytelnianie, zapobieganie SQL injection
- **Wydajność:** indeksy bazy danych, optymalizację zapytań
- **Testowalność:** unit tests, integration tests, E2E tests
- **Obsługę błędów:** szczegółowe kody statusu i komunikaty
- **Zgodność z architekturą:** pattern zgodny z innymi endpointami (offers)

Kluczowe aspekty:

- Użytkownik może składać inwestycje tylko dla siebie (user_id z sesji)
- Kwoty są przechowywane w centach (×100) w bazie, ale API przyjmuje i zwraca PLN
- Nowa inwestycja zawsze ma status "pending"
- Walidacja biznesowa sprawdza czy oferta jest aktywna i nie wygasła
- Endpoint zwraca 201 Created w przypadku sukcesu
