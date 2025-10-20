/**
 * Feature Flags Module
 *
 * Universal TypeScript module for managing feature flags across
 * frontend (React, Astro pages) and backend (API routes, services).
 *
 * @module features
 *
 * ## Usage Patterns
 *
 * ### 1. Imperative (API routes, Astro pages, services)
 * ```typescript
 * import { isFeatureEnabled } from '@/features';
 *
 * if (!isFeatureEnabled('auth')) {
 *   return new Response(JSON.stringify({ error: 'Feature disabled' }), { status: 503 });
 * }
 * ```
 *
 * ### 2. Declarative (React components)
 * ```tsx
 * import { FeatureFlag } from '@/features';
 *
 * <FeatureFlag feature="auth" fallback={<ComingSoon />}>
 *   <LoginForm />
 * </FeatureFlag>
 * ```
 *
 * ### 3. Guard Pattern (API routes)
 * ```typescript
 * import { withFeatureFlag } from '@/features';
 *
 * export const POST = withFeatureFlag('auth', async ({ locals }) => {
 *   // Handler code
 * });
 * ```
 */

// Core functionality
export { isFeatureEnabled, getEnvironment } from "./core";

// React component
export { FeatureFlag } from "./FeatureFlag";
export type { FeatureFlagProps } from "./FeatureFlag";

// API middleware
export { withFeatureFlag } from "./withFeatureFlag";

// Types
export type { FeatureName, Environment, FeaturesConfig, EnvironmentConfig } from "./config";
