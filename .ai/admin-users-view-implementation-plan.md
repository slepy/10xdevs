# Plan implementacji widoku Listy Użytkowników (Admin)

## 1. Przegląd

Widok listy użytkowników to sekcja panelu administracyjnego umożliwiająca administratorowi przeglądanie wszystkich zarejestrowanych użytkowników aplikacji BlindInvest. Widok prezentuje podstawowe informacje o użytkownikach w formie przejrzystej tabeli. W ramach MVP funkcjonalność jest ograniczona wyłącznie do przeglądania - brak możliwości edycji czy usuwania użytkowników. Widok wymaga uprawnień administratora i jest dostępny jako jedna z sekcji w panelu administracyjnym.

## 2. Routing widoku

- **Ścieżka:** `/admin/users`
- **Dostęp:** Wyłącznie dla użytkowników z rolą `admin`
- **Layout:** `AdminLayout.astro` (wspólny layout dla wszystkich podstron panelu administracyjnego)
- **Przekierowania:**
  - Użytkownicy niezalogowani → `/login?redirect=/admin/users`
  - Użytkownicy z rolą `signer` → strona błędu 403 (Brak uprawnień)

## 3. Struktura komponentów

```
AdminUsersPage (src/pages/admin/users/index.astro)
├── AdminLayout (src/layouts/AdminLayout.astro)
│   ├── Header (nawigacja główna)
│   ├── AdminSidebar (submenu panelu admin)
│   └── Content Area
│       └── UsersListSection
│           ├── PageHeader
│           │   └── Title ("Użytkownicy")
│           ├── UsersTable (React component - src/components/admin/UsersTable.tsx)
│           │   ├── Table (shadcn/ui)
│           │   │   ├── TableHeader
│           │   │   │   └── TableRow
│           │   │   │       ├── TableHead (Email)
│           │   │   │       ├── TableHead (Imię)
│           │   │   │       ├── TableHead (Nazwisko)
│           │   │   │       ├── TableHead (Rola)
│           │   │   │       └── TableHead (Data rejestracji)
│           │   │   └── TableBody
│           │   │       └── TableRow (dla każdego użytkownika)
│           │   │           ├── TableCell (email)
│           │   │           ├── TableCell (firstName)
│           │   │           ├── TableCell (lastName)
│           │   │           ├── TableCell (role badge)
│           │   │           └── TableCell (created_at formatted)
│           │   └── EmptyState (gdy brak użytkowników)
│           ├── Pagination (shadcn/ui - opcjonalne, jeśli lista > 50 użytkowników)
│           └── LoadingSpinner (podczas ładowania danych)
└── ErrorAlert (w przypadku błędu pobierania danych)
```

## 4. Szczegóły komponentów

### AdminUsersPage (index.astro)

- **Opis:** Główna strona Astro renderująca widok listy użytkowników. Odpowiada za SSR, weryfikację autoryzacji, pobranie danych z API i przekazanie ich do komponentu React.
- **Główne elementy:**
  - Weryfikacja `locals.user` i `locals.user.role === 'admin'`
  - Wywołanie `GET /api/users` po stronie serwera
  - Renderowanie `AdminLayout` z komponentem `UsersTable` wewnątrz
  - Obsługa błędów (przekierowanie lub wyświetlenie komunikatu)
- **Obsługiwane zdarzenia:** Brak (SSR)
- **Walidacja:** Sprawdzenie czy użytkownik jest zalogowany i posiada rolę `admin`
- **Typy:**
  - `UserDTO[]` - tablica użytkowników pobrana z API
  - `ApiResponse<UserDTO[]>` - odpowiedź API
- **Propsy:** Brak (strona Astro)

### UsersTable (React Component)

- **Opis:** Interaktywny komponent React wyświetlający tabelę użytkowników. Wykorzystuje komponenty Shadcn/ui Table do prezentacji danych w responsywnej, dostępnej formie.
- **Główne elementy:**
  - `<Table>` - główny kontener tabeli
  - `<TableHeader>` z nagłówkami kolumn
  - `<TableBody>` z wierszami użytkowników
  - `<Badge>` (Shadcn/ui) do wyświetlenia roli użytkownika
  - Formatowanie daty za pomocą biblioteki `date-fns` lub natywnego `Intl.DateTimeFormat`
- **Obsługiwane interakcje:**
  - Sortowanie kolumn (opcjonalnie w przyszłości)
  - Paginacja (jeśli liczba użytkowników > 50)
- **Obsługiwana walidacja:**
  - Sprawdzenie czy `users` nie jest pustą tablicą
  - Wyświetlenie EmptyState gdy `users.length === 0`
- **Typy:**
  - `UserDTO[]` - propsy z danymi użytkowników
  - `UsersTableProps` - interfejs propsów komponentu
- **Propsy:**
  ```typescript
  interface UsersTableProps {
    users: UserDTO[];
  }
  ```

### PageHeader

- **Opis:** Prosty komponent nagłówka strony wyświetlający tytuł sekcji.
- **Główne elementy:**
  - `<h1>` z tekstem "Użytkownicy"
  - Opcjonalnie ikona użytkowników z `lucide-react`
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak lub `{ title: string }`

### EmptyState

- **Opis:** Komponent wyświetlany gdy nie ma żadnych użytkowników w bazie (edge case).
- **Główne elementy:**
  - Ikona (np. `UsersIcon` z `lucide-react`)
  - Komunikat "Brak zarejestrowanych użytkowników"
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

### LoadingSpinner

- **Opis:** Komponent wyświetlany podczas ładowania danych (używany przy przyszłej paginacji lub odświeżaniu).
- **Główne elementy:**
  - Spinner z Shadcn/ui lub CSS animation
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:** Brak
- **Propsy:** Brak

### ErrorAlert

- **Opis:** Komponent wyświetlający komunikat błędu w przypadku niepowodzenia pobrania danych.
- **Główne elementy:**
  - `Alert` (Shadcn/ui) z wariantem `destructive`
  - Komunikat błędu z opisem problemu
- **Obsługiwane interakcje:** Możliwość zamknięcia alertu
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `{ message: string }` - props z komunikatem błędu
- **Propsy:**
  ```typescript
  interface ErrorAlertProps {
    message: string;
  }
  ```

### RoleBadge

- **Opis:** Komponent wyświetlający rolę użytkownika w formie kolorowego badge'a.
- **Główne elementy:**
  - `Badge` (Shadcn/ui)
  - Wariant koloru zależny od roli (`admin` - czerwony, `signer` - niebieski)
- **Obsługiwane interakcje:** Brak
- **Obsługiwana walidacja:** Sprawdzenie czy rola to `admin` lub `signer`
- **Typy:**
  - `UserRole` - typ roli użytkownika
- **Propsy:**
  ```typescript
  interface RoleBadgeProps {
    role: UserRole;
  }
  ```

## 5. Typy

### Istniejące typy (z src/types.ts)

```typescript
/**
 * User data structure (from Supabase Auth)
 * Represents minimal user info returned by API
 */
export interface UserDTO {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response for users list endpoint (GET /api/users)
 * Admin-only endpoint
 */
export type UserListResponse = PaginatedResponse<UserDTO>;

/**
 * User role enumeration for authorization
 */
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLES = {
  ADMIN: "admin",
  SIGNER: "signer",
} as const;

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
```

### Nowe typy dla komponentów widoku

```typescript
/**
 * Props dla komponentu UsersTable
 * Przyjmuje tablicę użytkowników do wyświetlenia
 */
export interface UsersTableProps {
  users: UserDTO[];
}

/**
 * Props dla komponentu RoleBadge
 * Wyświetla rolę użytkownika w formie kolorowego badge'a
 */
export interface RoleBadgeProps {
  role: UserRole;
}

/**
 * Props dla komponentu ErrorAlert
 * Wyświetla komunikat błędu
 */
export interface ErrorAlertProps {
  message: string;
}

/**
 * Props dla komponentu PageHeader (opcjonalnie)
 */
export interface PageHeaderProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * ViewModel dla sformatowanych danych użytkownika
 * Używany wewnątrz komponentu UsersTable do wyświetlenia
 */
export interface UserRowViewModel {
  id: string;
  email: string;
  fullName: string; // firstName + lastName lub "—" jeśli brak
  role: UserRole;
  roleBadgeVariant: "default" | "destructive"; // wariant badge'a
  formattedDate: string; // np. "24 paź 2025, 14:30"
}
```

## 6. Zarządzanie stanem

### Stan na poziomie strony Astro (SSR)

Ponieważ dane są pobierane po stronie serwera (SSR), główny stan aplikacji to:

- **users: UserDTO[]** - tablica użytkowników pobrana z API przed renderowaniem
- **error: string | null** - komunikat błędu w przypadku niepowodzenia zapytania API

### Stan w komponentach React

W MVP widok jest statyczny (tylko odczyt), więc nie ma potrzeby zarządzania stanem po stronie klienta. Wszystkie dane są przekazywane jako propsy.

W przyszłości, jeśli zostanie dodana paginacja lub odświeżanie danych, będzie potrzebny custom hook:

```typescript
/**
 * Hook do zarządzania listą użytkowników z paginacją
 * Używany w przypadku rozbudowy widoku o interaktywne funkcje
 */
function useUsersList(initialUsers: UserDTO[]) {
  const [users, setUsers] = useState<UserDTO[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchUsers = async (pageNumber: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users?page=${pageNumber}`);
      const data = await response.json();
      setUsers(data.data);
      setError(null);
    } catch (err) {
      setError("Nie udało się pobrać użytkowników");
    } finally {
      setIsLoading(false);
    }
  };

  return { users, isLoading, error, page, setPage, fetchUsers };
}
```

**Wniosek:** W MVP nie jest wymagany custom hook. Dane są pobierane przez SSR i przekazywane jako propsy do komponentu React.

## 7. Integracja API

### Endpoint

- **Metoda:** GET
- **URL:** `/api/users`
- **Autoryzacja:** Wymagana rola `admin`
- **Query parameters:** Opcjonalnie: `page`, `limit` (w MVP pomijamy, pobieramy wszystkich użytkowników)

### Typ żądania

Brak body (GET request).

Query parameters (opcjonalne w MVP):
```typescript
interface UserListQueryParams {
  page?: number;
  limit?: number;
}
```

### Typ odpowiedzi

```typescript
// Sukces (200 OK)
interface SuccessResponse {
  data: UserDTO[];
  pagination?: PaginationMeta; // Opcjonalnie w MVP
}

// Błąd (403 Forbidden)
interface ForbiddenResponse {
  error: string; // "Forbidden"
  message: string; // "Brak uprawnień administratora"
}

// Błąd (401 Unauthorized)
interface UnauthorizedResponse {
  error: string; // "Unauthorized"
  message: string; // "Użytkownik niezalogowany"
}

// Błąd (500 Internal Server Error)
interface ServerErrorResponse {
  error: string; // "Internal Server Error"
  message: string; // "Wystąpił błąd serwera"
}
```

### Implementacja w Astro

```typescript
// src/pages/admin/users/index.astro
---
import AdminLayout from "@/layouts/AdminLayout.astro";
import UsersTable from "@/components/admin/UsersTable";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { USER_ROLES } from "@/types";
import type { UserDTO, ApiResponse } from "@/types";

// Weryfikacja autoryzacji
if (!Astro.locals.user) {
  return Astro.redirect(`/login?redirect=/admin/users`);
}

if (Astro.locals.user.role !== USER_ROLES.ADMIN) {
  return Astro.redirect("/403");
}

// Pobranie danych z API
let users: UserDTO[] = [];
let error: string | null = null;

try {
  const response = await fetch(`${Astro.url.origin}/api/users`, {
    headers: {
      Cookie: Astro.request.headers.get("Cookie") || "",
    },
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać listy użytkowników");
  }

  const data: ApiResponse<UserDTO[]> = await response.json();
  users = data.data || [];
} catch (err) {
  error = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
}
---

<AdminLayout title="Użytkownicy">
  <div class="container mx-auto py-8">
    <h1 class="text-3xl font-bold mb-6">Użytkownicy</h1>

    {error ? (
      <ErrorAlert message={error} />
    ) : (
      <UsersTable users={users} client:load />
    )}
  </div>
</AdminLayout>
```

## 8. Interakcje użytkownika

### Podstawowe interakcje (MVP)

1. **Wejście na stronę `/admin/users`**
   - System weryfikuje autoryzację
   - Jeśli użytkownik niezalogowany → przekierowanie do `/login?redirect=/admin/users`
   - Jeśli użytkownik to `signer` → przekierowanie do `/403`
   - Jeśli użytkownik to `admin` → pobieranie i wyświetlanie danych

2. **Przeglądanie listy użytkowników**
   - Administrator widzi tabelę z wszystkimi użytkownikami
   - Każdy wiersz zawiera: email, imię, nazwisko, rolę, datę rejestracji
   - Role są wyróżnione kolorowym badge'em

3. **Brak użytkowników**
   - Wyświetlenie EmptyState z komunikatem "Brak zarejestrowanych użytkowników"

4. **Błąd pobierania danych**
   - Wyświetlenie ErrorAlert z opisem błędu
   - Możliwość odświeżenia strony

### Przyszłe interakcje (poza MVP)

- Sortowanie kolumn (kliknięcie na nagłówek kolumny)
- Filtrowanie po roli (dropdown filter)
- Wyszukiwanie po emailu/imieniu (search input)
- Paginacja (przyciski Previous/Next)
- Szczegóły użytkownika (kliknięcie na wiersz)
- Edycja/usuwanie użytkownika (akcje w wierszu)

## 9. Warunki i walidacja

### Warunki dostępu (weryfikowane w index.astro)

1. **Użytkownik musi być zalogowany**
   - Warunek: `Astro.locals.user !== null`
   - Komponent: Middleware Astro (`src/middleware/index.ts`)
   - Akcja przy niepowodzeniu: Przekierowanie do `/login?redirect=/admin/users`

2. **Użytkownik musi mieć rolę admin**
   - Warunek: `Astro.locals.user.role === USER_ROLES.ADMIN`
   - Komponent: `index.astro` (warunek na początku skryptu)
   - Akcja przy niepowodzeniu: Przekierowanie do `/403`

### Warunki wyświetlania (weryfikowane w UsersTable.tsx)

1. **Lista użytkowników nie może być null/undefined**
   - Warunek: `users !== null && users !== undefined`
   - Komponent: `UsersTable`
   - Akcja przy niepowodzeniu: Wyświetlenie EmptyState

2. **Lista użytkowników jest pusta**
   - Warunek: `users.length === 0`
   - Komponent: `UsersTable`
   - Akcja: Wyświetlenie EmptyState z komunikatem

3. **Użytkownik ma kompletne dane**
   - Warunek: Sprawdzenie czy `email`, `role`, `created_at` istnieją
   - Komponent: `UsersTable` (każdy wiersz)
   - Akcja: Wyświetlenie "—" dla brakujących pól opcjonalnych (`firstName`, `lastName`)

### Walidacja danych (weryfikowana w RoleBadge.tsx)

1. **Rola użytkownika jest prawidłowa**
   - Warunek: `role === USER_ROLES.ADMIN || role === USER_ROLES.SIGNER`
   - Komponent: `RoleBadge`
   - Akcja przy niepowodzeniu: Wyświetlenie domyślnego badge'a z tekstem roli

### Formatowanie danych (transformacja w UsersTable)

1. **Data rejestracji**
   - Transformacja: `created_at` (ISO string) → "24 paź 2025, 14:30"
   - Komponent: `UsersTable`
   - Biblioteka: `date-fns` lub `Intl.DateTimeFormat`

2. **Pełne imię**
   - Transformacja: `firstName + " " + lastName` lub "—" jeśli brak
   - Komponent: `UsersTable`
   - Warunek: `if (firstName && lastName) return ${firstName} ${lastName}; else return "—"`

## 10. Obsługa błędów

### 1. Błąd autoryzacji (401 Unauthorized)

- **Przyczyna:** Użytkownik niezalogowany próbuje uzyskać dostęp
- **Obsługa:** Przekierowanie do `/login?redirect=/admin/users` (w middleware lub stronie Astro)
- **Komunikat:** Brak (automatyczne przekierowanie)

### 2. Błąd uprawnień (403 Forbidden)

- **Przyczyna:** Zalogowany użytkownik z rolą `signer` próbuje uzyskać dostęp
- **Obsługa:** Przekierowanie do strony `/403` (Brak uprawnień)
- **Komunikat:** "Nie masz uprawnień do przeglądania tej strony"

### 3. Błąd pobierania danych (500 Internal Server Error)

- **Przyczyna:** Błąd serwera lub bazy danych podczas pobierania użytkowników
- **Obsługa:**
  - Przechwycenie błędu w `try-catch` w stronie Astro
  - Ustawienie zmiennej `error` z komunikatem
  - Wyświetlenie `ErrorAlert` zamiast tabeli
- **Komunikat:** "Nie udało się pobrać listy użytkowników. Spróbuj odświeżyć stronę."

### 4. Błąd sieciowy (Network Error)

- **Przyczyna:** Brak połączenia z API lub timeout
- **Obsługa:** Identyczna jak przy błędzie 500
- **Komunikat:** "Wystąpił problem z połączeniem. Sprawdź połączenie internetowe i spróbuj ponownie."

### 5. Pusta lista użytkowników

- **Przyczyna:** Brak zarejestrowanych użytkowników (edge case)
- **Obsługa:** Wyświetlenie `EmptyState` w komponencie `UsersTable`
- **Komunikat:** "Brak zarejestrowanych użytkowników" (ikona + tekst)

### 6. Brakujące dane użytkownika

- **Przyczyna:** Użytkownik nie uzupełnił imienia/nazwiska
- **Obsługa:** Wyświetlenie "—" w odpowiednich kolumnach tabeli
- **Komunikat:** Brak (wizualne oznaczenie braku danych)

### 7. Nieprawidłowa rola użytkownika

- **Przyczyna:** Dane z API zawierają nieprawidłową wartość roli
- **Obsługa:** `RoleBadge` wyświetla domyślny badge z tekstem roli
- **Komunikat:** Wyświetlenie surowej wartości roli (fallback)

### Struktura obsługi błędów w kodzie

```typescript
// Przykład w index.astro
try {
  const response = await fetch(`${Astro.url.origin}/api/users`, {
    headers: {
      Cookie: Astro.request.headers.get("Cookie") || "",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      return Astro.redirect(`/login?redirect=/admin/users`);
    }
    if (response.status === 403) {
      return Astro.redirect("/403");
    }
    throw new Error("Nie udało się pobrać listy użytkowników");
  }

  const data: ApiResponse<UserDTO[]> = await response.json();

  if (!data.data) {
    throw new Error("Brak danych w odpowiedzi API");
  }

  users = data.data;
} catch (err) {
  console.error("Error fetching users:", err);
  error = err instanceof Error
    ? err.message
    : "Wystąpił nieznany błąd podczas pobierania użytkowników";
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie endpointu API

**Czas:** 30 min

1. Sprawdzenie czy endpoint `/api/users` jest zaimplementowany
2. Weryfikacja że endpoint zwraca `UserDTO[]` zgodnie z typami
3. Testowanie endpoint z narzędziem (Postman/curl) z autoryzacją admin
4. Weryfikacja obsługi błędów (401, 403, 500)

### Krok 2: Utworzenie layoutu AdminLayout (jeśli nie istnieje)

**Czas:** 1h

1. Utworzenie pliku `src/layouts/AdminLayout.astro`
2. Implementacja struktury: Header + Sidebar + Content Area
3. Dodanie submenu w sidebar z linkami:
   - Oferty (`/admin/offers`)
   - Inwestycje (`/admin/investments`)
   - Użytkownicy (`/admin/users`) - aktywny
4. Stylowanie z Tailwind CSS
5. Dodanie responsywności (mobile menu)

### Krok 3: Utworzenie strony Astro dla widoku użytkowników

**Czas:** 45 min

1. Utworzenie pliku `src/pages/admin/users/index.astro`
2. Dodanie `export const prerender = false`
3. Implementacja weryfikacji autoryzacji:
   ```typescript
   if (!Astro.locals.user) {
     return Astro.redirect(`/login?redirect=/admin/users`);
   }
   if (Astro.locals.user.role !== USER_ROLES.ADMIN) {
     return Astro.redirect("/403");
   }
   ```
4. Implementacja pobierania danych z API w `try-catch`
5. Renderowanie `AdminLayout` z warunkiem error/success

### Krok 4: Utworzenie komponentu UsersTable (React)

**Czas:** 1.5h

1. Utworzenie pliku `src/components/admin/UsersTable.tsx`
2. Definicja interfejsu `UsersTableProps`
3. Implementacja komponentu używając Shadcn/ui Table:
   ```tsx
   import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
   ```
4. Mapowanie `users` do wierszy tabeli
5. Dodanie warunku dla pustej listy (EmptyState)
6. Implementacja formatowania danych:
   - Data: użycie `date-fns` lub `Intl.DateTimeFormat`
   - Pełne imię: `firstName + " " + lastName` lub "—"
7. Integracja komponentu `RoleBadge` dla kolumny roli
8. Dodanie stylów Tailwind dla responsywności

### Krok 5: Utworzenie komponentu RoleBadge (React)

**Czas:** 30 min

1. Utworzenie pliku `src/components/admin/RoleBadge.tsx`
2. Definicja interfejsu `RoleBadgeProps`
3. Implementacja komponentu używając Shadcn/ui Badge:
   ```tsx
   import { Badge } from "@/components/ui/badge";
   ```
4. Logika wyboru wariantu:
   - `admin` → `variant="destructive"` (czerwony)
   - `signer` → `variant="default"` (niebieski)
5. Wyświetlenie tekstu roli (`Admin` / `Signer`)

### Krok 6: Utworzenie komponentu EmptyState

**Czas:** 20 min

1. Utworzenie pliku `src/components/admin/EmptyState.tsx`
2. Dodanie ikony `UsersIcon` z `lucide-react`
3. Stylowanie z Tailwind (centrowanie, szary kolor)
4. Komunikat: "Brak zarejestrowanych użytkowników"

### Krok 7: Utworzenie komponentu ErrorAlert

**Czas:** 20 min

1. Utworzenie pliku `src/components/ui/ErrorAlert.tsx`
2. Użycie Shadcn/ui Alert:
   ```tsx
   import { Alert, AlertDescription } from "@/components/ui/alert";
   ```
3. Wariant `destructive`
4. Wyświetlenie propsa `message`
5. Opcjonalnie: przycisk zamknięcia alertu

### Krok 8: Utworzenie komponentu PageHeader (opcjonalnie)

**Czas:** 15 min

1. Utworzenie pliku `src/components/admin/PageHeader.tsx`
2. Przyjęcie propsa `title`
3. Renderowanie `<h1>` z ikoną
4. Stylowanie Tailwind

### Krok 9: Dodanie typów do src/types.ts

**Czas:** 15 min

1. Dodanie interfejsów:
   - `UsersTableProps`
   - `RoleBadgeProps`
   - `ErrorAlertProps`
   - `PageHeaderProps`
   - `UserRowViewModel` (opcjonalnie)
2. Eksport nowych typów

### Krok 10: Integracja i testowanie

**Czas:** 1h

1. Uruchomienie aplikacji (`npm run dev`)
2. Logowanie jako admin
3. Przejście do `/admin/users`
4. Weryfikacja wyświetlania danych:
   - Sprawdzenie czy tabela renderuje się poprawnie
   - Sprawdzenie formatowania dat
   - Sprawdzenie badge'y ról
5. Testowanie przypadków brzegowych:
   - Brak użytkowników (EmptyState)
   - Błąd API (ErrorAlert)
6. Testowanie dostępu:
   - Próba wejścia jako `signer` (przekierowanie do 403)
   - Próba wejścia jako gość (przekierowanie do login)
7. Testowanie responsywności (mobile, tablet, desktop)

### Krok 11: Testy jednostkowe i integracyjne

**Czas:** 2h

1. **Test komponentu UsersTable:**
   - Renderowanie z danymi
   - Renderowanie EmptyState gdy brak użytkowników
   - Formatowanie daty
   - Formatowanie pełnego imienia

2. **Test komponentu RoleBadge:**
   - Wyświetlanie prawidłowego wariantu dla `admin`
   - Wyświetlanie prawidłowego wariantu dla `signer`
   - Fallback dla nieznanej roli

3. **Test integracyjny strony Astro:**
   - Mock fetch API
   - Sprawdzenie przekierowań (unauthorized, forbidden)
   - Sprawdzenie renderowania tabeli z danymi
   - Sprawdzenie wyświetlania błędu

4. **Test dostępności (a11y):**
   - Uruchomienie `@axe-core/react` na UsersTable
   - Sprawdzenie ARIA labels
   - Sprawdzenie kontrastu kolorów
   - Test nawigacji klawiaturą

### Krok 12: Dostosowanie AdminSidebar

**Czas:** 15 min

1. Dodanie linku "Użytkownicy" do sidebar w `AdminLayout.astro`
2. Dodanie ikony `UsersIcon` obok linku
3. Podświetlenie aktywnego linku dla `/admin/users`
4. Weryfikacja że link działa poprawnie

### Krok 13: Dokumentacja i review

**Czas:** 30 min

1. Dodanie komentarzy JSDoc do komponentów
2. Aktualizacja README jeśli potrzebne
3. Code review (self-review)
4. Sprawdzenie zgodności z wytycznymi PRD
5. Weryfikacja wszystkich kryteriów akceptacji US-012

### Krok 14: Optymalizacja i finalizacja

**Czas:** 30 min

1. Optymalizacja bundla (lazy loading komponentów jeśli potrzebne)
2. Dodanie meta tagów dla SEO (w `<head>` AdminLayout)
3. Sprawdzenie wydajności (Lighthouse)
4. Przygotowanie do merge (squash commits, opis PR)

---

**Całkowity szacowany czas implementacji:** 8-10 godzin

**Priorytet:** Średni (MVP - funkcja nice-to-have dla administratora)

**Zależności:**
- Zaimplementowany endpoint `/api/users`
- Istniejący `AdminLayout` lub czas na jego utworzenie
- Zainstalowane biblioteki: `shadcn/ui`, `lucide-react`, `date-fns`
