import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabaseClient } from "../../../tests/helpers/supabase";
import { USER_ROLES } from "@/types";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    authService = new AuthService(mockSupabase);
  });

  describe("register", () => {
    it("should register a new user successfully with session", async () => {
      const mockUser = {
        id: "new-user-id",
        email: "newuser@example.com",
        user_metadata: { firstName: "New", lastName: "User", role: USER_ROLES.SIGNER },
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const mockSession = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_at: 1234567890,
      };

      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as never);

      vi.mocked(mockSupabase.auth.setSession).mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      } as never);

      const result = await authService.register("New", "User", "newuser@example.com", "password123");

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
        options: {
          data: {
            firstName: "New",
            lastName: "User",
            role: USER_ROLES.SIGNER,
          },
        },
      });

      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      });

      expect(result).not.toBeNull();
      expect(result?.user.email).toBe("newuser@example.com");
      expect(result?.session.access_token).toBe("mock-access-token");
    });

    it("should return null when email confirmation is required", async () => {
      const mockUser = {
        id: "new-user-id",
        email: "newuser@example.com",
        user_metadata: { firstName: "New", lastName: "User", role: USER_ROLES.SIGNER },
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      } as never);

      const result = await authService.register("New", "User", "newuser@example.com", "password123");

      expect(result).toBeNull();
    });

    it("should throw error when registration fails", async () => {
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "User already registered", name: "AuthError", status: 409 },
      } as never);

      await expect(authService.register("Existing", "User", "existing@example.com", "password123")).rejects.toThrow(
        "Użytkownik o tym adresie e-mail już istnieje"
      );

      expect(mockSupabase.auth.signUp).toHaveBeenCalled();
    });

    it("should throw error for invalid email", async () => {
      vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid email", name: "AuthError", status: 400 },
      } as never);

      await expect(authService.register("Invalid", "User", "invalid-email", "password123")).rejects.toThrow(
        "Nieprawidłowy format adresu e-mail"
      );
    });
  });

  describe("login", () => {
    it("should login user with valid credentials", async () => {
      const mockUser = {
        id: "user-id",
        email: "user@example.com",
        user_metadata: { firstName: "Test", lastName: "User", role: USER_ROLES.SIGNER },
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const mockSession = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_at: 1234567890,
      };

      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      } as never);

      const result = await authService.login("user@example.com", "password123");

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.user.email).toBe("user@example.com");
      expect(result.session.access_token).toBe("mock-access-token");
    });

    it("should throw error for invalid credentials", async () => {
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Invalid login credentials", name: "AuthError", status: 401 },
      } as never);

      await expect(authService.login("user@example.com", "wrongpassword")).rejects.toThrow(
        "Nieprawidłowy e-mail lub hasło"
      );
    });

    it("should throw error for unconfirmed email", async () => {
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Email not confirmed", name: "AuthError", status: 400 },
      } as never);

      await expect(authService.login("unconfirmed@example.com", "password123")).rejects.toThrow(
        "E-mail nie został potwierdzony. Sprawdź swoją skrzynkę pocztową."
      );
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: null,
      } as never);

      await expect(authService.logout()).resolves.not.toThrow();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it("should throw error when logout fails", async () => {
      vi.mocked(mockSupabase.auth.signOut).mockResolvedValue({
        error: { message: "Logout failed", name: "AuthError", status: 500 },
      } as never);

      await expect(authService.logout()).rejects.toThrow("Błąd podczas wylogowywania");
    });
  });
});
