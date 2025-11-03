import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = "test-anon-key";

// Mockowanie API Supabase
const server = setupServer(
  http.get(`${SUPABASE_URL}/rest/v1/offers`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const endAt = url.searchParams.get("end_at");

    // Symulacja błędu bazy danych
    if (url.searchParams.get("simulate_error") === "true") {
      return HttpResponse.json({ message: "Database connection error" }, { status: 500 });
    }

    // Zwracanie pustej listy gdy filtrujemy po status=active
    if (status === "eq.active" && endAt?.startsWith("gt.")) {
      const mockOffers = [
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
      ];

      return HttpResponse.json(mockOffers, {
        headers: {
          "Content-Range": `0-1/2`,
        },
      });
    }

    return HttpResponse.json([]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("GET /api/offers/available", () => {
  const API_URL = "http://localhost:4321/api/offers/available";

  it("should return available offers with default parameters", async () => {
    const response = await fetch(API_URL);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it("should handle custom pagination parameters", async () => {
    const response = await fetch(`${API_URL}?page=2&limit=5`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(5);
  });

  it("should handle custom sort parameter", async () => {
    const response = await fetch(`${API_URL}?sort=target_amount`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
  });

  it("should return 400 for invalid page parameter", async () => {
    const response = await fetch(`${API_URL}?page=invalid`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Bad Request");
    expect(data).toHaveProperty("details");
  });

  it("should return 400 for invalid limit parameter", async () => {
    const response = await fetch(`${API_URL}?limit=0`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });

  it("should return 400 for invalid sort parameter", async () => {
    const response = await fetch(`${API_URL}?sort=invalid_field`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });

  it("should return 400 for limit exceeding maximum", async () => {
    const response = await fetch(`${API_URL}?limit=101`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });

  it("should return 400 for negative page number", async () => {
    const response = await fetch(`${API_URL}?page=-1`);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });
});
