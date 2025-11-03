/**
 * Feature Flags Configuration
 *
 * This file defines which features are enabled in each environment.
 * Structure: feature-first (each feature lists its environment states)
 *
 * @example
 * features = {
 *   'feature-name': {
 *     development: true,
 *     production: false,
 *     test: true,
 *   }
 * }
 */

export type Environment = "development" | "production" | "test";

export type FeatureName = "auth" | "offers-list" | "offers-create" | "offer-details";

export type EnvironmentConfig = Record<Environment, boolean>;

export type FeaturesConfig = Record<FeatureName, EnvironmentConfig>;

/**
 * Feature flags configuration
 *
 * Each feature defines its enabled/disabled state per environment.
 * Default fallback: if config is missing or undefined, feature is enabled.
 */
export const features: FeaturesConfig = {
  auth: {
    development: true,
    production: true,
    test: true,
  },
  "offers-list": {
    development: true,
    production: true,
    test: true,
  },
  "offers-create": {
    development: true,
    production: true,
    test: true,
  },
  "offer-details": {
    development: true,
    production: true,
    test: true,
  },
};
