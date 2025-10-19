# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BlindInvest** is an MVP web application that aggregates investment opportunities from multiple platforms. It enables investors to browse and commit to investments while providing administrators with tools to manage offers, users, and the investment lifecycle.

## Tech Stack

- **Astro 5** - Server-side rendered web framework with hybrid rendering
- **React 19** - For interactive UI components only
- **TypeScript 5** - Static type checking
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Accessible UI component library
- **Supabase** - Backend-as-a-Service (authentication, database, storage)

### Testing Stack

- **Vitest** - Modern, fast test runner with excellent Vite/Astro integration for unit and integration tests
- **React Testing Library** - Testing React components the way users interact with them
- **Playwright** - End-to-end testing framework for real user workflow simulations
- **Mock Service Worker (MSW)** - API mocking at network level for integration tests
- **@axe-core/react** - Accessibility testing integrated with React Testing Library

## Development Commands

### Local Development

```bash
npm install              # Install dependencies
npm run dev             # Start dev server on port 3001
npm run build           # Build for production
npm run preview         # Preview production build
```

### Code Quality

```bash
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
```

### Testing

```bash
npm run test            # Run unit and integration tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run test:e2e        # Run end-to-end tests
npm run test:e2e:ui     # Run E2E tests with Playwright UI
```

### Docker Development

```bash
docker-compose up dev   # Run development server in Docker
docker-compose up prod  # Run production build in Docker
```

### Supabase

```bash
supabase start          # Start local Supabase instance
supabase stop           # Stop local Supabase instance
supabase db reset       # Reset database with migrations
supabase gen types typescript --local > src/db/database.types.ts  # Generate types
```

## Project Architecture

### Directory Structure

- `src/pages/` - Astro pages (SSR routes)
- `src/pages/api/` - API endpoints (server-only)
- `src/layouts/` - Astro layout components
- `src/components/` - Static Astro components and dynamic React components
- `src/components/ui/` - Shadcn/ui components
- `src/middleware/index.ts` - Astro middleware (auth, Supabase client injection)
- `src/db/` - Supabase client and generated database types
- `src/lib/services/` - Business logic services
- `src/lib/validators/` - Zod validation schemas
- `src/types.ts` - Shared types (DTOs, entities, API responses)
- `supabase/migrations/` - Database migration files

### Key Architectural Patterns

#### 1. Supabase Integration

- **Middleware** (`src/middleware/index.ts`) creates a server-side Supabase client with cookie support using `@supabase/ssr`
- The client is injected into `context.locals.supabase` for all routes
- User authentication data is extracted and stored in `context.locals.user`
- **Never** import `supabaseClient` directly in API routes - always use `locals.supabase`
- Use `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

#### 2. API Endpoint Pattern

All API endpoints in `src/pages/api/` follow this structure:

1. Set `export const prerender = false`
2. Check authorization (`locals.user`)
3. Verify permissions (e.g., admin-only endpoints)
4. Parse request body
5. Validate input with Zod schemas
6. Execute business logic via service classes
7. Return standardized `ApiResponse<T>` format
8. Handle errors with proper HTTP status codes

Example:

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Authorization check
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // 2. Permission check
  if (locals.user.role !== USER_ROLES.ADMIN) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // 3-4. Parse and validate
  const data = await request.json();
  const result = schema.safeParse(data);

  // 5-6. Business logic
  const service = new Service(locals.supabase);
  const result = await service.method(result.data);

  // 7. Success response
  return new Response(JSON.stringify({ data: result }), { status: 200 });
};
```

#### 3. Service Layer Pattern

- Services are classes in `src/lib/services/`
- Each service receives `SupabaseClient` in constructor
- Services encapsulate all business logic and database queries
- Services are instantiated per-request in API routes

#### 4. Type System

- Database types auto-generated from Supabase schema in `src/db/database.types.ts`
- DTOs defined in `src/types.ts` using database types as base
- `CreateDTO` = `Omit<TablesInsert, "id" | "created_at" | "updated_at">`
- `UpdateDTO` = `Partial<TablesUpdate>` (excluding system fields)
- All API responses use `ApiResponse<T>` wrapper

#### 5. Component Strategy

- Use **Astro components** (`.astro`) for static content and layouts
- Use **React components** (`.tsx`) only when interactivity is needed
- Never use Next.js directives like `"use client"`
- React components should use functional components with hooks
- Custom hooks go in `src/components/hooks/`

#### 6. Validation

- All API input validation uses Zod schemas from `src/lib/validators/`
- Validators are colocated by feature (e.g., `auth.validator.ts`, `offers.validator.ts`)
- Use `schema.safeParse()` for validation with proper error handling

### Database Migrations

Migration files in `supabase/migrations/` follow strict naming: `YYYYMMDDHHmmss_description.sql`

Required patterns:

- All SQL in lowercase
- Header comment explaining purpose
- Enable Row Level Security (RLS) on all tables
- Granular RLS policies per operation (select, insert, update, delete) and role (anon, authenticated)
- Comprehensive comments on destructive operations
- Comments explaining each policy's rationale

### Environment Variables

Required in `.env`:

```
SUPABASE_URL=
SUPABASE_KEY=
OPENROUTER_API_KEY=
```

Environment variables accessed via `import.meta.env` (typed in `src/env.d.ts`)

## Testing Strategy

### Unit Tests

**Purpose:** Test isolated functions, validators, and services

**Location:** Colocated with source files (e.g., `auth.service.test.ts` next to `auth.service.ts`)

**Key areas to test:**

1. **Zod Validators** (`src/lib/validators/*.ts`)
   - Test all validation schemas with valid and invalid inputs
   - Verify error messages for failed validations
   - Test edge cases (empty strings, special characters, boundary values)

2. **Services** (`src/lib/services/*.ts`)
   - Mock Supabase client using `vi.mock`
   - Test business logic independently of database
   - Verify correct function calls with expected parameters
   - Test error handling scenarios

3. **Utility Functions** (`src/lib/utils.ts`)
   - Test pure functions with various inputs
   - Verify expected outputs for all cases

4. **React Components** (`src/components/**/*.tsx`)
   - Test rendering with different props
   - Simulate user interactions (clicks, typing)
   - Verify state changes and callbacks

**Example test structure:**

```typescript
import { describe, it, expect, vi } from "vitest";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  it("should call signInWithPassword with correct data", async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {} } }),
      },
    };

    const service = new AuthService(mockSupabase);
    await service.login({ email: "test@example.com", password: "pass" });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "pass",
    });
  });
});
```

### Integration Tests

**Purpose:** Test interaction between multiple modules

**Tools:** Vitest + React Testing Library + MSW

**Key scenarios:**

1. **Form → Service → API (mocked)**
   - Render form component
   - Mock API endpoints with MSW
   - Simulate user filling and submitting form
   - Verify API calls and UI feedback

2. **Service → Supabase Client (mocked)**
   - Mock entire Supabase module
   - Test service methods with mocked responses
   - Verify data transformation and error handling

**Example with MSW:**

```typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.post("/api/auth/register", () => {
    return HttpResponse.json({ data: { user: { id: "1" } } });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### End-to-End Tests

**Purpose:** Test complete user workflows in real browser environment

**Tool:** Playwright

**Location:** `tests/e2e/` directory

**Critical user journeys:**

1. **Authentication Flow**
   - Register → Login → Logout
   - Verify redirects and session persistence

2. **Investment Flow (Signer)**
   - Browse offers → View details → Submit investment → Check status

3. **Admin Management Flow**
   - Create offer → Review investments → Update status

**Example Playwright test:**

```typescript
import { test, expect } from "@playwright/test";

test("user can register and login", async ({ page }) => {
  await page.goto("/register");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "ValidPass123");
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL("/");
  await expect(page.locator("text=Welcome")).toBeVisible();
});
```

### API Tests

**Purpose:** Directly test API endpoints

**Approach:** Use Vitest with HTTP client to test `/api/*` routes

**Test coverage:**

- Authorization checks (401 for unauthenticated, 403 for forbidden)
- Input validation (400 for invalid data)
- Successful operations (200/201 with correct response structure)
- Error handling (proper status codes and error messages)

### Security Tests

**Critical areas:**

1. **Authorization** - Verify role-based access control
2. **Input Validation** - Test XSS and injection attempts
3. **RLS Policies** - Test Supabase Row Level Security with scripts

### Accessibility Tests

**Tools:** @axe-core/react + Lighthouse + manual testing

**Checklist:**

- Run axe checks in component tests
- Verify keyboard navigation (Tab order, focus management)
- Test with screen readers (VoiceOver, NVDA)
- Check color contrast ratios
- Validate ARIA labels and landmarks

## Code Style Guidelines

### Error Handling

- Handle errors at the beginning of functions
- Use early returns for error conditions
- Place happy path last in function
- Avoid unnecessary `else` statements
- Use guard clauses for preconditions

### Astro-Specific

- Use uppercase HTTP method names (`GET`, `POST`, not `get`, `post`)
- Set `export const prerender = false` for API routes
- Use `Astro.cookies` for cookie management
- Extract API logic to services in `src/lib/services/`

### Tailwind CSS

- Use `@layer` directive to organize styles
- Use arbitrary values with `[]` for one-off designs (e.g., `w-[123px]`)
- Use `dark:` variant for dark mode
- Use responsive variants (`sm:`, `md:`, `lg:`)
- Use state variants (`hover:`, `focus-visible:`, `active:`)

### React Best Practices

- Use functional components with hooks
- Use `React.memo()` for expensive components
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for accessibility IDs
- Consider `useOptimistic` for form optimistic updates
- Use `useTransition` for non-urgent updates

### Accessibility

- Use ARIA landmarks for page regions
- Set `aria-expanded` and `aria-controls` for expandable content
- Use `aria-live` for dynamic updates
- Apply `aria-label` or `aria-labelledby` for elements without visible labels
- Avoid redundant ARIA on semantic HTML

## Shadcn/ui Components

Components are in `src/components/ui/`. Import using `@/` alias:

```tsx
import { Button } from "@/components/ui/button";
```

To add new components:

```bash
npx shadcn@latest add [component-name]
```

Project uses "new-york" style variant with "neutral" base color.

## User Roles & Authorization

Two roles defined in `src/types.ts`:

- `ADMIN` - Full access to manage offers, investments, users
- `SIGNER` - Can browse offers and submit investments

Role stored in `user.user_metadata.role` in Supabase Auth.

## Business Domain

Key entities:

- **Offers** - Investment opportunities (CRUD by admins, read by all)
- **Investments** - User commitments to offers (create by users, manage by admins)
- **Notifications** - System notifications for users
- **Users** - Authentication via Supabase Auth

Statuses:

- Offer: `draft`, `active`, `closed`, `completed`
- Investment: `pending`, `accepted`, `rejected`, `cancelled`, `completed`
