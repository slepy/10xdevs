/**
 * Core Feature Flags Logic
 *
 * Provides the core functionality for checking feature flags.
 * Works in both server-side (Astro SSR, API routes) and client-side contexts.
 */

import { features, type Environment, type FeatureName } from "./config";

/**
 * Detects the current environment based on import.meta.env.MODE
 *
 * @returns Current environment ('development', 'production', or 'test')
 */
export function getCurrentEnvironment(): Environment {
  const mode = import.meta.env.MODE;

  if (mode === "production") return "production";
  if (mode === "test") return "test";
  return "development";
}

/**
 * Checks if a feature is enabled in the current environment
 *
 * Fallback strategy (fail-open):
 * - If feature config is missing → returns true (enabled)
 * - If environment value is undefined → returns true (enabled)
 * - This prevents accidental outages from misconfiguration
 *
 * @param feature - The feature name to check
 * @returns true if feature is enabled, false otherwise
 *
 * @example
 * // In API route
 * if (!isFeatureEnabled('auth')) {
 *   return new Response(JSON.stringify({ error: 'Feature disabled' }), { status: 503 });
 * }
 *
 * @example
 * // In Astro page
 * if (!isFeatureEnabled('offers-create')) {
 *   return Astro.redirect('/coming-soon');
 * }
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
  const environment = getCurrentEnvironment();
  const config = features[feature];

  // Fallback: if config missing or undefined, default to enabled
  if (!config) {
    // eslint-disable-next-line no-console
    console.warn(`Feature "${feature}" has no configuration. Defaulting to enabled.`);
    return true;
  }

  const envValue = config[environment];

  if (envValue === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`Feature "${feature}" has no configuration for environment "${environment}". Defaulting to enabled.`);
    return true;
  }

  return envValue;
}

/**
 * Gets the current environment (exposed for testing and debugging)
 *
 * @returns Current environment string
 */
export function getEnvironment(): Environment {
  return getCurrentEnvironment();
}
