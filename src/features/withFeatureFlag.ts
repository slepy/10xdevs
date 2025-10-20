/**
 * API Route Feature Flag Guard
 *
 * Higher-order function that wraps API route handlers with feature flag checking.
 * Automatically returns 503 if feature is disabled.
 */

import type { APIContext, APIRoute } from "astro";
import { isFeatureEnabled } from "./core";
import type { FeatureName } from "./config";

/**
 * Error response when feature is disabled
 */
interface FeatureDisabledResponse {
  error: string;
  code: string;
  feature: string;
}

/**
 * Wraps an API route handler with feature flag checking
 *
 * If the feature is disabled, automatically returns a 503 Service Unavailable response.
 * If the feature is enabled, calls the provided handler.
 *
 * @param feature - The feature name to check
 * @param handler - The API route handler to wrap
 * @returns Wrapped API route handler
 *
 * @example
 * // Basic usage
 * export const POST = withFeatureFlag('auth', async ({ request, locals }) => {
 *   // This code only runs if 'auth' feature is enabled
 *   const data = await request.json();
 *   // ... handle request
 *   return new Response(JSON.stringify({ success: true }));
 * });
 *
 * @example
 * // With destructured context
 * export const GET = withFeatureFlag('offers-list', async ({ params, locals }) => {
 *   const offerId = params.id;
 *   // ... fetch and return offer
 * });
 */
export function withFeatureFlag(feature: FeatureName, handler: APIRoute): APIRoute {
  return async (context: APIContext) => {
    // Check if feature is enabled
    if (!isFeatureEnabled(feature)) {
      const response: FeatureDisabledResponse = {
        error: "Feature not available",
        code: "FEATURE_DISABLED",
        feature,
      };

      return new Response(JSON.stringify(response), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Feature is enabled, call the handler
    return handler(context);
  };
}
