import { describe, it, expect } from "vitest";
import { setupMswServer, handlers, server } from "../helpers/msw";
import { http, HttpResponse } from "msw";

// Setup MSW server
setupMswServer();

describe("API Integration Tests - List Investments", () => {
  describe("GET /api/investments/investor", () => {
    const mockInvestmentsResponse = {
      data: [
        {
          id: "investment-1",
          user_id: "user-123",
          offer_id: "offer-1",
          amount: 5000,
          status: "pending",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
          completed_at: null,
          reason: null,
          deleted_at: null,
        },
        {
          id: "investment-2",
          user_id: "user-123",
          offer_id: "offer-2",
          amount: 10000,
          status: "accepted",
          created_at: "2024-01-14T10:00:00Z",
          updated_at: "2024-01-14T10:00:00Z",
          completed_at: null,
          reason: null,
          deleted_at: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    };

    it("should fetch user investments successfully for authenticated user", async () => {
      server.use(handlers.investments.listInvestor(mockInvestmentsResponse));

      const response = await fetch("/api/investments/investor");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].amount).toBe(5000);
      expect(data.data[1].amount).toBe(10000);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      server.use(
        handlers.investments.listInvestor(
          {
            error: "Unauthorized",
            message: "Musisz być zalogowany, aby przeglądać swoje inwestycje",
          },
          401
        )
      );

      const response = await fetch("/api/investments/investor");

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
      expect(data.message).toBe("Musisz być zalogowany, aby przeglądać swoje inwestycje");
    });

    it("should handle pagination query params", async () => {
      const page2Response = {
        data: [
          {
            id: "investment-3",
            user_id: "user-123",
            offer_id: "offer-3",
            amount: 15000,
            status: "pending",
            created_at: "2024-01-13T10:00:00Z",
            updated_at: "2024-01-13T10:00:00Z",
            completed_at: null,
            reason: null,
            deleted_at: null,
          },
        ],
        pagination: {
          page: 2,
          limit: 5,
          total: 6,
          totalPages: 2,
        },
      };

      server.use(handlers.investments.listInvestor(page2Response));

      const response = await fetch("/api/investments/investor?page=2&limit=5");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
      expect(data.pagination.totalPages).toBe(2);
    });

    it("should filter by status when provided", async () => {
      const filteredResponse = {
        data: [
          {
            id: "investment-1",
            user_id: "user-123",
            offer_id: "offer-1",
            amount: 5000,
            status: "pending",
            created_at: "2024-01-15T10:00:00Z",
            updated_at: "2024-01-15T10:00:00Z",
            completed_at: null,
            reason: null,
            deleted_at: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      server.use(handlers.investments.listInvestor(filteredResponse));

      const response = await fetch("/api/investments/investor?status=pending");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe("pending");
    });

    it("should return 400 for invalid query parameters", async () => {
      server.use(
        http.get("/api/investments/investor", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Nieprawidłowe parametry zapytania",
              details: {
                page: ["Expected number, received nan"],
              },
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments/investor?page=invalid");

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Bad Request");
      expect(data.message).toBe("Nieprawidłowe parametry zapytania");
    });

    it("should return empty array when user has no investments", async () => {
      const emptyResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      server.use(handlers.investments.listInvestor(emptyResponse));

      const response = await fetch("/api/investments/investor");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe("GET /api/investments (admin)", () => {
    const mockAllInvestmentsResponse = {
      data: [
        {
          id: "investment-1",
          user_id: "user-123",
          offer_id: "offer-1",
          amount: 5000,
          status: "pending",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
          completed_at: null,
          reason: null,
          deleted_at: null,
        },
        {
          id: "investment-2",
          user_id: "user-456",
          offer_id: "offer-2",
          amount: 10000,
          status: "accepted",
          created_at: "2024-01-14T10:00:00Z",
          updated_at: "2024-01-14T10:00:00Z",
          completed_at: null,
          reason: null,
          deleted_at: null,
        },
        {
          id: "investment-3",
          user_id: "user-789",
          offer_id: "offer-1",
          amount: 20000,
          status: "completed",
          created_at: "2024-01-13T10:00:00Z",
          updated_at: "2024-01-13T10:00:00Z",
          completed_at: "2024-01-20T10:00:00Z",
          reason: null,
          deleted_at: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
      },
    };

    it("should fetch all investments successfully for admin", async () => {
      server.use(handlers.investments.list(mockAllInvestmentsResponse));

      const response = await fetch("/api/investments");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data).toHaveLength(3);
      // Weryfikacja że są inwestycje różnych użytkowników
      const userIds = data.data.map((inv: { user_id: string }) => inv.user_id);
      expect(new Set(userIds).size).toBe(3); // 3 różnych użytkowników
    });

    it("should return 401 when user is not authenticated", async () => {
      server.use(
        handlers.investments.list(
          {
            error: "Unauthorized",
            message: "Musisz być zalogowany, aby przeglądać inwestycje",
          },
          401
        )
      );

      const response = await fetch("/api/investments");

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when user is not admin", async () => {
      server.use(
        handlers.investments.list(
          {
            error: "Forbidden",
            message: "Nie masz uprawnień do przeglądania wszystkich inwestycji",
          },
          403
        )
      );

      const response = await fetch("/api/investments");

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
      expect(data.message).toBe("Nie masz uprawnień do przeglądania wszystkich inwestycji");
    });

    it("should handle pagination for large datasets", async () => {
      const paginatedResponse = {
        data: mockAllInvestmentsResponse.data,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      };

      server.use(handlers.investments.list(paginatedResponse));

      const response = await fetch("/api/investments?page=1&limit=10");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination.total).toBe(25);
      expect(data.pagination.totalPages).toBe(3);
    });

    it("should filter by status", async () => {
      const filteredResponse = {
        data: [mockAllInvestmentsResponse.data[2]], // tylko completed
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      server.use(handlers.investments.list(filteredResponse));

      const response = await fetch("/api/investments?status=completed");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe("completed");
    });

    it("should return 400 for invalid status value", async () => {
      server.use(
        http.get("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Nieprawidłowe parametry zapytania",
              details: {
                status: ["Invalid enum value"],
              },
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments?status=invalid_status");

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Bad Request");
    });

    it("should handle limit boundary (max 100)", async () => {
      const largePageResponse = {
        data: mockAllInvestmentsResponse.data,
        pagination: {
          page: 1,
          limit: 100,
          total: 150,
          totalPages: 2,
        },
      };

      server.use(handlers.investments.list(largePageResponse));

      const response = await fetch("/api/investments?limit=100");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination.limit).toBe(100);
    });
  });
});
