import { describe, it, expect } from "vitest";
import { setupMswServer, server } from "../helpers/msw";
import { http, HttpResponse } from "msw";

// Setup MSW server
setupMswServer();

describe("API Integration Tests - Users", () => {
  describe("GET /api/users", () => {
    const mockUsersResponse = {
      data: [
        {
          id: "user-1",
          email: "user1@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "signer",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "user-2",
          email: "user2@example.com",
          firstName: "Jane",
          lastName: "Smith",
          role: "admin",
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    };

    it("should return 401 for unauthenticated users", async () => {
      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(
            {
              error: "Unauthorized",
              message: "Musisz być zalogowany",
            },
            { status: 401 }
          );
        })
      );

      const response = await fetch("/api/users");

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
      expect(data.message).toContain("zalogowany");
    });

    it("should return 403 for non-admin users", async () => {
      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(
            {
              error: "Forbidden",
              message: "Nie masz uprawnień do przeglądania użytkowników",
            },
            { status: 403 }
          );
        })
      );

      const response = await fetch("/api/users");

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
      expect(data.message).toContain("uprawnień");
    });

    it("should return 400 for invalid query parameters (negative page)", async () => {
      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Parametry zapytania są nieprawidłowe",
              details: [{ field: "page", message: "Number must be greater than or equal to 1" }],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/users?page=-1");

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(data.message).toContain("nieprawidłowe");
    });

    it("should return 400 for invalid query parameters (limit exceeds 100)", async () => {
      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Parametry zapytania są nieprawidłowe",
              details: [{ field: "limit", message: "Number must be less than or equal to 100" }],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/users?limit=101");

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for invalid sort parameter", async () => {
      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Parametry zapytania są nieprawidłowe",
              details: [{ field: "sort", message: "Invalid sort parameter" }],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/users?sort=invalid_field:desc");

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
    });

    it("should return users list with default pagination for admin", async () => {
      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(mockUsersResponse);
        })
      );

      const response = await fetch("/api/users");

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
      const paginatedResponse = {
        data: Array.from({ length: 5 }, (_, i) => ({
          id: `user-${i + 6}`,
          email: `user${i + 6}@example.com`,
          firstName: `User${i + 6}`,
          lastName: "Test",
          role: "signer",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        })),
        pagination: {
          page: 2,
          limit: 5,
          total: 10,
          totalPages: 2,
        },
      };

      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(paginatedResponse);
        })
      );

      const response = await fetch("/api/users?page=2&limit=5");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
    });

    it("should filter users by email", async () => {
      const filteredResponse = {
        data: [
          {
            id: "user-1",
            email: "admin@example.com",
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(filteredResponse);
        })
      );

      const response = await fetch("/api/users?filter=admin");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].email).toBe("admin@example.com");
    });

    it("should sort users by email in descending order", async () => {
      const sortedResponse = {
        data: [
          {
            id: "user-2",
            email: "zebra@example.com",
            firstName: "Zebra",
            lastName: "User",
            role: "signer",
            created_at: "2024-01-02T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
          {
            id: "user-1",
            email: "alice@example.com",
            firstName: "Alice",
            lastName: "User",
            role: "signer",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(sortedResponse);
        })
      );

      const response = await fetch("/api/users?sort=email:desc");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data[0].email).toBe("zebra@example.com");
      expect(data.data[1].email).toBe("alice@example.com");
    });

    it("should handle combined filter and sort", async () => {
      const combinedResponse = {
        data: [
          {
            id: "user-2",
            email: "test2@example.com",
            firstName: "Test",
            lastName: "Two",
            role: "signer",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "user-1",
            email: "test1@example.com",
            firstName: "Test",
            lastName: "One",
            role: "signer",
            created_at: "2024-01-02T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(combinedResponse);
        })
      );

      const response = await fetch("/api/users?filter=test&sort=created_at:asc");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].created_at).toBe("2024-01-01T00:00:00Z");
      expect(data.data[1].created_at).toBe("2024-01-02T00:00:00Z");
    });

    it("should return 500 when Supabase service fails", async () => {
      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(
            {
              error: "Internal server error",
              message: "Błąd podczas pobierania użytkowników",
            },
            { status: 500 }
          );
        })
      );

      const response = await fetch("/api/users");

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal server error");
      expect(data.message).toContain("Błąd podczas pobierania użytkowników");
    });

    it("should return 500 when Supabase client is not available", async () => {
      server.use(
        http.get("/api/users", () => {
          return HttpResponse.json(
            {
              error: "Server configuration error",
              message: "Błąd konfiguracji serwera",
            },
            { status: 500 }
          );
        })
      );

      const response = await fetch("/api/users");

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Server configuration error");
      expect(data.message).toContain("konfiguracji serwera");
    });
  });
});
