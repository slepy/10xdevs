import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogin } from "./useLogin";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

// Mock window.location.replace
Object.defineProperty(window, "location", {
  value: {
    protocol: "https:",
    replace: vi.fn(),
  },
});

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockLocalStorage.setItem.mockClear();
    window.location.replace = vi.fn();
  });

  it("should handle successful login", async () => {
    const mockUser = { id: "1", email: "test@example.com", firstName: "Test", lastName: "User" };
    const mockSession = {
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_at: Date.now() / 1000 + 3600,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          user: mockUser,
          session: mockSession,
        },
      }),
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLogin({ onSuccess }));

    await act(async () => {
      await result.current.login({ email: "test@example.com", password: "password123" });
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "password123" }),
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("supabase-token", mockSession.access_token);
    expect(onSuccess).toHaveBeenCalledWith(mockUser);
    expect(window.location.replace).toHaveBeenCalledWith("/offers");
  });

  it("should handle login error", async () => {
    const errorMessage = "Invalid credentials";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: errorMessage,
      }),
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useLogin({ onError }));

    await act(async () => {
      try {
        await result.current.login({ email: "test@example.com", password: "wrong-password" });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(errorMessage);
      }
    });

    expect(onError).toHaveBeenCalledWith(errorMessage);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("should start with loading state as false", () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.isLoading).toBe(false);
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network error");
    mockFetch.mockRejectedValueOnce(networkError);

    const onError = vi.fn();
    const { result } = renderHook(() => useLogin({ onError }));

    await act(async () => {
      await expect(result.current.login({ email: "test@example.com", password: "password123" })).rejects.toThrow(
        "Network error"
      );
    });

    expect(onError).toHaveBeenCalledWith("Network error");
  });
});
