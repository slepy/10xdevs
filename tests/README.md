# Testing Guide

This document provides comprehensive guidance for testing the BlindInvest application.

## Table of Contents

- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [E2E Tests](#e2e-tests)
- [Best Practices](#best-practices)

## Testing Stack

- **Vitest** - Modern test runner with excellent Vite/Astro integration
- **React Testing Library** - Testing React components the way users interact with them
- **Playwright** - End-to-end testing framework for real user workflows
- **MSW (Mock Service Worker)** - API mocking at network level
- **@axe-core/react** - Accessibility testing

## Running Tests

### Unit and Integration Tests (Vitest)

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI interface
npm run test:ui
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

## Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── helpers/                    # Test utilities and helpers
│   ├── msw.ts                 # MSW server configuration and handlers
│   ├── supabase.ts            # Supabase mock helpers
│   └── render.tsx             # Custom render function
├── integration/               # Integration tests
│   └── api-auth.test.ts      # API integration tests
└── e2e/                       # End-to-end tests
    └── auth.spec.ts          # E2E authentication tests

src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx    # Component unit tests
├── lib/
│   ├── services/
│   │   └── auth.service.test.ts  # Service unit tests
│   └── validators/
│       └── auth.validator.test.ts # Validator unit tests
```

## Unit Tests

Unit tests focus on testing isolated functions, components, and services.

### Testing Validators

Location: `src/lib/validators/*.test.ts`

Example:

```typescript
import { describe, it, expect } from "vitest";
import { loginSchema } from "./auth.validator";

describe("loginSchema", () => {
  it("should validate correct login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});
```

### Testing Services

Location: `src/lib/services/*.test.ts`

Services should be tested with mocked Supabase client:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../../../tests/helpers/supabase";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let mockSupabase;
  let authService;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    authService = new AuthService(mockSupabase);
  });

  it("should login user with valid credentials", async () => {
    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: "1", email: "test@example.com" } },
      error: null,
    });

    const result = await authService.login("test@example.com", "password");
    expect(result.user.email).toBe("test@example.com");
  });
});
```

### Testing React Components

Location: `src/components/**/*.test.tsx`

Use React Testing Library to test components:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('should handle onClick event', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Integration Tests

Integration tests verify interaction between multiple modules using MSW for API mocking.

Location: `tests/integration/*.test.ts`

Example:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { setupMswServer, handlers, server } from "../helpers/msw";

setupMswServer();

describe("API Integration - Auth", () => {
  beforeEach(() => {
    server.use(handlers.auth.login());
  });

  it("should login successfully", async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.user).toBeDefined();
  });
});
```

## E2E Tests

E2E tests simulate real user workflows in a browser environment.

Location: `tests/e2e/*.spec.ts`

Example:

```typescript
import { test, expect } from "@playwright/test";

test("user can register and login", async ({ page }) => {
  // Register
  await page.goto("/register");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "ValidPass123");
  await page.fill('input[name="fullName"]', "Test User");
  await page.click('button[type="submit"]');

  // Verify success
  await expect(page).toHaveURL(/\//);
  await expect(page.locator("text=Welcome")).toBeVisible();
});
```

### Playwright Configuration

The Playwright configuration ([playwright.config.ts](../playwright.config.ts)) includes:

- **Base URL**: `http://localhost:3001`
- **Web Server**: Automatically starts dev server before tests
- **Retries**: 2 retries in CI, 0 in local development
- **Screenshots**: Captured on failure
- **Trace**: Captured on first retry

## Best Practices

### General

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One Assertion Per Test**: Focus on testing one behavior per test
3. **Descriptive Test Names**: Use clear, descriptive test names (e.g., "should reject invalid email")
4. **Independent Tests**: Tests should not depend on each other
5. **Clean Up**: Use `beforeEach` and `afterEach` for setup/teardown

### Unit Tests

1. **Mock External Dependencies**: Mock Supabase, external APIs, etc.
2. **Test Edge Cases**: Include tests for boundary conditions and error scenarios
3. **Validate Error Messages**: Check specific error messages from validators
4. **Test All Code Paths**: Ensure complete code coverage

### Integration Tests

1. **Use MSW**: Mock API calls at network level for realistic testing
2. **Test Happy Path**: Verify successful workflows
3. **Test Error Scenarios**: Test authentication failures, validation errors, etc.
4. **Reset Handlers**: Use `server.resetHandlers()` in `afterEach`

### E2E Tests

1. **Test Critical User Journeys**: Focus on important workflows
2. **Use Page Object Model**: Organize tests with reusable page objects (optional)
3. **Wait for Elements**: Use `await expect(...).toBeVisible()` instead of arbitrary delays
4. **Test Accessibility**: Include keyboard navigation tests
5. **Skip Incomplete Features**: Use `test.skip()` for unimplemented features

### React Component Tests

1. **Test User Interactions**: Click, type, submit forms
2. **Test Rendered Output**: Check if correct elements are displayed
3. **Test Props**: Verify component behavior with different props
4. **Avoid Implementation Details**: Don't test internal state or methods
5. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`

### Accessibility Testing

1. **Use axe-core**: Run automated accessibility checks
2. **Test Keyboard Navigation**: Verify tab order and focus management
3. **Test ARIA Attributes**: Check proper ARIA labels and roles
4. **Test Screen Reader Compatibility**: Ensure proper semantic HTML

## Helper Functions

### MSW Helpers

Located in [tests/helpers/msw.ts](helpers/msw.ts):

- `setupMswServer()` - Initialize MSW server with lifecycle hooks
- `handlers.auth.*` - Pre-configured auth endpoint handlers
- `handlers.offers.*` - Pre-configured offers endpoint handlers
- `handlers.investments.*` - Pre-configured investments endpoint handlers

### Supabase Helpers

Located in [tests/helpers/supabase.ts](helpers/supabase.ts):

- `createMockSupabaseClient()` - Create a mock Supabase client
- `mockAuthSuccess()` - Mock successful authentication
- `mockAuthFailure()` - Mock authentication failure
- `mockUsers.*` - Pre-configured mock user objects

### Render Helpers

Located in [tests/helpers/render.tsx](helpers/render.tsx):

- `render()` - Custom render function with providers

## Coverage Goals

Aim for the following coverage targets:

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All critical API endpoints
- **E2E Tests**: All critical user journeys

Run `npm run test:coverage` to generate coverage reports.

## Debugging Tests

### Vitest

```bash
# Run tests with UI for debugging
npm run test:ui

# Run specific test file
npm run test -- path/to/test.test.ts

# Run tests matching pattern
npm run test -- --grep "login"
```

### Playwright

```bash
# Run with debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run with headed browser
npx playwright test --headed

# Generate test code with Codegen
npx playwright codegen http://localhost:3001
```

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

- Set `CI=true` environment variable
- Playwright will run with increased retries and single worker
- Screenshots and traces captured on failures

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
