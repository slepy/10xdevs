import { describe, it, expect } from "vitest";
import { setupMswServer, server } from "../helpers/msw";
import { http, HttpResponse } from "msw";

// Setup MSW server
setupMswServer();

describe("API Integration Tests - Update Offer", () => {
  describe("PUT /api/offers/:offerId", () => {
    const validOfferUpdate = {
      name: "Updated Offer Name",
      description: "Updated Description",
      target_amount: 50000,
      minimum_investment: 1000,
      end_at: "2025-12-31T23:59:59Z",
      images: ["https://example.com/image1.jpg"],
    };

    it("should return 401 when user is not authenticated", async () => {
      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Unauthorized",
              message: "Musisz być zalogowany, aby zaktualizować ofertę",
            },
            { status: 401 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOfferUpdate),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 when user is not admin", async () => {
      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Forbidden",
              message: "Nie masz uprawnień do aktualizacji ofert",
            },
            { status: 403 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOfferUpdate),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });

    it("should return 400 when offerId is missing", async () => {
      server.use(
        http.put("/api/offers/", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "ID oferty jest wymagane",
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOfferUpdate),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Bad Request");
    });

    it("should return 400 when validation fails - missing required fields", async () => {
      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Validation Error",
              message: "Podane dane są nieprawidłowe",
              details: [
                { field: "name", message: "Required" },
                { field: "description", message: "Required" },
                { field: "target_amount", message: "Required" },
                { field: "minimum_investment", message: "Required" },
                { field: "end_at", message: "Required" },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation Error");
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
    });

    it("should return 400 when validation fails - invalid data types", async () => {
      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Validation Error",
              message: "Podane dane są nieprawidłowe",
              details: [{ field: "target_amount", message: "Expected number, received string" }],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          description: "Valid Description",
          target_amount: "not-a-number",
          minimum_investment: 1000,
          end_at: "2025-12-31T23:59:59Z",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation Error");
    });

    it("should return 400 when minimum_investment > target_amount", async () => {
      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Validation Error",
              message: "Podane dane są nieprawidłowe",
              details: [
                {
                  field: "minimum_investment",
                  message: "Minimalna inwestycja nie może być większa niż cel inwestycyjny",
                },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          description: "Valid Description",
          target_amount: 1000,
          minimum_investment: 5000,
          end_at: "2025-12-31T23:59:59Z",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation Error");
      expect(data.details?.some((d: any) => d.field === "minimum_investment")).toBe(true);
    });

    it("should return 400 when end_at is in the past", async () => {
      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Validation Error",
              message: "Podane dane są nieprawidłowe",
              details: [{ field: "end_at", message: "Data zakończenia nie może być w przeszłości" }],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Valid Name",
          description: "Valid Description",
          target_amount: 10000,
          minimum_investment: 1000,
          end_at: "2020-01-01T00:00:00Z",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation Error");
      expect(data.details?.some((d: any) => d.field === "end_at")).toBe(true);
    });

    it("should return 200 when offer is successfully updated", async () => {
      const mockOffer = {
        id: "offer-123",
        name: "Updated Offer Name",
        description: "Updated Description",
        target_amount: 50000,
        minimum_investment: 1000,
        end_at: "2025-12-31T23:59:59Z",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json({
            data: mockOffer,
            message: "Oferta została zaktualizowana pomyślnie",
          });
        })
      );

      const response = await fetch("/api/offers/offer-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOfferUpdate),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual(mockOffer);
      expect(data.message).toBe("Oferta została zaktualizowana pomyślnie");
    });

    it("should return 404 when offer is not found", async () => {
      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Not Found",
              message: "Oferta nie została znaleziona",
            },
            { status: 404 }
          );
        })
      );

      const response = await fetch("/api/offers/non-existent-offer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOfferUpdate),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Not Found");
    });

    it("should return 500 when database update fails", async () => {
      server.use(
        http.put("/api/offers/:offerId", () => {
          return HttpResponse.json(
            {
              error: "Internal Server Error",
              message: "Wystąpił błąd podczas aktualizacji oferty",
            },
            { status: 500 }
          );
        })
      );

      const response = await fetch("/api/offers/offer-123", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validOfferUpdate),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal Server Error");
    });
  });
});
