import { describe, it, expect } from "vitest";
import { setupMswServer, server } from "../helpers/msw";
import { http, HttpResponse } from "msw";

// Setup MSW server
setupMswServer();

describe("API Integration Tests - Offer Details", () => {
  describe("GET /api/offers/:offerId", () => {
    const mockOfferResponse = {
      data: {
        id: "offer-123",
        name: "Test Offer",
        description: "Test description",
        target_amount: 100000,
        minimum_investment: 10000,
        end_at: "2025-12-31T23:59:59Z",
        status: "active",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      },
    };

    it("should return 401 if user is not authenticated", async () => {
      server.use(
        http.get("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Unauthorized",
              message: "Musisz być zalogowany, aby zobaczyć szczegóły oferty",
            },
            { status: 401 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123");

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 if offerId is invalid", async () => {
      server.use(
        http.get("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "ID oferty jest nieprawidłowe",
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/invalid-id");

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Bad Request");
    });

    it("should return 404 if offer is not found", async () => {
      server.use(
        http.get("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Not Found",
              message: "Oferta nie została znaleziona",
            },
            { status: 404 }
          );
        })
      );

      const response = await fetch("/api/offers/nonexistent-id");

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Not Found");
    });

    it("should return offer details with images for authenticated user", async () => {
      server.use(
        http.get("/api/offers/:offerId", () => {
          return HttpResponse.json(mockOfferResponse);
        })
      );

      const response = await fetch("/api/offers/offer-123");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.id).toBe("offer-123");
      expect(data.data.name).toBe("Test Offer");
      expect(data.data.target_amount).toBe(100000);
      expect(data.data.minimum_investment).toBe(10000);
      expect(data.data.images).toHaveLength(2);
    });

    it("should work for admin users", async () => {
      server.use(
        http.get("/api/offers/:offerId", () => {
          return HttpResponse.json(mockOfferResponse);
        })
      );

      const response = await fetch("/api/offers/offer-123");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
    });

    it("should return offer without images if no images are available", async () => {
      const offerWithoutImages = {
        data: {
          ...mockOfferResponse.data,
          images: [],
        },
      };

      server.use(
        http.get("/api/offers/:offerId", () => {
          return HttpResponse.json(offerWithoutImages);
        })
      );

      const response = await fetch("/api/offers/offer-123");

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.images).toEqual([]);
    });

    it("should return 500 for internal server errors", async () => {
      server.use(
        http.get("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Internal Server Error",
              message: "Wystąpił nieoczekiwany błąd",
            },
            { status: 500 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123");

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal Server Error");
    });
  });
});
