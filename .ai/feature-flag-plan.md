# Feature Flags Implementation Plan

## Overview

System feature flags umożliwiający rozdzielenie deploymentów od releasów poprzez warunkowe włączanie/wyłączanie funkcjonalności w zależności od środowiska.

## Requirements

- **Źródło konfiguracji**: Statyczna konfiguracja w pliku TypeScript (wymaga rebuildu)
- **Granularność**: Per środowisko (development, production, test)
- **Typ wartości**: Boolean (on/off)
- **Fallback**: Domyślnie włączona funkcjonalność
- **Strategia**: Takie same strategie dla wszystkich flag we wszystkich środowiskach
- **API**: Trzy wzorce użycia (imperatywny, deklaratywny, guard pattern)

## Architecture

### Module Structure

```
src/features/
├── index.ts                    # Public API - exports all patterns
├── config.ts                   # Feature flags configuration (feature-first)
├── core.ts                     # Core logic for checking flags
├── FeatureFlag.tsx             # React component (declarative pattern)
├── withFeatureFlag.ts          # API middleware (guard pattern)
└── features.test.ts            # Unit tests
```

### Type System

```typescript
type FeatureName = 'auth' | 'offers-list' | 'offers-create';
type Environment = 'development' | 'production' | 'test';
type EnvironmentConfig = Record<Environment, boolean>;
type FeaturesConfig = Record<FeatureName, EnvironmentConfig>;
```

### Configuration Structure

```typescript
// config.ts
const features: FeaturesConfig = {
  'auth': {
    development: true,
    production: true,
    test: true,
  },
  'offers-list': {
    development: true,
    production: true,
    test: true,
  },
  'offers-create': {
    development: true,
    production: false,
    test: true,
  },
};
```

**Design rationale**: Feature-first structure pozwala łatwo zobaczyć status danego feature'a we wszystkich środowiskach w jednym miejscu.

## Usage Patterns

### 1. Imperative Pattern

**Use cases**: API endpoints, Astro pages, services, middleware

```typescript
import { isFeatureEnabled } from '@/features';

// In API route
export const POST: APIRoute = async ({ locals }) => {
  if (!isFeatureEnabled('auth')) {
    return new Response(
      JSON.stringify({ error: 'Feature not available' }),
      { status: 503 }
    );
  }
  // ... implementation
};

// In Astro page
---
import { isFeatureEnabled } from '@/features';

if (!isFeatureEnabled('auth')) {
  return Astro.redirect('/coming-soon');
}
---
```

### 2. Declarative Pattern (React)

**Use cases**: React components, conditional rendering

```tsx
import { FeatureFlag } from '@/features';

function App() {
  return (
    <FeatureFlag
      feature="auth"
      fallback={<ComingSoonMessage />}
    >
      <LoginForm />
    </FeatureFlag>
  );
}
```

### 3. Guard Pattern (API Middleware)

**Use cases**: API routes with automatic feature check

```typescript
import { withFeatureFlag } from '@/features';

export const POST = withFeatureFlag('auth', async ({ request, locals }) => {
  // Automatically returns 503 if feature is disabled
  // ... implementation
});
```

## Implementation Areas

### Core Areas (Initial Implementation)

1. **API Endpoints**
   - `src/pages/api/auth/**/*.ts` - Authentication endpoints
   - `src/pages/api/offers/**/*.ts` - Offers management endpoints

2. **Astro Pages**
   - `src/pages/login.astro` - Login page
   - `src/pages/register.astro` - Registration page
   - `src/pages/offers/**/*.astro` - Offers pages

### Extended Areas (Recommended)

3. **Middleware** (`src/middleware/index.ts`)
   - Global routing guards
   - Feature-based redirects

4. **Layout Components** (`src/layouts/*.astro`)
   - Conditional navigation items
   - Feature-based UI sections

5. **Services** (`src/lib/services/`)
   - `AuthService` - conditional auth logic
   - `OfferService` - conditional offer operations

6. **React Components** (`src/components/`)
   - Conditional feature rendering
   - Feature-aware forms

7. **Custom Hooks** (`src/components/hooks/`)
   - `useFeature(name)` - React hook wrapper
   - Feature-aware data fetching

8. **Notifications/Emails**
   - Conditional notification triggers
   - Feature-based email templates

9. **Admin Panel**
   - Read-only feature flags status display
   - Environment awareness indicator

## Core Logic Implementation

### Environment Detection

```typescript
// core.ts
function getCurrentEnvironment(): Environment {
  const env = import.meta.env.MODE;

  if (env === 'production') return 'production';
  if (env === 'test') return 'test';
  return 'development';
}
```

### Flag Checking Logic

```typescript
// core.ts
export function isFeatureEnabled(feature: FeatureName): boolean {
  const environment = getCurrentEnvironment();
  const config = features[feature];

  // Fallback: if config missing or undefined, default to enabled
  if (!config) return true;
  if (config[environment] === undefined) return true;

  return config[environment];
}
```

## Error Handling Strategy

### Defensive Defaults

- **Missing feature**: Return `true` (enabled by default)
- **Missing environment**: Return `true` (enabled by default)
- **Invalid configuration**: Log warning, return `true`

**Rationale**: "Fail open" strategy ensures features work by default, preventing accidental outages from misconfiguration.

### HTTP Responses

When feature is disabled:

```typescript
{
  status: 503,
  body: {
    error: 'Feature not available',
    code: 'FEATURE_DISABLED',
    feature: 'feature-name'
  }
}
```

## Testing Strategy

### Unit Tests

1. **Config validation**
   - All features have all environments defined
   - All values are boolean

2. **Core logic**
   - Environment detection works correctly
   - Flag checking returns correct values
   - Fallback logic works (missing config → true)

3. **React component**
   - Renders children when enabled
   - Renders fallback when disabled
   - Handles missing fallback gracefully

4. **Guard middleware**
   - Returns 503 when feature disabled
   - Calls handler when feature enabled
   - Preserves request context

### Integration Tests

1. **API endpoints with flags**
   - Mock environment
   - Test enabled/disabled scenarios
   - Verify correct HTTP responses

2. **Astro pages with flags**
   - Test redirects when disabled
   - Test rendering when enabled

## Migration Strategy

### Phase 1: Core Implementation (This Step)

- Create `src/features/` module
- Implement all three patterns
- Add unit tests
- Document usage

### Phase 2: Integration (Next Step)

- Add flags to auth endpoints
- Add flags to offers endpoints
- Add flags to login/register pages
- Update middleware if needed

### Phase 3: Extended Adoption

- Add flags to other features as needed
- Create admin panel visualization
- Add monitoring/logging

## Type Safety

### Strict Feature Names

```typescript
// Union type prevents typos
type FeatureName = 'auth' | 'offers-list' | 'offers-create';

// TypeScript will error on invalid feature name
isFeatureEnabled('authhh'); // ❌ Error
isFeatureEnabled('auth');   // ✅ OK
```

### Config Validation

```typescript
// Ensure all features have all environments
type FeaturesConfig = {
  [K in FeatureName]: Record<Environment, boolean>;
};
```

## Future Enhancements (Out of Scope)

- Dynamic configuration from Supabase
- User-level flags (whitelist testing)
- Percentage rollouts
- A/B testing variants
- Analytics integration
- Admin UI for toggling flags

## File Checklist

- [ ] `src/features/config.ts` - Feature flags configuration
- [ ] `src/features/core.ts` - Core logic (environment detection, flag checking)
- [ ] `src/features/index.ts` - Public API exports
- [ ] `src/features/FeatureFlag.tsx` - React component
- [ ] `src/features/withFeatureFlag.ts` - API middleware guard
- [ ] `src/features/features.test.ts` - Unit tests
- [ ] `src/env.d.ts` - Update types if needed

## Success Criteria

- ✅ All three usage patterns work correctly
- ✅ Type-safe feature names
- ✅ Environment detection works in all contexts (SSR, API, client)
- ✅ Fallback strategy prevents accidental outages
- ✅ 100% test coverage for core module
- ✅ Clear documentation and examples
- ✅ Zero runtime dependencies
