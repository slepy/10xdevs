/**
 * React FeatureFlag Component Tests
 *
 * Tests for the declarative React component including:
 * - Rendering when enabled/disabled
 * - Fallback behavior
 * - Children rendering
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureFlag } from "./FeatureFlag";
import * as core from "./core";

describe("FeatureFlag Component", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render children when feature is enabled", () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    render(
      <FeatureFlag feature="auth">
        <div>Login Form</div>
      </FeatureFlag>
    );

    expect(screen.getByText("Login Form")).toBeInTheDocument();
  });

  it("should not render children when feature is disabled", () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(false);

    render(
      <FeatureFlag feature="auth">
        <div>Login Form</div>
      </FeatureFlag>
    );

    expect(screen.queryByText("Login Form")).not.toBeInTheDocument();
  });

  it("should render fallback when feature is disabled and fallback is provided", () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(false);

    render(
      <FeatureFlag feature="auth" fallback={<div>Coming Soon</div>}>
        <div>Login Form</div>
      </FeatureFlag>
    );

    expect(screen.queryByText("Login Form")).not.toBeInTheDocument();
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("should render nothing when feature is disabled and no fallback is provided", () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(false);

    const { container } = render(
      <FeatureFlag feature="auth">
        <div>Login Form</div>
      </FeatureFlag>
    );

    // Should render empty fragment
    expect(container.textContent).toBe("");
  });

  it("should call isFeatureEnabled with correct feature name", () => {
    const spy = vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    render(
      <FeatureFlag feature="offers-create">
        <div>Create Offer</div>
      </FeatureFlag>
    );

    expect(spy).toHaveBeenCalledWith("offers-create");
  });

  it("should render multiple children when enabled", () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    render(
      <FeatureFlag feature="auth">
        <div>Login Form</div>
        <div>Register Link</div>
      </FeatureFlag>
    );

    expect(screen.getByText("Login Form")).toBeInTheDocument();
    expect(screen.getByText("Register Link")).toBeInTheDocument();
  });

  it("should handle complex JSX children", () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(true);

    render(
      <FeatureFlag feature="auth">
        <div>
          <h1>Title</h1>
          <p>Description</p>
        </div>
      </FeatureFlag>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("should handle complex JSX fallback", () => {
    vi.spyOn(core, "isFeatureEnabled").mockReturnValue(false);

    render(
      <FeatureFlag
        feature="auth"
        fallback={
          <div>
            <h2>Coming Soon</h2>
            <p>This feature is not available yet</p>
          </div>
        }
      >
        <div>Login Form</div>
      </FeatureFlag>
    );

    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    expect(screen.getByText("This feature is not available yet")).toBeInTheDocument();
    expect(screen.queryByText("Login Form")).not.toBeInTheDocument();
  });

  it("should re-render when feature flag changes", () => {
    const spy = vi.spyOn(core, "isFeatureEnabled").mockReturnValue(false);

    const { rerender } = render(
      <FeatureFlag feature="auth">
        <div>Login Form</div>
      </FeatureFlag>
    );

    expect(screen.queryByText("Login Form")).not.toBeInTheDocument();

    // Change feature flag state
    spy.mockReturnValue(true);

    rerender(
      <FeatureFlag feature="auth">
        <div>Login Form</div>
      </FeatureFlag>
    );

    expect(screen.getByText("Login Form")).toBeInTheDocument();
  });
});
