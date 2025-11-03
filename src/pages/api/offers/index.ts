import type { APIRoute } from "astro";
import { createOfferSchema } from "../../../lib/validators/offers.validator";
import { OffersService } from "../../../lib/services/offers.service";
import type { ApiResponse, OfferDTO, ValidationError, ApiErrorResponse } from "../../../types";
import { USER_ROLES } from "../../../types";
import { withFeatureFlag } from "../../../features";

export const prerender = false;

/**
 * GET /api/offers - Pobiera wszystkie oferty (tylko dla administratorów)
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // 3. Pobranie klienta Supabase z locals
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

    // 4. Wykonanie logiki biznesowej przez serwis
    const offersService = new OffersService(supabase);
    const offers = await offersService.getOffers();

    // 5. Zwrócenie odpowiedzi sukcesu
    return new Response(
      JSON.stringify({
        data: offers,
      } satisfies ApiResponse<OfferDTO[]>),
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
    console.error("List offers API error:", error);

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

/**
 * POST /api/offers
 * Tworzy nową ofertę inwestycyjną (tylko dla administratorów)
 */
export const POST: APIRoute = withFeatureFlag("offers-create", async ({ request, locals }) => {
  try {
    // 1. Sprawdzenie autoryzacji
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Wymagana autoryzacja",
        } satisfies ApiResponse),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 2. Sprawdzenie uprawnień administratora
    if (!user.role || user.role !== USER_ROLES.ADMIN) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Brak uprawnień administratora",
        } satisfies ApiResponse),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 3. Parsowanie danych z body
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

    // 4. Walidacja danych wejściowych
    const validationResult = createOfferSchema.safeParse(requestData);

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

    // 5. Utworzenie serwisu i nowej oferty
    const offersService = new OffersService(locals.supabase);
    const newOffer = await offersService.createOffer(validationResult.data);

    // 6. Zwrócenie sukcesu
    return new Response(
      JSON.stringify({
        data: newOffer,
        message: "Oferta została utworzona pomyślnie",
      } satisfies ApiResponse<OfferDTO>),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // 7. Obsługa błędów
    // TODO: Replace with a proper logging utility if needed

    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd serwera";

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
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
});
