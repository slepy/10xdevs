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

  describe("isAdmin", () => {
    it("should return true for admin users", async () => {
      const mockAdminUser = {
        id: "admin-id",
        email: "admin@example.com",
        user_metadata: { role: USER_ROLES.ADMIN },
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      } as never);

      const result = await authService.isAdmin("admin-id");

      expect(result).toBe(true);
      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith("admin-id");
    });

    it("should return false for non-admin users", async () => {
      const mockSignerUser = {
        id: "signer-id",
        email: "signer@example.com",
        user_metadata: { role: USER_ROLES.SIGNER },
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: mockSignerUser },
        error: null,
      } as never);

      const result = await authService.isAdmin("signer-id");

      expect(result).toBe(false);
    });

    it("should return false when user not found", async () => {
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: { message: "User not found", name: "AuthError", status: 404 },
      } as never);

      const result = await authService.isAdmin("nonexistent-id");

      expect(result).toBe(false);
    });

    it("should return false when an error occurs", async () => {
      vi.mocked(mockSupabase.auth.admin.getUserById).mockRejectedValue(new Error("Database error"));

      const result = await authService.isAdmin("user-id");

      expect(result).toBe(false);
    });
  });

  describe("listUsers", () => {
    it("should list users with default pagination", async () => {
      const mockUsers = [
        {
          id: "user-1",
          email: "user1@example.com",
          user_metadata: { firstName: "John", lastName: "Doe", role: USER_ROLES.SIGNER },
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          email: "user2@example.com",
          user_metadata: { firstName: "Jane", lastName: "Smith", role: USER_ROLES.ADMIN },
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await authService.listUsers({ page: 1, limit: 10 });

      expect(mockSupabase.auth.admin.listUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].email).toBe("user1@example.com");
      expect(result.data[1].email).toBe("user2@example.com");
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(2);
    });

    it("should filter users by email", async () => {
      const mockUsers = [
        {
          id: "user-1",
          email: "admin@example.com",
          user_metadata: { firstName: "Admin", lastName: "User", role: USER_ROLES.ADMIN },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          email: "user@example.com",
          user_metadata: { firstName: "Regular", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await authService.listUsers({ page: 1, limit: 10, filter: "admin" });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe("admin@example.com");
    });

    it("should filter users by first name (case insensitive)", async () => {
      const mockUsers = [
        {
          id: "user-1",
          email: "john@example.com",
          user_metadata: { firstName: "John", lastName: "Doe", role: USER_ROLES.SIGNER },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          email: "jane@example.com",
          user_metadata: { firstName: "Jane", lastName: "Smith", role: USER_ROLES.SIGNER },
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await authService.listUsers({ page: 1, limit: 10, filter: "JOHN" });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe("John");
    });

    it("should sort users by email ascending", async () => {
      const mockUsers = [
        {
          id: "user-2",
          email: "zebra@example.com",
          user_metadata: { firstName: "Zebra", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-1",
          email: "apple@example.com",
          user_metadata: { firstName: "Apple", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await authService.listUsers({ page: 1, limit: 10, sort: "email:asc" });

      expect(result.data[0].email).toBe("apple@example.com");
      expect(result.data[1].email).toBe("zebra@example.com");
    });

    it("should sort users by email descending", async () => {
      const mockUsers = [
        {
          id: "user-1",
          email: "apple@example.com",
          user_metadata: { firstName: "Apple", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          email: "zebra@example.com",
          user_metadata: { firstName: "Zebra", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await authService.listUsers({ page: 1, limit: 10, sort: "email:desc" });

      expect(result.data[0].email).toBe("zebra@example.com");
      expect(result.data[1].email).toBe("apple@example.com");
    });

    it("should sort users by created_at", async () => {
      const mockUsers = [
        {
          id: "user-2",
          email: "user2@example.com",
          user_metadata: { firstName: "User", lastName: "Two", role: USER_ROLES.SIGNER },
          created_at: "2024-01-15T00:00:00Z",
        },
        {
          id: "user-1",
          email: "user1@example.com",
          user_metadata: { firstName: "User", lastName: "One", role: USER_ROLES.SIGNER },
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await authService.listUsers({ page: 1, limit: 10, sort: "created_at:asc" });

      expect(result.data[0].created_at).toBe("2024-01-01T00:00:00Z");
      expect(result.data[1].created_at).toBe("2024-01-15T00:00:00Z");
    });

    it("should limit maximum page size to 100", async () => {
      const mockUsers = Array.from({ length: 50 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        user_metadata: { firstName: `User${i}`, lastName: "Test", role: USER_ROLES.SIGNER },
        created_at: "2024-01-01T00:00:00Z",
      }));

      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await authService.listUsers({ page: 1, limit: 150 });

      expect(mockSupabase.auth.admin.listUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
      });
      expect(result.pagination.limit).toBe(100);
    });

    it("should throw error when Supabase API fails", async () => {
      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: [], aud: "authenticated" },
        error: { message: "API Error", name: "AuthError", status: 500 },
      } as never);

      await expect(authService.listUsers({ page: 1, limit: 10 })).rejects.toThrow("Błąd podczas pobierania użytkowników");
    });

    it("should handle combined filter and sort", async () => {
      const mockUsers = [
        {
          id: "user-1",
          email: "admin1@example.com",
          user_metadata: { firstName: "Admin", lastName: "One", role: USER_ROLES.ADMIN },
          created_at: "2024-01-02T00:00:00Z",
        },
        {
          id: "user-2",
          email: "admin2@example.com",
          user_metadata: { firstName: "Admin", lastName: "Two", role: USER_ROLES.ADMIN },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-3",
          email: "user@example.com",
          user_metadata: { firstName: "Regular", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-03T00:00:00Z",
        },
      ];

      vi.mocked(mockSupabase.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await authService.listUsers({ page: 1, limit: 10, filter: "admin", sort: "created_at:asc" });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].created_at).toBe("2024-01-01T00:00:00Z");
      expect(result.data[1].created_at).toBe("2024-01-02T00:00:00Z");
    });
  });
});
