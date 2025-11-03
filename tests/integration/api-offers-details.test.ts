import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../../src/pages/api/offers/[offerId]";
import type { OfferWithImagesDTO } from "../../src/types";

describe("GET /api/offers/:offerId", () => {
  const mockOffer: OfferWithImagesDTO = {
    id: "offer-123",
    name: "Test Offer",
    description: "Test description",
    target_amount: 100000, // Backend zwraca PLN
    minimum_investment: 10000, // Backend zwraca PLN
    end_at: "2025-12-31T23:59:59Z",
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  };

  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({})),
        })),
      })),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if user is not authenticated", async () => {
    const request = new Request("http://localhost/api/offers/offer-123");
    const locals = {
      user: null,
      supabase: mockSupabase,
    };

    const response = await GET({
      request,
      params: { offerId: "offer-123" },
      locals,
    } as any);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if offerId is missing", async () => {
    const request = new Request("http://localhost/api/offers/");
    const locals = {
      user: { id: "user-123", role: "signer" },
      supabase: mockSupabase,
    };

    const response = await GET({
      request,
      params: {},
      locals,
    } as any);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Bad Request");
  });

  it("should return 404 if offer is not found", async () => {
    const mockSupabaseWithError = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "No rows returned" },
            }),
          })),
        })),
      })),
    };

    const request = new Request("http://localhost/api/offers/nonexistent-id");
    const locals = {
      user: { id: "user-123", role: "signer" },
      supabase: mockSupabaseWithError,
    };

    const response = await GET({
      request,
      params: { offerId: "nonexistent-id" },
      locals,
    } as any);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Not Found");
  });

  it("should return offer details with images for authenticated user", async () => {
    const mockSupabaseSuccess = {
      from: vi.fn((table: string) => {
        if (table === "offers") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "offer-123",
                    name: "Test Offer",
                    description: "Test description",
                    target_amount: 10000000, // Baza przechowuje w groszach: 100000 * 100
                    minimum_investment: 1000000, // Baza przechowuje w groszach: 10000 * 100
                    end_at: "2025-12-31T23:59:59Z",
                    status: "active",
                    created_at: "2025-01-01T00:00:00Z",
                    updated_at: "2025-01-01T00:00:00Z",
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        // offer_images table
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [{ url: "https://example.com/image1.jpg" }, { url: "https://example.com/image2.jpg" }],
                error: null,
              }),
            })),
          })),
        };
      }),
    };

    const request = new Request("http://localhost/api/offers/offer-123");
    const locals = {
      user: { id: "user-123", role: "signer" },
      supabase: mockSupabaseSuccess,
    };

    const response = await GET({
      request,
      params: { offerId: "offer-123" },
      locals,
    } as any);

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.data).toBeDefined();
    expect(responseData.data.id).toBe("offer-123");
    expect(responseData.data.name).toBe("Test Offer");
    expect(responseData.data.target_amount).toBe(100000); // Backend konwertuje z groszy na PLN
    expect(responseData.data.minimum_investment).toBe(10000); // Backend konwertuje z groszy na PLN
    expect(responseData.data.images).toHaveLength(2);
  });

  it("should work for admin users", async () => {
    const mockSupabaseSuccess = {
      from: vi.fn((table: string) => {
        if (table === "offers") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "offer-123",
                    name: "Test Offer",
                    description: "Test description",
                    target_amount: 10000000,
                    minimum_investment: 1000000,
                    end_at: "2025-12-31T23:59:59Z",
                    status: "active",
                    created_at: "2025-01-01T00:00:00Z",
                    updated_at: "2025-01-01T00:00:00Z",
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
        };
      }),
    };

    const request = new Request("http://localhost/api/offers/offer-123");
    const locals = {
      user: { id: "admin-123", role: "admin" },
      supabase: mockSupabaseSuccess,
    };

    const response = await GET({
      request,
      params: { offerId: "offer-123" },
      locals,
    } as any);

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.data).toBeDefined();
  });

  it("should return offer without images if images fetch fails", async () => {
    const mockSupabasePartialError = {
      from: vi.fn((table: string) => {
        if (table === "offers") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "offer-123",
                    name: "Test Offer",
                    description: "Test description",
                    target_amount: 10000000,
                    minimum_investment: 1000000,
                    end_at: "2025-12-31T23:59:59Z",
                    status: "active",
                    created_at: "2025-01-01T00:00:00Z",
                    updated_at: "2025-01-01T00:00:00Z",
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        // offer_images table returns error
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Failed to fetch images" },
              }),
            })),
          })),
        };
      }),
    };

    const request = new Request("http://localhost/api/offers/offer-123");
    const locals = {
      user: { id: "user-123", role: "signer" },
      supabase: mockSupabasePartialError,
    };

    const response = await GET({
      request,
      params: { offerId: "offer-123" },
      locals,
    } as any);

    expect(response.status).toBe(200);
    const responseData = await response.json();
    expect(responseData.data).toBeDefined();
    expect(responseData.data.images).toEqual([]);
  });
});
