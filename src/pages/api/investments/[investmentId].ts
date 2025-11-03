import type { APIRoute } from "astro";
import { z } from "zod";
import { InvestmentsService } from "../../../lib/services/investments.service";
import type { ApiResponse, InvestmentDetailsDTO, ValidationError } from "../../../types";
import { USER_ROLES } from "../../../types";

export const prerender = false;

/**
 * Schema walidacji dla parametru investmentId
 */
const investmentIdSchema = z.string().uuid("Nieprawidłowy format ID inwestycji");

/**
 * GET /api/investments/:investmentId
 * Pobiera szczegółowe informacje o konkretnej inwestycji
 * Dostęp: właściciel inwestycji lub admin
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Sprawdzenie autoryzacji
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany, aby przeglądać szczegóły inwestycji",
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
    const validationResult = investmentIdSchema.safeParse(params.investmentId);

    if (!validationResult.success) {
      const validationErrors: ValidationError[] = validationResult.error.errors.map((error) => ({
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

    // 3. Sprawdzenie dostępności Supabase client
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

    // 4. Pobranie szczegółów inwestycji
    const investmentsService = new InvestmentsService(supabase);
    const investmentDetails = await investmentsService.getInvestmentDetails(
      validationResult.data,
      user.id,
      user.role === USER_ROLES.ADMIN
    );

    // 5. Zwrócenie sukcesu
    return new Response(
      JSON.stringify({
        data: investmentDetails,
      } satisfies ApiResponse<InvestmentDetailsDTO>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // 6. Obsługa błędów
    // eslint-disable-next-line no-console
    console.error("Get investment details API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd serwera";

    // Określenie kodu statusu na podstawie komunikatu błędu
    let statusCode = 500;

    if (errorMessage.includes("nie istnieje") || errorMessage.includes("Nie znaleziono")) {
      statusCode = 404;
    } else if (errorMessage.includes("nie masz uprawnień") || errorMessage.includes("Brak dostępu")) {
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
