/**
 * React Feature Flag Component
 *
 * Declarative component for conditional rendering based on feature flags.
 * Use this in React components for clean, readable feature toggling.
 */

import React from "react";
import { isFeatureEnabled } from "./core";
import type { FeatureName } from "./config";

export interface FeatureFlagProps {
  /**
   * The feature name to check
   */
  feature: FeatureName;

  /**
   * Content to render when feature is enabled
   */
  children: React.ReactNode;

  /**
   * Optional content to render when feature is disabled
   * If not provided, nothing is rendered when disabled
   */
  fallback?: React.ReactNode;
}

/**
 * Feature Flag Component
 *
 * Conditionally renders children based on feature flag state.
 *
 * @example
 * // Basic usage
 * <FeatureFlag feature="auth">
 *   <LoginForm />
 * </FeatureFlag>
 *
 * @example
 * // With fallback
 * <FeatureFlag feature="offers-create" fallback={<ComingSoon />}>
 *   <CreateOfferForm />
 * </FeatureFlag>
 */
export function FeatureFlag({ feature, children, fallback = null }: FeatureFlagProps) {
  const enabled = isFeatureEnabled(feature);

  if (enabled) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
