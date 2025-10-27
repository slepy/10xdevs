import type { APIRoute } from "astro";
import { listUsersQuerySchema } from "../../../lib/validators/users.validator";
import type { UserListResponse, ApiErrorResponse } from "../../../types";
import { AuthService } from "../../../lib/services/auth.service";
import { USER_ROLES } from "../../../types";

export const prerender = false;

/**
 * GET /api/users - Pobiera spaginowaną listę wszystkich użytkowników
 * Dostęp tylko dla administratorów
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Musisz być zalogowany, aby uzyskać dostęp do tego zasobu",
          statusCode: 401,
        } as ApiErrorResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 2. Sprawdzenie uprawnień (tylko admin)
    if (locals.user.role !== USER_ROLES.ADMIN) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Nie masz uprawnień do dostępu do tego zasobu",
          statusCode: 403,
        } as ApiErrorResponse),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 3. Pobranie i walidacja parametrów zapytania
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      filter: url.searchParams.get("filter") || undefined,
    };

    const validationResult = listUsersQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Parametry zapytania są nieprawidłowe",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
          statusCode: 400,
        } as ApiErrorResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 4. Pobranie klienta Supabase z locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "Błąd konfiguracji serwera",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 5. Wykonanie logiki biznesowej przez serwis
    const authService = new AuthService(supabase);
    const result = await authService.listUsers(validationResult.data);

    // 6. Zwrócenie odpowiedzi sukcesu
    const response: UserListResponse = {
      data: result.data,
      pagination: result.pagination,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // 7. Obsługa błędów
    // eslint-disable-next-line no-console
    console.error("List users API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd serwera";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
        statusCode: 500,
      } as ApiErrorResponse),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
