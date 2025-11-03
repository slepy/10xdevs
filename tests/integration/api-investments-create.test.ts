import { describe, it, expect, beforeEach } from "vitest";
import { setupMswServer, handlers, server } from "../helpers/msw";
import { http, HttpResponse } from "msw";

// Setup MSW server
setupMswServer();

describe("API Integration Tests - Create Investment", () => {
  describe("POST /api/investments", () => {
    const validInvestmentData = {
      offer_id: "123e4567-e89b-12d3-a456-426614174000",
      amount: 5000,
    };

    it("should create investment successfully for authenticated user", async () => {
      server.use(
        handlers.investments.create({
          data: {
            id: "investment-123",
            user_id: "user-123",
            offer_id: validInvestmentData.offer_id,
            amount: 5000,
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            completed_at: null,
            reason: null,
            deleted_at: null,
          },
          message: "Inwestycja została utworzona pomyślnie",
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validInvestmentData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.amount).toBe(5000);
      expect(data.data.status).toBe("pending");
      expect(data.message).toBe("Inwestycja została utworzona pomyślnie");
    });

    it("should return 401 when user is not authenticated", async () => {
      server.use(
        handlers.investments.create(
          {
            error: "Unauthorized",
            message: "Musisz być zalogowany, aby dokonać inwestycji",
          },
          401
        )
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validInvestmentData),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
      expect(data.message).toBe("Musisz być zalogowany, aby dokonać inwestycji");
    });

    it("should return 400 for invalid JSON body", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Nieprawidłowy format JSON",
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Bad Request");
    });

    it("should return 400 for missing offer_id", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Podane dane są nieprawidłowe",
              details: [
                {
                  field: "offer_id",
                  message: "Required",
                },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 5000,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
      expect(data.details[0].field).toBe("offer_id");
    });

    it("should return 400 for missing amount", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Podane dane są nieprawidłowe",
              details: [
                {
                  field: "amount",
                  message: "Required",
                },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: validInvestmentData.offer_id,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(data.details[0].field).toBe("amount");
    });

    it("should return 400 for invalid offer_id format (not UUID)", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Podane dane są nieprawidłowe",
              details: [
                {
                  field: "offer_id",
                  message: "Nieprawidłowy format ID oferty",
                },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: "invalid-uuid",
          amount: 5000,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details[0].field).toBe("offer_id");
      expect(data.details[0].message).toContain("Nieprawidłowy format");
    });

    it("should return 400 for negative amount", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Podane dane są nieprawidłowe",
              details: [
                {
                  field: "amount",
                  message: "Kwota musi być większa od 0",
                },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: validInvestmentData.offer_id,
          amount: -1000,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details[0].field).toBe("amount");
      expect(data.details[0].message).toContain("większa od 0");
    });

    it("should return 400 for zero amount", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Podane dane są nieprawidłowe",
              details: [
                {
                  field: "amount",
                  message: "Kwota musi być większa od 0",
                },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: validInvestmentData.offer_id,
          amount: 0,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details[0].message).toContain("większa od 0");
    });

    it("should return 400 for amount exceeding maximum", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Validation failed",
              message: "Podane dane są nieprawidłowe",
              details: [
                {
                  field: "amount",
                  message: "Kwota jest zbyt duża",
                },
              ],
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: validInvestmentData.offer_id,
          amount: 100000001, // Powyżej limitu
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.details[0].message).toContain("zbyt duża");
    });

    it("should return 404 when offer does not exist", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Not Found",
              message: "Nie znaleziono oferty o podanym ID",
            },
            { status: 404 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: "00000000-0000-0000-0000-000000000000",
          amount: 5000,
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Not Found");
      expect(data.message).toContain("Nie znaleziono oferty");
    });

    it("should return 400 when offer is not active", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Ta oferta nie jest dostępna do inwestycji",
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validInvestmentData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("nie jest dostępna");
    });

    it("should return 400 when offer has expired", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Oferta jest już nieaktywna",
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validInvestmentData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("nieaktywna");
    });

    it("should return 400 when amount is below minimum investment", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Bad Request",
              message: "Kwota inwestycji musi wynosić co najmniej 1 000,00 zł",
            },
            { status: 400 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_id: validInvestmentData.offer_id,
          amount: 500,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain("co najmniej");
    });

    it("should return 500 when server configuration is broken", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Server configuration error",
              message: "Błąd konfiguracji serwera",
            },
            { status: 500 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validInvestmentData),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Server configuration error");
    });

    it("should return 500 when database operation fails", async () => {
      server.use(
        http.post("/api/investments", () => {
          return HttpResponse.json(
            {
              error: "Internal server error",
              message: "Wystąpił nieoczekiwany błąd serwera",
            },
            { status: 500 }
          );
        })
      );

      const response = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validInvestmentData),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal server error");
    });
  });
});
