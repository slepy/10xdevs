import type { APIRoute } from "astro";
import { z } from "zod";
import { InvestmentsService } from "../../../../lib/services/investments.service";
import type { ApiResponse, InvestmentDetailsDTO, InvestmentDTO, ValidationError } from "../../../../types";
import { USER_ROLES } from "../../../../types";
import { updateInvestmentStatusSchema } from "../../../../lib/validators/investments.validator";

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

/**
 * PUT /api/investments/:investmentId
 * Aktualizuje status inwestycji (tylko dla adminów)
 * Dostęp: tylko admin
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Sprawdzenie autoryzacji
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany, aby aktualizować status inwestycji",
        } satisfies ApiResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 2. Sprawdzenie uprawnień - tylko admin może aktualizować status
    if (user.role !== USER_ROLES.ADMIN) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Nie masz uprawnień do aktualizacji statusu inwestycji",
        } satisfies ApiResponse),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 3. Walidacja investmentId z parametrów URL
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

    // 4. Parsowanie i walidacja danych z body
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

    const bodyValidationResult = updateInvestmentStatusSchema.safeParse(requestData);

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

    // 5. Sprawdzenie dostępności Supabase client
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

    // 6. Aktualizacja statusu inwestycji
    const investmentsService = new InvestmentsService(supabase);
    const updatedInvestment = await investmentsService.updateInvestmentStatus(
      idValidationResult.data,
      bodyValidationResult.data
    );

    // 7. Zwrócenie sukcesu
    return new Response(
      JSON.stringify({
        data: updatedInvestment,
      } satisfies ApiResponse<InvestmentDTO>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // 8. Obsługa błędów
    // eslint-disable-next-line no-console
    console.error("Update investment status API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd serwera";

    // Określenie kodu statusu na podstawie komunikatu błędu
    let statusCode = 500;

    if (errorMessage.includes("nie istnieje") || errorMessage.includes("Nie znaleziono")) {
      statusCode = 404;
    } else if (
      errorMessage.includes("nie masz uprawnień") ||
      errorMessage.includes("Brak dostępu") ||
      errorMessage.includes("przejście statusu") ||
      errorMessage.includes("Nieprawidłowe przejście")
    ) {
      statusCode = 400;
    }

    return new Response(
      JSON.stringify({
        error: statusCode === 404 ? "Not Found" : statusCode === 400 ? "Bad Request" : "Internal server error",
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
