import type { APIRoute } from "astro";
import { OffersService } from "../../../../lib/services/offers.service";
import type { ApiResponse, OfferWithImagesDTO, OfferDTO } from "../../../../types";
import { updateOfferSchema } from "../../../../lib/validators/offers.validator";
import { USER_ROLES } from "../../../../types";

export const prerender = false;

/**
 * GET /api/offers/:offerId
 * Pobiera szczegóły pojedynczej oferty
 * Dostępne dla zalogowanych użytkowników
 */
export const GET: APIRoute = async ({ params, locals }) => {
  // 1. Authorization check
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany, aby zobaczyć szczegóły oferty",
      } satisfies ApiResponse),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 2. Validate offerId parameter
  const offerId = params.offerId;

  if (!offerId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Brak ID oferty",
      } satisfies ApiResponse),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    // 3. Execute business logic
    const offersService = new OffersService(locals.supabase);
    const offer = await offersService.getOfferById(offerId);

    // 4. Success response
    return new Response(
      JSON.stringify({
        data: offer,
      } satisfies ApiResponse<OfferWithImagesDTO>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // 5. Error handling
    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd podczas pobierania oferty";

    // Check if it's a "not found" error
    if (errorMessage.includes("Nie znaleziono oferty")) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: errorMessage,
        } satisfies ApiResponse),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generic error response
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
};

/**
 * PUT /api/offers/:offerId
 * Aktualizuje ofertę (pełna zastawa - wszystkie pola wymagane)
 * Dostępne tylko dla administratorów
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  // 1. Authorization check
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany, aby zaktualizować ofertę",
      } satisfies ApiResponse),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 2. Permission check - tylko admin może edytować oferty
  if (locals.user.role !== USER_ROLES.ADMIN) {
    return new Response(
      JSON.stringify({
        error: "Forbidden",
        message: "Nie masz uprawnień do edycji ofert",
      } satisfies ApiResponse),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 3. Validate offerId parameter
  const offerId = params.offerId;

  if (!offerId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Brak ID oferty",
      } satisfies ApiResponse),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    // 4. Parse request body
    const body = await request.json();

    // 5. Validate input with Zod schema
    const validationResult = updateOfferSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Dane formularza są nieprawidłowe",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        } satisfies ApiResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 6. Execute business logic
    const offersService = new OffersService(locals.supabase);
    const updatedOffer = await offersService.updateOffer(offerId, validationResult.data);

    // 7. Success response
    return new Response(
      JSON.stringify({
        data: updatedOffer,
        message: "Oferta została zaktualizowana pomyślnie",
      } satisfies ApiResponse<OfferDTO>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // 8. Error handling
    const errorMessage = error instanceof Error ? error.message : "Nieznany błąd podczas aktualizacji oferty";

    // Check if it's a "not found" error
    if (errorMessage.includes("Nie znaleziono oferty")) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: errorMessage,
        } satisfies ApiResponse),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generic error response
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
};
