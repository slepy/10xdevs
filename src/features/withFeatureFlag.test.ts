/**
 * API Middleware withFeatureFlag Tests
 *
 * Tests for the guard pattern middleware including:
 * - 503 response when disabled
 * - Handler execution when enabled
 * - Context preservation
 * - Error response format
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { withFeatureFlag } from "./withFeatureFlag";
import * as core from "./core";
import type { APIContext } from "astro";

describe("withFeatureFlag Middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockContext = (): APIContext => {
    return {
      request: new Request("http://localhost/api/test"),
      locals: {},
      params: {},
      url: new URL("http://localhost/api/test"),
    } as APIContext;
  };

  it("should return 503 when feature is disabled", async () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(false);

    const handler = vi.fn();
    const wrappedHandler = withFeatureFlag("auth", handler);
    const context = createMockContext();

    const response = await wrappedHandler(context);

    expect(response.status).toBe(503);
    expect(handler).not.toHaveBeenCalled();

    const body = await response.json();
    expect(body).toEqual({
      error: "Feature not available",
      code: "FEATURE_DISABLED",
      feature: "auth",
    });
  });

  it("should call handler when feature is enabled", async () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    const mockResponse = new Response(JSON.stringify({ success: true }));
    const handler = vi.fn().mockResolvedValue(mockResponse);
    const wrappedHandler = withFeatureFlag("auth", handler);
    const context = createMockContext();

    const response = await wrappedHandler(context);

    expect(handler).toHaveBeenCalledWith(context);
    expect(response).toBe(mockResponse);
  });

  it("should preserve request context", async () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    const context = createMockContext();
    context.locals = { user: { id: "123" } };
    context.params = { id: "456" };

    const handler = vi.fn().mockResolvedValue(new Response());
    const wrappedHandler = withFeatureFlag("auth", handler);

    await wrappedHandler(context);

    expect(handler).toHaveBeenCalledWith(context);
    const calledContext = handler.mock.calls[0][0];
    expect(calledContext.locals).toEqual({ user: { id: "123" } });
    expect(calledContext.params).toEqual({ id: "456" });
  });

  it("should check the correct feature name", async () => {
    const spy = vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    const handler = vi.fn().mockResolvedValue(new Response());
    const wrappedHandler = withFeatureFlag("offers-create", handler);
    const context = createMockContext();

    await wrappedHandler(context);

    expect(spy).toHaveBeenCalledWith("offers-create");
  });

  it("should return JSON response with correct content-type when disabled", async () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(false);

    const handler = vi.fn();
    const wrappedHandler = withFeatureFlag("auth", handler);
    const context = createMockContext();

    const response = await wrappedHandler(context);

    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should include feature name in error response", async () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(false);

    const handler = vi.fn();
    const wrappedHandler = withFeatureFlag("offers-list", handler);
    const context = createMockContext();

    const response = await wrappedHandler(context);
    const body = await response.json();

    expect(body.feature).toBe("offers-list");
  });

  it("should handle async handler responses", async () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    const handler = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new Response(JSON.stringify({ data: "test" }));
    });

    const wrappedHandler = withFeatureFlag("auth", handler);
    const context = createMockContext();

    const response = await wrappedHandler(context);
    const body = await response.json();

    expect(body).toEqual({ data: "test" });
  });

  it("should pass through handler errors", async () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    const error = new Error("Handler error");
    const handler = vi.fn().mockRejectedValue(error);
    const wrappedHandler = withFeatureFlag("auth", handler);
    const context = createMockContext();

    await expect(wrappedHandler(context)).rejects.toThrow("Handler error");
  });

  it("should work with different HTTP methods", async () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

    for (const method of methods) {
      const context = createMockContext();
      context.request = new Request(`http://localhost/api/test`, { method });

      const handler = vi.fn().mockResolvedValue(new Response());
      const wrappedHandler = withFeatureFlag("auth", handler);

      await wrappedHandler(context);

      expect(handler).toHaveBeenCalledWith(context);
    }
  });

  it("should handle multiple sequential calls", async () => {
    const spy = vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    const handler = vi.fn().mockResolvedValue(new Response());
    const wrappedHandler = withFeatureFlag("auth", handler);

    await wrappedHandler(createMockContext());
    await wrappedHandler(createMockContext());
    await wrappedHandler(createMockContext());

    expect(handler).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
