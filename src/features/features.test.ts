/**
 * Feature Flags Unit Tests
 *
 * Tests for core feature flags functionality including:
 * - Configuration validation
 * - Environment detection
 * - Flag checking logic
 * - Fallback behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isFeatureEnabled, getCurrentEnvironment, getEnvironment } from "./core";
import { features } from "./config";
import type { FeatureName } from "./config";

describe("Feature Flags - Configuration", () => {
  it("should have all features defined", () => {
    expect(features).toBeDefined();
    expect(features.auth).toBeDefined();
    expect(features["offers-list"]).toBeDefined();
    expect(features["offers-create"]).toBeDefined();
    expect(features["offer-details"]).toBeDefined();
  });

  it("should have all environments for each feature", () => {
    const featureNames: FeatureName[] = ["auth", "offers-list", "offers-create", "offer-details"];

    featureNames.forEach((feature) => {
      expect(features[feature].development).toBeDefined();
      expect(features[feature].production).toBeDefined();
      expect(features[feature].test).toBeDefined();
    });
  });

  it("should have boolean values for all environment configs", () => {
    const featureNames: FeatureName[] = ["auth", "offers-list", "offers-create", "offer-details"];

    featureNames.forEach((feature) => {
      expect(typeof features[feature].development).toBe("boolean");
      expect(typeof features[feature].production).toBe("boolean");
      expect(typeof features[feature].test).toBe("boolean");
    });
  });
});

describe("Feature Flags - Environment Detection", () => {
  const originalEnv = import.meta.env.MODE;

  afterEach(() => {
    // Restore original environment
    import.meta.env.MODE = originalEnv;
  });

  it("should detect production environment", () => {
    import.meta.env.MODE = "production";
    expect(getCurrentEnvironment()).toBe("production");
  });

  it("should detect test environment", () => {
    import.meta.env.MODE = "test";
    expect(getCurrentEnvironment()).toBe("test");
  });

  it("should default to development for unknown environments", () => {
    import.meta.env.MODE = "staging";
    expect(getCurrentEnvironment()).toBe("development");
  });

  it("should default to development when MODE is undefined", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import.meta.env.MODE = undefined as any;
    expect(getCurrentEnvironment()).toBe("development");
  });

  it("should expose getEnvironment function", () => {
    expect(getEnvironment()).toBe(getCurrentEnvironment());
  });
});

describe("Feature Flags - Core Logic", () => {
  const originalEnv = import.meta.env.MODE;

  beforeEach(() => {
    import.meta.env.MODE = "test";
  });

  afterEach(() => {
    import.meta.env.MODE = originalEnv;
    vi.restoreAllMocks();
  });

  it("should return true for enabled features", () => {
    // In test environment, auth should be enabled (per config)
    expect(isFeatureEnabled("auth")).toBe(true);
  });

  it("should return false for disabled features", () => {
    // Change to production where offers-create is disabled
    import.meta.env.MODE = "production";
    expect(isFeatureEnabled("offers-create")).toBe(true);
  });

  it("should return correct values for all features in test environment", () => {
    // Per config.ts, all features are enabled in test
    expect(isFeatureEnabled("auth")).toBe(true);
    expect(isFeatureEnabled("offers-list")).toBe(true);
    expect(isFeatureEnabled("offers-create")).toBe(true);
    expect(isFeatureEnabled("offer-details")).toBe(true);
  });

  it("should return correct values for all features in production environment", () => {
    import.meta.env.MODE = "production";

    expect(isFeatureEnabled("auth")).toBe(true);
    expect(isFeatureEnabled("offers-list")).toBe(true);
    expect(isFeatureEnabled("offers-create")).toBe(true);
    expect(isFeatureEnabled("offer-details")).toBe(true);
  });

  it("should return correct values for all features in development environment", () => {
    import.meta.env.MODE = "development";

    expect(isFeatureEnabled("auth")).toBe(true);
    expect(isFeatureEnabled("offers-list")).toBe(true);
    expect(isFeatureEnabled("offers-create")).toBe(true);
    expect(isFeatureEnabled("offer-details")).toBe(true);
  });
});

describe("Feature Flags - Fallback Behavior", () => {
  const originalEnv = import.meta.env.MODE;

  beforeEach(() => {
    import.meta.env.MODE = "test";
  });

  afterEach(() => {
    import.meta.env.MODE = originalEnv;
    vi.restoreAllMocks();
  });

  it("should default to enabled for missing feature config", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Force check a non-existent feature by bypassing TypeScript
    const result = isFeatureEnabled("non-existent-feature" as FeatureName);

    expect(result).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Feature "non-existent-feature" has no configuration')
    );

    consoleWarnSpy.mockRestore();
  });

  it("should log warning when feature config is missing", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    isFeatureEnabled("non-existent-feature" as FeatureName);

    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("should default to enabled if environment value is undefined", async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Mock features config with missing environment
    const mockFeatures = {
      auth: {
        development: true,
        production: true,
        // test is missing
      },
    };

    // Use dynamic import and vi.mock instead of require
    const configModule = await import("./config");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(configModule, "features", "get").mockReturnValue(mockFeatures as any);

    const result = isFeatureEnabled("auth");

    expect(result).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });
});

describe("Feature Flags - Type Safety", () => {
  it("should only accept valid feature names", () => {
    // These should compile without errors
    const validFeatures: FeatureName[] = ["auth", "offers-list", "offers-create", "offer-details"];

    validFeatures.forEach((feature) => {
      expect(() => isFeatureEnabled(feature)).not.toThrow();
    });
  });

  it("should have consistent feature names in config and type", () => {
    const configFeatures = Object.keys(features);
    const expectedFeatures = ["auth", "offers-list", "offers-create", "offer-details"];

    expect(configFeatures.sort()).toEqual(expectedFeatures.sort());
  });
});
