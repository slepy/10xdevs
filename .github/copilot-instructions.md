# AI Rules for {{project-name}}

{{project-description}}

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui
- Supabase

### Testing

- Vitest - Unit and integration testing
- React Testing Library - React component testing
- Playwright - End-to-end testing
- Mock Service Worker (MSW) - API mocking
- @axe-core/react - Accessibility testing

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers
- `./src/assets` - static internal assets
- `./public` - public assets

When modifying the directory structure, always update this section.

## Coding practices

### Guidelines for clean code

- Use feedback from linters to improve the code when making changes.
- Prioritize error handling and edge cases.
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.

## Frontend

### General Guidelines

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed

### Guidelines for Styling

#### Tailwind

- Use the @layer directive to organize styles into components, utilities, and base layers
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus-visible:, active:, etc.) for interactive elements

### Guidelines for Accessibility

#### ARIA Best Practices

- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set aria-expanded and aria-controls for expandable content like accordions and dropdowns
- Use aria-live regions with appropriate politeness settings for dynamic content updates
- Implement aria-hidden to hide decorative or duplicative content from screen readers
- Apply aria-label or aria-labelledby for elements without visible text labels
- Use aria-describedby to associate descriptive text with form inputs or complex elements
- Implement aria-current for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements

### Guidelines for Astro

- Leverage View Transitions API for smooth page transitions (use ClientRouter)
- Use content collections with type safety for blog posts, documentation, etc.
- Leverage Server Endpoints for API routes
- Use POST, GET - uppercase format for endpoint handlers
- Use `export const prerender = false` for API routes
- Use zod for input validation in API routes
- Extract logic into services in `src/lib/services`
- Implement middleware for request/response modification
- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use Astro.cookies for server-side cookie management
- Leverage import.meta.env for environment variables

### Guidelines for React

- Use functional components with hooks instead of class components
- Never use "use client" and other Next.js directives as we use React with Astro
- Extract logic into custom hooks in `src/components/hooks`
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

### Backend and Database

- Use Supabase for backend services, including authentication and database interactions.
- Follow Supabase guidelines for security and performance.
- Use Zod schemas to validate data exchanged with the backend.
- Use supabase from context.locals in Astro routes instead of importing supabaseClient directly
- Use SupabaseClient type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`

## Testing Guidelines

### General Testing Principles

- Write tests for all business-critical functionality
- Colocate unit tests with source files (e.g., `auth.service.test.ts` next to `auth.service.ts`)
- Place E2E tests in `tests/e2e/` directory
- Follow the testing pyramid: many unit tests, fewer integration tests, critical E2E tests
- Aim for meaningful test coverage, not just high percentages

### Unit Testing with Vitest

- Use `describe` blocks to group related tests
- Write descriptive test names that explain the expected behavior
- Mock external dependencies (Supabase, APIs) using `vi.mock()`
- Test both success and error scenarios
- Test edge cases and boundary conditions
- Use `beforeEach` and `afterEach` for test setup and cleanup

Example:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("AuthService", () => {
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
      },
    };
  });

  it("should successfully login with valid credentials", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "1" } },
    });

    const service = new AuthService(mockSupabase);
    const result = await service.login({ email: "test@example.com", password: "pass" });

    expect(result.user.id).toBe("1");
  });
});
```

### Component Testing with React Testing Library

- Test components from the user's perspective
- Use `render` from React Testing Library to render components
- Query elements using accessible queries (getByRole, getByLabelText)
- Simulate user interactions with `userEvent` or `fireEvent`
- Test accessibility with `@axe-core/react`
- Avoid testing implementation details

Example:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

it('should submit form with user input', async () => {
  const handleSubmit = vi.fn();
  render(<LoginForm onSubmit={handleSubmit} />);

  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /login/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

### Integration Testing with MSW

- Use Mock Service Worker to mock API endpoints at the network level
- Create handlers for API routes that match your application's endpoints
- Test the interaction between components and API calls
- Verify loading states, success states, and error handling

Example:

```typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.post("/api/auth/login", () => {
    return HttpResponse.json({ data: { user: { id: "1" } } });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### E2E Testing with Playwright

- Test critical user journeys end-to-end
- Use Page Object Model pattern for complex flows
- Wait for elements using Playwright's auto-waiting features
- Test across different browsers when necessary
- Use `test.beforeEach` for common setup (navigation, authentication)
- Use data-testid attributes sparingly, prefer accessible selectors

Example:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("user can register and login", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "ValidPass123");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Welcome")).toBeVisible();
  });
});
```

### API Testing

- Test API endpoints directly with Vitest
- Verify authorization checks (401 for unauthenticated, 403 for forbidden)
- Test input validation (400 for invalid data)
- Test successful operations with correct response structure
- Test error handling and proper status codes

### Testing Zod Validators

- Test all validation schemas with valid inputs
- Test with invalid inputs and verify error messages
- Test edge cases (empty strings, special characters, boundary values)
- Test optional vs required fields

Example:

```typescript
import { describe, it, expect } from "vitest";
import { loginSchema } from "./auth.validator";

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "ValidPass123",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "ValidPass123",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["email"]);
  });
});
```

### Accessibility Testing

- Run axe checks in component tests using `@axe-core/react`
- Test keyboard navigation (Tab order, Enter/Space for actions)
- Verify ARIA attributes are correct
- Test with reduced motion preferences
- Ensure proper focus management

Example:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```
