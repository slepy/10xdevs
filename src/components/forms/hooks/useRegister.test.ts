import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRegister } from "./useRegister";

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

// Mock window.location.replace
Object.defineProperty(window, "location", {
  value: {
    replace: vi.fn(),
  },
});

describe("useRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockLocalStorage.setItem.mockClear();
    window.location.replace = vi.fn();
  });

  it("should handle successful registration", async () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
    };
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
    const { result } = renderHook(() => useRegister({ onSuccess }));

    const registerData = {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    };

    await act(async () => {
      await result.current.register(registerData);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("supabase-token", mockSession.access_token);
    expect(onSuccess).toHaveBeenCalledWith(mockUser);
    expect(window.location.replace).toHaveBeenCalledWith("/offers");
  });

  it("should handle registration error", async () => {
    const errorMessage = "Email already exists";
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        message: errorMessage,
      }),
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useRegister({ onError }));

    const registerData = {
      firstName: "John",
      lastName: "Doe",
      email: "existing@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    };

    await act(async () => {
      try {
        await result.current.register(registerData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(errorMessage);
      }
    });

    expect(onError).toHaveBeenCalledWith(errorMessage);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("should handle API validation errors with field details", async () => {
    const validationErrors = [
      { field: "email", message: "Invalid email format" },
      { field: "password", message: "Password too weak" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        details: validationErrors,
      }),
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useRegister({ onError }));

    const registerData = {
      firstName: "John",
      lastName: "Doe",
      email: "invalid-email",
      password: "weak",
      confirmPassword: "weak",
    };

    await act(async () => {
      try {
        await result.current.register(registerData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("email: Invalid email format, password: Password too weak");
      }
    });

    expect(onError).toHaveBeenCalledWith("email: Invalid email format, password: Password too weak");
  });

  it("should manage loading state correctly", async () => {
    // Simply check that loading starts and ends correctly with synchronous mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            user: { id: "1", email: "test@example.com" },
            session: { access_token: "token", refresh_token: "refresh" },
          },
        }),
    } as Response);

    const { result } = renderHook(() => useRegister());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await result.current.register({
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("should handle network errors", async () => {
    const networkError = new Error("Network error");
    mockFetch.mockRejectedValueOnce(networkError);

    const onError = vi.fn();
    const { result } = renderHook(() => useRegister({ onError }));

    const registerData = {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    };

    await act(async () => {
      await expect(result.current.register(registerData)).rejects.toThrow("Network error");
    });

    expect(onError).toHaveBeenCalledWith("Network error");
  });

  it("should handle fallback error message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}), // No message or error field
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useRegister({ onError }));

    const registerData = {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "Password123!",
      confirmPassword: "Password123!",
    };

    await act(async () => {
      try {
        await result.current.register(registerData);
      } catch (error) {
        expect((error as Error).message).toBe("Błąd podczas rejestracji");
      }
    });

    expect(onError).toHaveBeenCalledWith("Błąd podczas rejestracji");
  });
});
