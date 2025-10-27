import { describe, it, expect, beforeEach, vi } from "vitest";
import { USER_ROLES } from "@/types";

// Mock de Astro context for API routes
const createMockContext = (user?: { id: string; email: string; role: string }) => {
  const mockSupabase = {
    auth: {
      admin: {
        listUsers: vi.fn(),
      },
    },
  };

  return {
    request: new Request("http://localhost:3001/api/users"),
    locals: {
      user: user || null,
      supabase: mockSupabase,
      isAuthenticated: !!user,
      isAdmin: user?.role === USER_ROLES.ADMIN,
    },
    mockSupabase,
  };
};

// Import the API route handler
import { GET } from "../../src/pages/api/users/index";

describe("API Integration Tests - Users", () => {
  describe("GET /api/users", () => {
    it("should return 401 for unauthenticated users", async () => {
      const { request, locals } = createMockContext();

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
      expect(data.message).toContain("zalogowany");
    });

    it("should return 403 for non-admin users", async () => {
      const { request, locals } = createMockContext({
        id: "user-123",
        email: "user@example.com",
        role: USER_ROLES.SIGNER,
      });

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toBe("Forbidden");
      expect(data.message).toContain("uprawnień");
    });

    it("should return 400 for invalid query parameters (negative page)", async () => {
      const { locals, mockSupabase } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      const request = new Request("http://localhost:3001/api/users?page=-1");

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(data.message).toContain("nieprawidłowe");
    });

    it("should return 400 for invalid query parameters (limit exceeds 100)", async () => {
      const { locals } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      const request = new Request("http://localhost:3001/api/users?limit=101");

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for invalid sort parameter", async () => {
      const { locals } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      const request = new Request("http://localhost:3001/api/users?sort=invalid_field:desc");

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe("Validation failed");
    });

    it("should return users list with default pagination for admin", async () => {
      const { request, locals, mockSupabase } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

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

      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      });

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].email).toBe("user1@example.com");
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.total).toBe(2);
    });

    it("should return users with custom pagination", async () => {
      const { locals, mockSupabase } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      const request = new Request("http://localhost:3001/api/users?page=2&limit=5");

      const mockUsers = Array.from({ length: 5 }, (_, i) => ({
        id: `user-${i + 6}`,
        email: `user${i + 6}@example.com`,
        user_metadata: { firstName: `User${i + 6}`, lastName: "Test", role: USER_ROLES.SIGNER },
        created_at: "2024-01-01T00:00:00Z",
      }));

      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      });

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
      expect(mockSupabase.auth.admin.listUsers).toHaveBeenCalledWith({
        page: 2,
        perPage: 5,
      });
    });

    it("should filter users by email", async () => {
      const { locals, mockSupabase } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      const request = new Request("http://localhost:3001/api/users?filter=admin");

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

      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      });

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].email).toBe("admin@example.com");
    });

    it("should sort users by email in descending order", async () => {
      const { locals, mockSupabase } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      const request = new Request("http://localhost:3001/api/users?sort=email:desc");

      const mockUsers = [
        {
          id: "user-1",
          email: "alice@example.com",
          user_metadata: { firstName: "Alice", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          email: "zebra@example.com",
          user_metadata: { firstName: "Zebra", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-02T00:00:00Z",
        },
      ];

      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      });

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data[0].email).toBe("zebra@example.com");
      expect(data.data[1].email).toBe("alice@example.com");
    });

    it("should handle combined filter and sort", async () => {
      const { locals, mockSupabase } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      const request = new Request("http://localhost:3001/api/users?filter=test&sort=created_at:asc");

      const mockUsers = [
        {
          id: "user-1",
          email: "test1@example.com",
          user_metadata: { firstName: "Test", lastName: "One", role: USER_ROLES.SIGNER },
          created_at: "2024-01-02T00:00:00Z",
        },
        {
          id: "user-2",
          email: "test2@example.com",
          user_metadata: { firstName: "Test", lastName: "Two", role: USER_ROLES.SIGNER },
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-3",
          email: "other@example.com",
          user_metadata: { firstName: "Other", lastName: "User", role: USER_ROLES.SIGNER },
          created_at: "2024-01-03T00:00:00Z",
        },
      ];

      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockUsers, aud: "authenticated" },
        error: null,
      });

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].created_at).toBe("2024-01-01T00:00:00Z");
      expect(data.data[1].created_at).toBe("2024-01-02T00:00:00Z");
    });

    it("should return 500 when Supabase service fails", async () => {
      const { request, locals, mockSupabase } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [], aud: "authenticated" },
        error: { message: "Database connection failed", name: "AuthError", status: 500 },
      });

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe("Internal server error");
      expect(data.message).toContain("Błąd podczas pobierania użytkowników");
    });

    it("should return 500 when Supabase client is not available", async () => {
      const { request } = createMockContext({
        id: "admin-123",
        email: "admin@example.com",
        role: USER_ROLES.ADMIN,
      });

      const locals = {
        user: { id: "admin-123", email: "admin@example.com", role: USER_ROLES.ADMIN },
        supabase: null,
        isAuthenticated: true,
        isAdmin: true,
      };

      const response = await GET({ request, locals } as never);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe("Server configuration error");
      expect(data.message).toContain("konfiguracji serwera");
    });
  });
});
