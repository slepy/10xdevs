import type { APIRoute } from "astro";
import { z } from "zod";
import { InvestmentsService } from "../../../../lib/services/investments.service";
import type { ApiResponse, InvestmentDTO, ValidationError } from "../../../../types";
import { cancelInvestmentSchema } from "../../../../lib/validators/investments.validator";

export const prerender = false;

/**
 * Schema walidacji dla parametru investmentId
 */
const investmentIdSchema = z.string().uuid("Nieprawidłowy format ID inwestycji");

/**
 * PUT /api/investments/:investmentId/cancel
 * Anuluje inwestycję (tylko właściciel i tylko ze statusem pending)
 * Dostęp: zalogowany użytkownik (właściciel inwestycji)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Sprawdzenie autoryzacji
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany, aby anulować inwestycję",
        } satisfies ApiResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 2. Walidacja investmentId z parametrów URL
    const idValidationResult = investmentIdSchema.safeParse(params.investmentId);

    if (!idValidationResult.success) {
      const validationErrors: ValidationError[] = idValidationResult.error.errors.map((error) => ({
        field: "investmentId",
        message: error.message,
        code: error.code,
      }));

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Nieprawidłowy format ID inwestycji",
          details: validationErrors,
        } satisfies ApiResponse & { details: ValidationError[] }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 3. Parsowanie i walidacja danych z body
    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Nieprawidłowy format JSON",
        } satisfies ApiResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const bodyValidationResult = cancelInvestmentSchema.safeParse(requestData);

    if (!bodyValidationResult.success) {
      const validationErrors: ValidationError[] = bodyValidationResult.error.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
        code: error.code,
      }));

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Błąd walidacji danych",
          details: validationErrors,
        } satisfies ApiResponse & { details: ValidationError[] }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 4. Sprawdzenie dostępności Supabase client
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "Błąd konfiguracji serwera",
        } satisfies ApiResponse),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 5. Anulowanie inwestycji (service sprawdzi czy użytkownik jest właścicielem)
    const investmentsService = new InvestmentsService(supabase);
    const cancelledInvestment = await investmentsService.cancelInvestment(
      idValidationResult.data,
      user.id,
      bodyValidationResult.data
    );

    // 6. Zwrócenie sukcesu
    return new Response(
      JSON.stringify({
        data: cancelledInvestment,
      } satisfies ApiResponse<InvestmentDTO>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // 7. Obsługa błędów
    // eslint-disable-next-line no-console
    console.error("Cancel investment API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd serwera";

    // Określenie kodu statusu na podstawie komunikatu błędu
    let statusCode = 500;

    if (errorMessage.includes("nie istnieje") || errorMessage.includes("Nie znaleziono")) {
      statusCode = 404;
    } else if (
      errorMessage.includes("nie masz uprawnień") ||
      errorMessage.includes("Brak dostępu") ||
      errorMessage.includes("możesz anulować tylko własne") ||
      errorMessage.includes("Nie można anulować") ||
      errorMessage.includes("status")
    ) {
      statusCode = 403;
    }

    return new Response(
      JSON.stringify({
        error: statusCode === 404 ? "Not Found" : statusCode === 403 ? "Forbidden" : "Internal server error",
        message: errorMessage,
      } satisfies ApiResponse),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
