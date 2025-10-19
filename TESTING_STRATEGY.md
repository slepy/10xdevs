# Testing Strategy for Refactored Forms

## Overview

The refactored forms using React Hook Form require a different testing approach compared to the original implementation. This document outlines the comprehensive testing strategy.

## Testing Categories

### 1. Unit Tests for Custom Hooks

**Files**: `useLogin.test.ts`, `useRegister.test.ts`

**Test Focus**:

- API call behavior with correct data
- Error handling for various error types
- Loading state management
- Side effects (localStorage, cookies, redirects)
- Success/error callback execution

**Example Test Pattern**:

```typescript
it("should handle successful login", async () => {
  const mockUser = { id: "1", email: "test@example.com" };
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: { user: mockUser, session: mockSession } }),
  });

  const onSuccess = vi.fn();
  const { result } = renderHook(() => useLogin({ onSuccess }));

  await act(async () => {
    await result.current.login({ email: "test@example.com", password: "password123" });
  });

  expect(onSuccess).toHaveBeenCalledWith(mockUser);
});
```

### 2. Component Integration Tests

**Files**: `LoginFormRHF.test.tsx`, `RegisterFormRHF.test.tsx`

**Test Focus**:

- Form rendering with all required fields
- Validation behavior (field-level and form-level)
- User interactions (typing, submission)
- Error display and clearing
- Accessibility attributes
- Loading state UI

**Key Testing Principles**:

- Test user behavior, not implementation details
- Use React Testing Library's user-centric queries
- Mock external dependencies (hooks, APIs)
- Verify accessibility features

### 3. Form Validation Tests

**Files**: `auth.validator.test.ts` (existing)

**Test Focus**:

- Zod schema validation rules
- Error messages for invalid inputs
- Edge cases and boundary conditions
- Password confirmation logic

### 4. End-to-End Tests

**Files**: `login-enhanced.spec.ts`, `register-enhanced.spec.ts` (existing)

**Updates Needed**:

- Verify forms work with React Hook Form
- Test complete user journeys
- Validate error handling flows
- Ensure accessibility compliance

## Testing Best Practices

### 1. Mock Strategy

```typescript
// Mock custom hooks, not React Hook Form internals
vi.mock("./hooks/useLogin", () => ({
  useLogin: vi.fn(),
}));

// Test the hook behavior separately
const mockUseLogin = vi.mocked(useLogin);
mockUseLogin.mockReturnValue({
  login: mockLogin,
  isLoading: false,
});
```

### 2. User-Centric Testing

```typescript
// Good: Test user behavior
await user.type(screen.getByLabelText(/e-mail/i), "test@example.com");
await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

// Avoid: Testing implementation details
// expect(form.values.email).toBe("test@example.com");
```

### 3. Accessibility Testing

```typescript
it("should have proper accessibility attributes", () => {
  render(<LoginForm />);

  const emailField = screen.getByLabelText(/e-mail/i);
  expect(emailField).toHaveAttribute("type", "email");
  expect(emailField).toHaveAttribute("autoComplete", "email");
});
```

### 4. Error Handling

```typescript
it("should display validation errors", async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.click(screen.getByRole("button", { name: /zaloguj się/i }));

  await waitFor(() => {
    expect(screen.getByText(/e-mail jest wymagany/i)).toBeInTheDocument();
  });
});
```

## Migration Testing Strategy

### Phase 1: Parallel Testing

- Keep both old and new forms during transition
- Run tests for both implementations
- Compare behavior and ensure parity

### Phase 2: Component Swapping

- Gradually replace components in pages
- Update E2E tests to use new selectors
- Verify no regression in user experience

### Phase 3: Cleanup

- Remove old form implementations
- Update all test references
- Clean up unused test utilities

## Test Coverage Goals

### Minimum Coverage Targets

- **Custom Hooks**: 90%+ line coverage
- **Form Components**: 85%+ line coverage
- **Integration Scenarios**: 80%+ path coverage

### Critical Test Scenarios

1. **Happy Path**: User fills form correctly and submits
2. **Validation Errors**: All validation rules trigger appropriate errors
3. **API Errors**: Network failures and server errors handled gracefully
4. **Loading States**: UI shows appropriate loading indicators
5. **Accessibility**: Form is usable with keyboard and screen readers

## Tools and Setup

### Required Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/user-event
npm install --save-dev vitest @testing-library/jest-dom
npm install --save-dev @axe-core/react
```

### Test Environment Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### MSW Setup for API Mocking

```typescript
// tests/helpers/msw.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.post('/api/auth/login', () => {
    return HttpResponse.json({ data: { user: mockUser, session: mockSession } });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Continuous Integration

### Test Pipeline

1. **Lint Check**: ESLint validation
2. **Type Check**: TypeScript compilation
3. **Unit Tests**: Jest/Vitest execution  
4. **Integration Tests**: Component testing
5. **E2E Tests**: Playwright execution
6. **Coverage Report**: Generate and upload coverage

### Performance Testing

- Measure form render times
- Check for memory leaks in form interactions
- Validate bundle size impact of React Hook Form

This comprehensive testing strategy ensures that the refactored forms maintain quality while providing better performance and maintainability.
