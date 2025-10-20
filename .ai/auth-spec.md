# Specyfikacja Techniczna Systemu Autentykacji - BlindInvest MVP

## 1. Wprowadzenie

Niniejsza specyfikacja opisuje architekturę systemu autentykacji dla aplikacji BlindInvest MVP, który realizuje wymagania US-001 (Rejestracja nowego użytkownika "Signer") oraz US-002 (Logowanie użytkownika) z dokumentu PRD. System wykorzystuje Supabase Auth w połączeniu z Astro 5, React 19, TypeScript 5 oraz middleware do zarządzania sesjami i autoryzacją.

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Struktura Stron i Routingu

#### 2.1.1. Nowe Strony Astro

- **`src/pages/login.astro`** - Strona logowania
  - Server-side rendering z obsługą przekierowań po autoryzacji
  - Walidacja sesji przy dostępie (przekierowanie do `/` jeśli już zalogowany)
  - Obsługa query parametrów `?redirect=` dla powrotu do żądanej strony
  - Integracja z React komponentem `LoginForm`

- **`src/pages/register.astro`** - Strona rejestracji
  - Analogiczna logika jak login.astro
  - Automatyczne zalogowanie po pomyślnej rejestracji
  - Integracja z React komponentem `RegisterForm`

#### 2.1.2. Rozszerzenie Istniejących Stron

- **`src/pages/index.astro`** - Strona główna
  - Dodanie logiki sprawdzania stanu autoryzacji w sekcji `---`
  - Warunkowe wyświetlanie treści dla zalogowanych/niezalogowanych użytkowników
  - Dodanie komponentu nawigacji z przyciskami Login/Register lub User Menu

- **`src/pages/admin/**`\*\* - Strony administracyjne
  - Dodanie middleware protection na poziomie każdej strony admin
  - Sprawdzenie roli `admin` w `Astro.locals.user`
  - Przekierowanie do `/login?redirect=/admin/...` jeśli brak autoryzacji

### 2.2. Komponenty React (Client-Side)

#### 2.2.1. Formularze Autentykacji

- **`src/components/forms/LoginForm.tsx`**

  ```typescript
  interface LoginFormProps {
    redirectTo?: string;
    onSuccess?: (user: UserDTO) => void;
    onError?: (error: string) => void;
  }
  ```

  - Zarządzanie stanem formularza (email, password)
  - Walidacja client-side z Zod schema
  - Integracja z Supabase Auth przez API endpoint `/api/auth/login`
  - Obsługa loading states i błędów
  - Przekierowanie po pomyślnym zalogowaniu

- **`src/components/forms/RegisterForm.tsx`**

  ```typescript
  interface RegisterFormProps {
    redirectTo?: string;
    onSuccess?: (user: UserDTO) => void;
    onError?: (error: string) => void;
  }
  ```

  - Analogiczne funkcjonalności jak LoginForm
  - Dodatkowe pola: firstName, lastName
  - Potwierdzenie hasła z walidacją
  - Automatyczne zalogowanie po rejestracji

#### 2.2.2. Komponenty Nawigacji i UI

- **`src/components/ui/AuthButton.tsx`**

  ```typescript
  interface AuthButtonProps {
    user?: UserDTO | null;
    className?: string;
  }
  ```

  - Wyświetla przycisk "Zaloguj się" lub menu użytkownika
  - Dropdown z opcjami: Profil, Moje Inwestycje, Panel Admin (jeśli admin), Wyloguj
  - Obsługa wylogowywania przez API endpoint

### 2.3. Komponenty Astro (Static)

#### 2.3.1. Layout Components

- **`src/components/Navigation.astro`**

  ```astro
  ---
  interface Props {
    user?: UserDTO | null;
    currentPath?: string;
  }
  ---
  ```

  - Główna nawigacja strony
  - Integracja z AuthButton React component
  - Responsive design z menu mobilnym

- **`src/components/AuthGuard.astro`**

  ```astro
  ---
  interface Props {
    requireAuth?: boolean;
    requireRole?: "admin" | "signer";
    redirectTo?: string;
  }
  ---
  ```

  - Server-side protection dla stron
  - Automatyczne przekierowania
  - Sprawdzanie ról użytkowników

#### 2.3.2. Rozszerzenie Layout.astro

- **`src/layouts/Layout.astro`**
  - Dodanie propsa `user?: UserDTO | null`
  - Przekazanie danych użytkownika do komponentu Navigation
  - Meta tagi dla stron autentykacji
  - Dodanie client-side script do zarządzania tokenami

### 2.4. Walidacja i Komunikaty Błędów

#### 2.4.1. Schema Walidacji

- **`src/lib/validators/auth.validator.ts`**

  ```typescript
  export const loginSchema = z.object({
    email: z.string().email("Nieprawidłowy format e-mail"),
    password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
  });

  export const registerSchema = z
    .object({
      firstName: z.string().min(2, "Imię musi mieć min. 2 znaki"),
      lastName: z.string().min(2, "Nazwisko musi mieć min. 2 znaki"),
      email: z.string().email("Nieprawidłowy format e-mail"),
      password: z
        .string()
        .min(8, "Hasło musi mieć min. 8 znaków")
        .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
        .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Hasła muszą być identyczne",
      path: ["confirmPassword"],
    });
  ```

#### 2.4.2. Obsługa Błędów UI

- **Komunikaty Walidacji**: Wyświetlane pod każdym polem formularza
- **Błędy API**: Toast notifications lub alert component
- **Loading States**: Spinner w przyciskach, disabled forms podczas ładowania
- **Success Messages**: Potwierdzenia działań (rejestracja, reset hasła)

### 2.5. Scenariusze Użytkowania

#### 2.5.1. Rejestracja Nowego Użytkownika

1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz (imię, nazwisko, email, hasło)
3. Client-side walidacja z natychmiastowym feedbackiem
4. Submit do `/api/auth/register`
5. Automatyczne zalogowanie po pomyślnej rejestracji
6. Przekierowanie na stronę główną lub żądaną stronę

#### 2.5.2. Logowanie Użytkownika

1. Użytkownik wchodzi na `/login` (bezpośrednio lub przez przekierowanie)
2. Wypełnia dane logowania
3. Submit do `/api/auth/login`
4. Ustawienie tokenów w localStorage/cookies
5. Przekierowanie na stronę główną lub `?redirect=` parameter

## 3. LOGIKA BACKENDOWA

### 3.1. API Endpoints

#### 3.1.1. Endpoints Autentykacji

- **`POST /api/auth/register`**

  ```typescript
  // Request Body
  interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }

  // Response
  interface RegisterResponse extends ApiResponse {
    data?: {
      user: UserDTO;
      session: {
        access_token: string;
        refresh_token: string;
        expires_at: number;
      };
    };
  }
  ```

  - Walidacja danych wejściowych z `registerSchema`
  - Wywołanie `supabase.auth.signUp()`
  - Ustawienie roli 'signer' w user_metadata
  - Zwracanie tokenu dostępu i danych użytkownika

- **`POST /api/auth/login`**

  ```typescript
  // Request Body
  interface LoginRequest {
    email: string;
    password: string;
  }

  // Response
  interface LoginResponse extends ApiResponse {
    data?: {
      user: UserDTO;
      session: {
        access_token: string;
        refresh_token: string;
        expires_at: number;
      };
    };
  }
  ```

  - Walidacja z `loginSchema`
  - Wywołanie `supabase.auth.signInWithPassword()`
  - Zwracanie session i user data

- **`POST /api/auth/logout`**

  ```typescript
  // Response
  interface LogoutResponse extends ApiResponse {
    message: string;
  }
  ```

  - Wywołanie `supabase.auth.signOut()`
  - Invalidacja tokenu w Supabase
  - Zwracanie potwierdzenia

#### 3.1.2. Endpoints Zarządzania Użytkownikami

- **`GET /api/users/me`**

  ```typescript
  // Response
  interface UserProfileResponse extends ApiResponse {
    data?: UserDTO;
  }
  ```

  - Zwracanie profilu aktualnie zalogowanego użytkownika
  - Wymagana autoryzacja (Bearer token)

- **`PUT /api/users/me`**

  ```typescript
  // Request Body
  interface UpdateUserRequest {
    firstName?: string;
    lastName?: string;
  }

  // Response
  interface UpdateUserResponse extends ApiResponse {
    data?: UserDTO;
  }
  ```

  - Aktualizacja profilu użytkownika
  - Walidacja danych wejściowych

### 3.2. Walidacja Danych

#### 3.2.1. Request Validation Middleware

- **`src/lib/validators/middleware.ts`**

  ```typescript
  export function validateRequest<T>(schema: z.ZodSchema<T>) {
    return (request: Request): T => {
      try {
        const body = await request.json();
        return schema.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError(error.issues);
        }
        throw error;
      }
    };
  }
  ```

#### 3.2.2. Bezpieczeństwo Hasła

- **Minimalna długość**: 8 znaków
- **Wymagane znaki**: Wielka litera, cyfra
- **Hashing**: Zarządzane przez Supabase Auth (bcrypt)
- **Rate Limiting**: Ograniczenie prób logowania przez Supabase

### 3.3. Obsługa Błędów

#### 3.3.1. Error Handler Middleware

- **`src/lib/middleware/errorHandler.ts`**

  ```typescript
  export class AuthError extends Error {
    constructor(
      message: string,
      public statusCode: number = 401,
      public code?: string
    ) {
      super(message);
    }
  }

  export function handleAuthError(error: unknown): Response {
    if (error instanceof AuthError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          statusCode: error.statusCode,
        }),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle Supabase errors
    if (error?.message?.includes("Invalid login credentials")) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy e-mail lub hasło",
          statusCode: 401,
        }),
        { status: 401 }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd serwera",
        statusCode: 500,
      }),
      { status: 500 }
    );
  }
  ```

#### 3.3.2. Specyficzne Błędy Autentykacji

- **Email już istnieje**: `User already registered`
- **Nieprawidłowe dane logowania**: `Invalid login credentials`
- **Token wygasł**: `Token expired`
- **Nieprawidłowy token**: `Invalid token`
- **Zbyt słabe hasło**: Szczegółowa walidacja po stronie klienta

### 3.4. Server-Side Rendering

#### 3.4.1. Middleware Enhancement

- **Rozszerzenie `src/middleware/index.ts`**

  ```typescript
  export const onRequest = defineMiddleware(async (context, next) => {
    context.locals.supabase = supabaseClient;

    // Sprawdź session z cookies (SSR)
    const sessionToken = context.cookies.get("sb-access-token")?.value;

    if (sessionToken) {
      try {
        const {
          data: { user },
          error,
        } = await supabaseClient.auth.getUser(sessionToken);

        if (user && !error) {
          context.locals.user = {
            id: user.id,
            email: user.email || "",
            role: user.user_metadata?.role || "signer",
            firstName: user.user_metadata?.firstName,
            lastName: user.user_metadata?.lastName,
          };
        }
      } catch (error) {
        // Invalid token - clear cookies
        context.cookies.delete("sb-access-token");
        context.cookies.delete("sb-refresh-token");
      }
    }

    return next();
  });
  ```

#### 3.4.2. Protected Route Helper

- **`src/lib/auth/protection.ts`**

  ```typescript
  export function requireAuth(context: APIContext, redirectTo = "/login") {
    if (!context.locals.user) {
      const currentUrl = context.url.pathname + context.url.search;
      return context.redirect(`${redirectTo}?redirect=${encodeURIComponent(currentUrl)}`);
    }
    return context.locals.user;
  }

  export function requireRole(context: APIContext, role: UserRole, redirectTo = "/") {
    const user = requireAuth(context);
    if (user.role !== role) {
      return context.redirect(redirectTo);
    }
    return user;
  }
  ```

## 4. SYSTEM AUTENTYKACJI

### 4.1. Integracja z Supabase Auth

#### 4.1.1. Konfiguracja Supabase Client

- **Enhanced `src/db/supabase.client.ts`**

  ```typescript
  import { createClient } from "@supabase/supabase-js";

  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });

  // Server-side client (admin operations)
  export const supabaseAdmin = createClient<Database>(supabaseUrl, import.meta.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  ```

#### 4.1.2. Auth Service Enhancement

- **Extended `src/lib/services/auth.service.ts`**

  ```typescript
  export class AuthService {
    constructor(
      private supabase: SupabaseClient,
      private isServer = false
    ) {}

    async signUp(credentials: RegisterRequest): Promise<AuthResponseDTO> {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            firstName: credentials.firstName,
            lastName: credentials.lastName,
            role: "signer",
          },
        },
      });

      if (error) throw new AuthError(error.message);
      if (!data.user || !data.session) throw new AuthError("Rejestracja nieudana");

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata?.firstName,
          lastName: data.user.user_metadata?.lastName,
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    }

    async signIn(credentials: LoginRequest): Promise<AuthResponseDTO> {
      const { data, error } = await this.supabase.auth.signInWithPassword(credentials);

      if (error) throw new AuthError("Nieprawidłowy e-mail lub hasło");
      if (!data.user || !data.session) throw new AuthError("Logowanie nieudane");

      return {
        user: {
          id: data.user.id,
          email: data.user.email!,
          firstName: data.user.user_metadata?.firstName,
          lastName: data.user.user_metadata?.lastName,
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    }

    async signOut(): Promise<void> {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw new AuthError(error.message);
    }

    async getCurrentUser(): Promise<UserDTO | null> {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error || !user) return null;

      return {
        id: user.id,
        email: user.email!,
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
      };
    }
  }
  ```

### 4.2. Session Management

#### 4.2.1. Client-Side Session Handling

- **`src/lib/auth/session.ts`**

  ```typescript
  export class SessionManager {
    private static instance: SessionManager;
    private supabase: SupabaseClient;

    constructor() {
      this.supabase = supabaseClient;
      this.setupAuthStateListener();
    }

    private setupAuthStateListener(): void {
      this.supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          this.setTokens(session.access_token, session.refresh_token);
        } else if (event === "SIGNED_OUT") {
          this.clearTokens();
        }
      });
    }

    setTokens(accessToken: string, refreshToken: string): void {
      // Set cookies for SSR
      document.cookie = `sb-access-token=${accessToken}; path=/; secure; samesite=lax`;
      document.cookie = `sb-refresh-token=${refreshToken}; path=/; secure; samesite=lax`;

      // Set localStorage for client-side access
      localStorage.setItem("supabase-token", accessToken);
    }

    clearTokens(): void {
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem("supabase-token");
    }

    getAccessToken(): string | null {
      return localStorage.getItem("supabase-token");
    }

    async refreshSession(): Promise<boolean> {
      const { data, error } = await this.supabase.auth.refreshSession();
      if (data.session) {
        this.setTokens(data.session.access_token, data.session.refresh_token);
        return true;
      }
      return false;
    }
  }
  ```

#### 4.2.2. Server-Side Session Validation

- **Token Validation**: Sprawdzanie JWT tokenów przez middleware
- **Auto-refresh**: Automatyczne odświeżanie tokenów po stronie klienta
- **Cookie Security**: Secure, SameSite, HttpOnly dla production
- **Session Persistence**: Przechowywanie w localStorage + cookies dla SSR

### 4.3. Role-Based Access Control

#### 4.3.1. Role Management

- **`src/lib/auth/roles.ts`**

  ```typescript
  export const USER_ROLES = {
    ADMIN: "admin",
    SIGNER: "signer",
  } as const;

  export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

  export function hasRole(user: UserDTO | null, requiredRole: UserRole): boolean {
    if (!user) return false;
    return user.role === requiredRole;
  }

  export function isAdmin(user: UserDTO | null): boolean {
    return hasRole(user, USER_ROLES.ADMIN);
  }

  export function canAccessAdmin(user: UserDTO | null): boolean {
    return isAdmin(user);
  }

  export function canCreateOffer(user: UserDTO | null): boolean {
    return isAdmin(user);
  }

  export function canInvest(user: UserDTO | null): boolean {
    return user?.role === USER_ROLES.SIGNER || isAdmin(user);
  }
  ```

#### 4.3.2. Route Protection Patterns

```astro
---
// Przykład chronionej strony admin
import { requireRole } from "../lib/auth/protection";

const user = requireRole(Astro, "admin", "/login");
// Jeśli użytkownik nie ma roli admin, zostanie przekierowany
---
```

### 4.4. Security Considerations

#### 4.4.1. Token Security

- **JWT Expiration**: Krótkie czasy wygaśnięcia access tokenów (1h)
- **Refresh Tokens**: Długotrwałe refresh tokeny z rotacją
- **CSRF Protection**: SameSite cookies, CSRF tokens dla wrażliwych operacji
- **XSS Prevention**: Sanityzacja input, Content Security Policy

#### 4.4.2. Password Security

- **Strength Validation**: Client i server-side walidacja siły hasła
- **Rate Limiting**: Ograniczenie prób logowania w Supabase
- **Breach Detection**: Integracja z HaveIBeenPwned (opcjonalnie)

#### 4.4.3. Session Security

- **Secure Cookies**: HTTPS-only w produkcji
- **Session Invalidation**: Wylogowanie ze wszystkich urządzeń
- **Concurrent Sessions**: Limit aktywnych sesji per użytkownik

### 4.5. Error Handling & Logging

#### 4.5.1. Authentication Errors

- **Login Failures**: Logowanie nieudanych prób logowania
- **Token Errors**: Monitoring nieprawidłowych/wygasłych tokenów
- **Registration Errors**: Tracking problemów z rejestracją

#### 4.5.2. User Experience

- **Graceful Degradation**: Fallback do login page przy błędach autoryzacji
- **Progress Indicators**: Loading states podczas operacji auth
- **Clear Messaging**: Zrozumiałe komunikaty błędów dla użytkowników

## 5. IMPLEMENTACJA I DEPLOYMENT

### 5.1. Environment Variables

```bash
# .env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_URL=http://localhost:3001  # for password reset redirects
```

### 5.2. Database Configuration

- **User Metadata**: firstName, lastName, role przechowywane w auth.users.user_metadata
- **RLS Policies**: Row Level Security dla tabel związanych z użytkownikami
- **Triggers**: Auto-generowanie profili użytkowników po rejestracji

### 5.3. Testing Strategy

- **Unit Tests**: Komponenty React, serwisy auth
- **Integration Tests**: API endpoints, auth flows
- **E2E Tests**: Rejestracja, logowanie, reset hasła
- **Security Tests**: Token validation, role enforcement

### 5.4. Monitoring & Analytics

- **Auth Metrics**: Successful/failed logins, registrations
- **Performance**: Auth endpoint response times
- **Security Events**: Suspicious login attempts, token abuse
- **User Analytics**: Registration funnel, login patterns

## 6. PODSUMOWANIE

System autentykacji dla BlindInvest MVP wykorzystuje najlepsze praktyki bezpieczeństwa i UX, integrując Supabase Auth z architekturą Astro + React. Kluczowe cechy:

- **Server-Side Rendering**: Bezpieczna autoryzacja na poziomie serwera
- **Role-Based Access**: Elastyczne zarządzanie uprawnieniami admin/signer
- **Modern UX**: Responsywne formularze z walidacją real-time
- **Security First**: Comprehensive token management, session security
- **Maintainable Code**: Modułowa architektura, TypeScript safety
- **Production Ready**: Error handling, logging, monitoring capabilities

System realizuje w pełni wymagania US-001 i US-002 z PRD, zapewniając solidną podstawę do dalszego rozwoju funkcjonalności aplikacji.

---

_Specyfikacja została przygotowana zgodnie z najlepszymi praktykami bezpieczeństwa i architekturą Astro + React + Supabase._
