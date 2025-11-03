import { describe, it, expect } from "vitest";
import { setupMswServer, server } from "../helpers/msw";
import { http, HttpResponse } from "msw";

// Setup MSW server
setupMswServer();

describe("API Integration Tests - Available Offers", () => {
  describe("GET /api/offers/available", () => {
    const mockOffersResponse = {
      data: [
        {
          id: "1",
          name: "Oferta testowa 1",
          description: "Opis oferty 1",
          target_amount: 100000,
          minimum_investment: 1000,
          status: "active",
          end_at: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Oferta testowa 2",
          description: "Opis oferty 2",
          target_amount: 200000,
          minimum_investment: 2000,
          status: "active",
          end_at: new Date(Date.now() + 172800000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    };

    it("should return available offers with default parameters", async () => {
      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(mockOffersResponse);
        })
      );

      const response = await fetch("/api/offers/available");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it("should handle custom pagination parameters", async () => {
      const paginatedResponse = {
        data: [mockOffersResponse.data[0]],
        pagination: {
          page: 2,
          limit: 5,
          total: 2,
          totalPages: 1,
        },
      };

      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(paginatedResponse);
        })
      );

      const response = await fetch("/api/offers/available?page=2&limit=5");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(5);
    });

    it("should handle custom sort parameter", async () => {
      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(mockOffersResponse);
        })
      );

      const response = await fetch("/api/offers/available?sort=target_amount");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("data");
    });

    it("should return 400 for invalid page parameter", async () => {
      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Invalid query parameters.",
              details: {
                page: ["Expected number, received nan"],
              },
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/available?page=invalid");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Bad Request");
      expect(data).toHaveProperty("details");
    });

    it("should return 400 for invalid limit parameter", async () => {
      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Invalid query parameters.",
              details: {
                limit: ["Number must be greater than or equal to 1"],
              },
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/available?limit=0");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Bad Request");
    });

    it("should return 400 for invalid sort parameter", async () => {
      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Invalid query parameters.",
              details: {
                sort: ["Invalid enum value"],
              },
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/available?sort=invalid_field");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Bad Request");
    });

    it("should return 400 for limit exceeding maximum", async () => {
      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Invalid query parameters.",
              details: {
                limit: ["Number must be less than or equal to 100"],
              },
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/available?limit=101");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Bad Request");
    });

    it("should return 400 for negative page number", async () => {
      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Invalid query parameters.",
              details: {
                page: ["Number must be greater than or equal to 1"],
              },
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/available?page=-1");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Bad Request");
    });

    it("should return 500 for internal server errors", async () => {
      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(
            {
              error: "Internal Server Error",
              message: "An unexpected error occurred.",
            },
            { status: 500 }
          );
        })
      );

      const response = await fetch("/api/offers/available");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal Server Error");
      expect(data.message).toBe("An unexpected error occurred.");
    });

    it("should return empty array when no offers are available", async () => {
      const emptyResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      server.use(
        http.get("/api/offers/available", () => {
          return HttpResponse.json(emptyResponse);
        })
      );

      const response = await fetch("/api/offers/available");
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });
  });
});
