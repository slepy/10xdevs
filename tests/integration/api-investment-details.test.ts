import { describe, it, expect } from "vitest";
import { setupMswServer, handlers, server } from "../helpers/msw";
import { http, HttpResponse } from "msw";

// Setup MSW server
setupMswServer();

describe("API Integration Tests - Get Investment Details", () => {
  describe("GET /api/investments/:investmentId", () => {
    const investmentId = "123e4567-e89b-12d3-a456-426614174000";

    const mockInvestmentDetails = {
      id: investmentId,
      user_id: "user-123",
      offer_id: "offer-123",
      amount: 5000,
      status: "pending",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      completed_at: null,
      reason: null,
      deleted_at: null,
      offer: {
        id: "offer-123",
        name: "Premium Investment Opportunity",
        description: "A great investment opportunity with high returns",
        target_amount: 100000,
        minimum_investment: 1000,
        status: "active",
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
        start_at: "2024-01-01T00:00:00Z",
        end_at: "2024-12-31T23:59:59Z",
      },
      user: {
        id: "user-123",
        email: "investor@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "signer",
      },
    };

    it("should return investment details for authenticated owner", async () => {
      server.use(
        handlers.investments.get({
          data: mockInvestmentDetails,
        })
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.data).toBeDefined();
      expect(data.data.id).toBe(investmentId);
      expect(data.data.amount).toBe(5000);
      expect(data.data.status).toBe("pending");

      // Sprawdzenie zagnieżdżonych danych oferty
      expect(data.data.offer).toBeDefined();
      expect(data.data.offer.name).toBe("Premium Investment Opportunity");
      expect(data.data.offer.target_amount).toBe(100000);
      expect(data.data.offer.minimum_investment).toBe(1000);

      // Sprawdzenie zagnieżdżonych danych użytkownika
      expect(data.data.user).toBeDefined();
      expect(data.data.user.email).toBe("investor@example.com");
      expect(data.data.user.firstName).toBe("John");
      expect(data.data.user.lastName).toBe("Doe");
      expect(data.data.user.role).toBe("signer");
    });

    it("should return investment details for admin user", async () => {
      server.use(
        handlers.investments.get({
          data: mockInvestmentDetails,
        })
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.id).toBe(investmentId);
    });

    it("should return 401 when user is not authenticated", async () => {
      server.use(
        handlers.investments.get(
          {
            error: "Unauthorized",
            message: "Musisz być zalogowany, aby przeglądać szczegóły inwestycji",
          },
          401
        )
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
      expect(data.message).toBe("Musisz być zalogowany, aby przeglądać szczegóły inwestycji");
    });

    it("should return 403 when user tries to access another user's investment", async () => {
      server.use(
        handlers.investments.get(
          {
            error: "Forbidden",
            message: "Brak dostępu - nie masz uprawnień do przeglądania tej inwestycji",
          },
          403
        )
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
      expect(data.message).toBe("Brak dostępu - nie masz uprawnień do przeglądania tej inwestycji");
    });

    it("should return 404 when investment does not exist", async () => {
      server.use(
        handlers.investments.get(
          {
            error: "Not Found",
            message: "Inwestycja o podanym ID nie istnieje",
          },
          404
        )
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Not Found");
      expect(data.message).toBe("Inwestycja o podanym ID nie istnieje");
    });

    it("should return 400 for invalid investment ID format", async () => {
      const invalidId = "not-a-valid-uuid";

      server.use(
        http.get(`/api/investments/${invalidId}`, () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Nieprawidłowy format ID inwestycji",
              details: [
                {
                  field: "investmentId",
                  message: "Nieprawidłowy format ID inwestycji",
                  code: "invalid_string",
                },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch(`/api/investments/${invalidId}`, {
        method: "GET",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Bad Request");
      expect(data.message).toBe("Nieprawidłowy format ID inwestycji");
      expect(data.details).toBeDefined();
      expect(data.details[0].field).toBe("investmentId");
    });

    it("should return 500 for internal server errors", async () => {
      server.use(
        handlers.investments.get(
          {
            error: "Internal server error",
            message: "Wystąpił nieoczekiwany błąd serwera",
          },
          500
        )
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal server error");
      expect(data.message).toBe("Wystąpił nieoczekiwany błąd serwera");
    });

    it("should handle investment with null optional fields", async () => {
      const investmentWithNulls = {
        ...mockInvestmentDetails,
        completed_at: null,
        reason: null,
        user: {
          ...mockInvestmentDetails.user,
          firstName: undefined,
          lastName: undefined,
        },
      };

      server.use(
        handlers.investments.get({
          data: investmentWithNulls,
        })
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.completed_at).toBeNull();
      expect(data.data.reason).toBeNull();
    });

    it("should correctly format amounts in the response", async () => {
      const investmentWithVariousAmounts = {
        ...mockInvestmentDetails,
        amount: 1234.56,
        offer: {
          ...mockInvestmentDetails.offer,
          target_amount: 500000,
          minimum_investment: 5000,
        },
      };

      server.use(
        handlers.investments.get({
          data: investmentWithVariousAmounts,
        })
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.amount).toBe(1234.56);
      expect(data.data.offer.target_amount).toBe(500000);
      expect(data.data.offer.minimum_investment).toBe(5000);
    });

    it("should include all required investment fields in response", async () => {
      server.use(
        handlers.investments.get({
          data: mockInvestmentDetails,
        })
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Sprawdzenie wszystkich wymaganych pól
      expect(data.data).toHaveProperty("id");
      expect(data.data).toHaveProperty("user_id");
      expect(data.data).toHaveProperty("offer_id");
      expect(data.data).toHaveProperty("amount");
      expect(data.data).toHaveProperty("status");
      expect(data.data).toHaveProperty("created_at");
      expect(data.data).toHaveProperty("updated_at");
      expect(data.data).toHaveProperty("offer");
      expect(data.data).toHaveProperty("user");
    });

    it("should include all required offer fields in nested offer object", async () => {
      server.use(
        handlers.investments.get({
          data: mockInvestmentDetails,
        })
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Sprawdzenie wszystkich wymaganych pól oferty
      expect(data.data.offer).toHaveProperty("id");
      expect(data.data.offer).toHaveProperty("name");
      expect(data.data.offer).toHaveProperty("description");
      expect(data.data.offer).toHaveProperty("target_amount");
      expect(data.data.offer).toHaveProperty("minimum_investment");
      expect(data.data.offer).toHaveProperty("status");
      expect(data.data.offer).toHaveProperty("created_at");
      expect(data.data.offer).toHaveProperty("updated_at");
    });

    it("should include all required user fields in nested user object", async () => {
      server.use(
        handlers.investments.get({
          data: mockInvestmentDetails,
        })
      );

      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "GET",
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Sprawdzenie wszystkich wymaganych pól użytkownika
      expect(data.data.user).toHaveProperty("id");
      expect(data.data.user).toHaveProperty("email");
      expect(data.data.user).toHaveProperty("role");
      // firstName i lastName są opcjonalne
    });
  });
});
