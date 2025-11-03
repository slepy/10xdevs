import type { APIRoute } from "astro";
import { investmentQuerySchema } from "../../../lib/validators/investments.validator";
import { InvestmentsService } from "../../../lib/services/investments.service";
import type { ApiResponse, UserInvestmentListResponse, ValidationError } from "../../../types";

export const prerender = false;

/**
 * GET /api/investments/investor
 * Pobiera inwestycje zalogowanego użytkownika z paginacją i filtrowaniem
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // 1. Sprawdzenie autoryzacji
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany, aby przeglądać swoje inwestycje",
        } satisfies ApiResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 2. Parsowanie i walidacja query params
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

    // 4. Pobranie inwestycji użytkownika
    const investmentsService = new InvestmentsService(supabase);
    const result = await investmentsService.getUserInvestments(user.id, validationResult.data);

    // 5. Zwrócenie sukcesu
    return new Response(JSON.stringify(result satisfies UserInvestmentListResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // 6. Obsługa błędów
    // eslint-disable-next-line no-console
    console.error("Get user investments API error:", error);

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
