import type { APIRoute } from "astro";
import { createInvestmentSchema, investmentQuerySchema } from "../../../lib/validators/investments.validator";
import { InvestmentsService } from "../../../lib/services/investments.service";
import type { ApiResponse, InvestmentDTO, InvestmentListResponse, ValidationError } from "../../../types";
import { USER_ROLES } from "../../../types";

export const prerender = false;

/**
 * POST /api/investments
 * Tworzy nową inwestycję (dla zalogowanych użytkowników)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Sprawdzenie autoryzacji
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany, aby dokonać inwestycji",
        } satisfies ApiResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 2. Parsowanie danych z body
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

    // 3. Walidacja danych wejściowych
    const validationResult = createInvestmentSchema.safeParse(requestData);

    if (!validationResult.success) {
      const validationErrors: ValidationError[] = validationResult.error.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
        code: error.code,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Podane dane są nieprawidłowe",
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

    // 5. Utworzenie serwisu i nowej inwestycji
    const investmentsService = new InvestmentsService(supabase);
    const newInvestment = await investmentsService.createInvestment(validationResult.data, user.id);

    // 6. Zwrócenie sukcesu
    return new Response(
      JSON.stringify({
        data: newInvestment,
        message: "Inwestycja została utworzona pomyślnie",
      } satisfies ApiResponse<InvestmentDTO>),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // 7. Obsługa błędów
    // eslint-disable-next-line no-console
    console.error("Create investment API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd serwera";

    // Określenie kodu statusu na podstawie komunikatu błędu
    let statusCode = 500;

    if (errorMessage.includes("Nie znaleziono oferty")) {
      statusCode = 404;
    } else if (
      errorMessage.includes("nie jest dostępna") ||
      errorMessage.includes("nieaktywna") ||
      errorMessage.includes("co najmniej")
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

/**
 * GET /api/investments
 * Pobiera wszystkie inwestycje z paginacją i filtrowaniem (tylko dla adminów)
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // 1. Sprawdzenie autoryzacji
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany, aby przeglądać inwestycje",
        } satisfies ApiResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 2. Sprawdzenie uprawnień admina
    if (user.role !== USER_ROLES.ADMIN) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Nie masz uprawnień do przeglądania wszystkich inwestycji",
        } satisfies ApiResponse),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 3. Parsowanie i walidacja query params
    const { searchParams } = url;
    const query = Object.fromEntries(searchParams.entries());

    const validationResult = investmentQuerySchema.safeParse(query);

    if (!validationResult.success) {
      const validationErrors: ValidationError[] = validationResult.error.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
        code: error.code,
      }));

      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Nieprawidłowe parametry zapytania",
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

    // 5. Pobranie wszystkich inwestycji (admin)
    const investmentsService = new InvestmentsService(supabase);
    const result = await investmentsService.getAllInvestments(validationResult.data);

    // 6. Zwrócenie sukcesu
    return new Response(JSON.stringify(result satisfies InvestmentListResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // 7. Obsługa błędów
    // eslint-disable-next-line no-console
    console.error("Get all investments API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd serwera";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
      } satisfies ApiResponse),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
