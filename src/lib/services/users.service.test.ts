import { describe, it, expect, vi, beforeEach } from "vitest";
import { UsersService } from "./users.service";
import { USER_ROLES } from "@/types";
import { supabaseAdminClient } from "../../db/supabase.client";

// Mock the Supabase admin client
vi.mock("../../db/supabase.client", () => ({
  supabaseAdminClient: {
    auth: {
      admin: {
        getUserById: vi.fn(),
        listUsers: vi.fn(),
      },
    },
  },
}));

describe("UsersService", () => {
  let usersService: UsersService;

  beforeEach(() => {
    usersService = new UsersService();
    vi.clearAllMocks();
  });

  describe("isAdmin", () => {
    it("should return true for admin users", async () => {
      const mockAdminUser = {
        id: "admin-id",
        email: "admin@example.com",
        user_metadata: { role: USER_ROLES.ADMIN },
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(supabaseAdminClient.auth.admin.getUserById).mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      } as never);

      const result = await usersService.isAdmin("admin-id");

      expect(result).toBe(true);
      expect(supabaseAdminClient.auth.admin.getUserById).toHaveBeenCalledWith("admin-id");
    });

    it("should return false for non-admin users", async () => {
      const mockSignerUser = {
        id: "signer-id",
        email: "signer@example.com",
        user_metadata: { role: USER_ROLES.SIGNER },
        created_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(supabaseAdminClient.auth.admin.getUserById).mockResolvedValue({
        data: { user: mockSignerUser },
        error: null,
      } as never);

      const result = await usersService.isAdmin("signer-id");

      expect(result).toBe(false);
    });

    it("should return false when user not found", async () => {
      vi.mocked(supabaseAdminClient.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: { message: "User not found", name: "AuthError", status: 404 },
      } as never);

      const result = await usersService.isAdmin("nonexistent-id");

      expect(result).toBe(false);
    });

    it("should return false when an error occurs", async () => {
      vi.mocked(supabaseAdminClient.auth.admin.getUserById).mockRejectedValue(new Error("Database error"));

      const result = await usersService.isAdmin("user-id");

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

      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await usersService.listUsers({ page: 1, limit: 10 });

      expect(supabaseAdminClient.auth.admin.listUsers).toHaveBeenCalledWith({
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

      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await usersService.listUsers({ page: 1, limit: 10, filter: "admin" });

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

      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await usersService.listUsers({ page: 1, limit: 10, filter: "JOHN" });

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

      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await usersService.listUsers({ page: 1, limit: 10, sort: "email:asc" });

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

      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await usersService.listUsers({ page: 1, limit: 10, sort: "email:desc" });

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

      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await usersService.listUsers({ page: 1, limit: 10, sort: "created_at:asc" });

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

      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await usersService.listUsers({ page: 1, limit: 150 });

      expect(supabaseAdminClient.auth.admin.listUsers).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
      });
      expect(result.pagination.limit).toBe(100);
    });

    it("should throw error when Supabase API fails", async () => {
      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: [], aud: "authenticated" },
        error: { message: "API Error", name: "AuthError", status: 500 },
      } as never);

      await expect(usersService.listUsers({ page: 1, limit: 10 })).rejects.toThrow(
        "Failed to retrieve users: Error fetching users: API Error"
      );
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

      vi.mocked(supabaseAdminClient.auth.admin.listUsers).mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      } as never);

      const result = await usersService.listUsers({ page: 1, limit: 10, filter: "admin", sort: "created_at:asc" });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].created_at).toBe("2024-01-01T00:00:00Z");
      expect(result.data[1].created_at).toBe("2024-01-02T00:00:00Z");
    });
  });
});
