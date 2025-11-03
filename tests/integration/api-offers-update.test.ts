import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT } from "../../src/pages/api/offers/[offerId]/index";
import type { APIContext } from "astro";
import { USER_ROLES } from "../../src/types";

describe("PUT /api/offers/:offerId", () => {
  let mockContext: Partial<APIContext>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    mockContext = {
      params: { offerId: "offer-123" },
      request: new Request("http://localhost/api/offers/offer-123", {
        method: "PUT",
        body: JSON.stringify({}),
      }),
      locals: {
        user: null,
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 when user is not admin", async () => {
    mockContext = {
      params: { offerId: "offer-123" },
      request: new Request("http://localhost/api/offers/offer-123", {
        method: "PUT",
        body: JSON.stringify({}),
      }),
      locals: {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: USER_ROLES.SIGNER,
        },
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return 400 when offerId is missing", async () => {
    mockContext = {
      params: {}, // No offerId
      request: new Request("http://localhost/api/offers/", {
        method: "PUT",
        body: JSON.stringify({}),
      }),
      locals: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: USER_ROLES.ADMIN,
        },
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Bad Request");
  });

  it("should return 400 when validation fails - missing required fields", async () => {
    mockContext = {
      params: { offerId: "offer-123" },
      request: new Request("http://localhost/api/offers/offer-123", {
        method: "PUT",
        body: JSON.stringify({
          // Missing all required fields
        }),
      }),
      locals: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: USER_ROLES.ADMIN,
        },
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation Error");
    expect(data.details).toBeDefined();
    expect(Array.isArray(data.details)).toBe(true);
  });

  it("should return 400 when validation fails - invalid data types", async () => {
    mockContext = {
      params: { offerId: "offer-123" },
      request: new Request("http://localhost/api/offers/offer-123", {
        method: "PUT",
        body: JSON.stringify({
          name: "Valid Name",
          description: "Valid Description",
          target_amount: "not-a-number", // Invalid type
          minimum_investment: 1000,
          end_at: "2025-12-31T23:59:59Z",
        }),
      }),
      locals: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: USER_ROLES.ADMIN,
        },
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation Error");
  });

  it("should return 400 when minimum_investment > target_amount", async () => {
    mockContext = {
      params: { offerId: "offer-123" },
      request: new Request("http://localhost/api/offers/offer-123", {
        method: "PUT",
        body: JSON.stringify({
          name: "Valid Name",
          description: "Valid Description",
          target_amount: 1000,
          minimum_investment: 5000, // Greater than target_amount
          end_at: "2025-12-31T23:59:59Z",
        }),
      }),
      locals: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: USER_ROLES.ADMIN,
        },
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation Error");
    expect(data.details?.some((d: any) => d.field === "minimum_investment")).toBe(true);
  });

  it("should return 400 when end_at is in the past", async () => {
    mockContext = {
      params: { offerId: "offer-123" },
      request: new Request("http://localhost/api/offers/offer-123", {
        method: "PUT",
        body: JSON.stringify({
          name: "Valid Name",
          description: "Valid Description",
          target_amount: 10000,
          minimum_investment: 1000,
          end_at: "2020-01-01T00:00:00Z", // In the past
        }),
      }),
      locals: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: USER_ROLES.ADMIN,
        },
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation Error");
    expect(data.details?.some((d: any) => d.field === "end_at")).toBe(true);
  });

  it("should return 200 when offer is successfully updated", async () => {
    const mockOffer = {
      id: "offer-123",
      name: "Updated Offer Name",
      description: "Updated Description",
      target_amount: 5000000, // 50000 PLN in satoshi
      minimum_investment: 100000, // 1000 PLN in satoshi
      end_at: "2025-12-31T23:59:59Z",
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mockUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockOffer,
        error: null,
      }),
    };

    const mockDeleteQuery = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    };

    const mockInsertQuery = {
      insert: vi.fn().mockResolvedValue({
        error: null,
      }),
    };

    const mockSupabase = {
      from: vi
        .fn()
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValueOnce(mockDeleteQuery)
        .mockReturnValueOnce(mockInsertQuery),
    };

    mockContext = {
      params: { offerId: "offer-123" },
      request: new Request("http://localhost/api/offers/offer-123", {
        method: "PUT",
        body: JSON.stringify({
          name: "Updated Offer Name",
          description: "Updated Description",
          target_amount: 50000,
          minimum_investment: 1000,
          end_at: "2025-12-31T23:59:59Z",
          images: ["https://example.com/image1.jpg"],
        }),
      }),
      locals: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: USER_ROLES.ADMIN,
        },
        supabase: mockSupabase,
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockOffer);
    expect(data.message).toBe("Oferta została zaktualizowana pomyślnie");
  });

  it("should return 404 when offer is not found", async () => {
    const mockUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue(mockUpdateQuery),
    };

    mockContext = {
      params: { offerId: "non-existent-offer" },
      request: new Request("http://localhost/api/offers/non-existent-offer", {
        method: "PUT",
        body: JSON.stringify({
          name: "Updated Offer Name",
          description: "Updated Description",
          target_amount: 50000,
          minimum_investment: 1000,
          end_at: "2025-12-31T23:59:59Z",
        }),
      }),
      locals: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: USER_ROLES.ADMIN,
        },
        supabase: mockSupabase,
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Not Found");
  });

  it("should return 500 when database update fails", async () => {
    const mockUpdateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      }),
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue(mockUpdateQuery),
    };

    mockContext = {
      params: { offerId: "offer-123" },
      request: new Request("http://localhost/api/offers/offer-123", {
        method: "PUT",
        body: JSON.stringify({
          name: "Updated Offer Name",
          description: "Updated Description",
          target_amount: 50000,
          minimum_investment: 1000,
          end_at: "2025-12-31T23:59:59Z",
        }),
      }),
      locals: {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: USER_ROLES.ADMIN,
        },
        supabase: mockSupabase,
      } as any,
    };

    const response = await PUT(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });
});
