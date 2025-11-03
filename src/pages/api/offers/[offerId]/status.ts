import type { APIRoute } from "astro";
import { OffersService } from "../../../../lib/services/offers.service";
import { updateOfferStatusSchema } from "../../../../lib/validators/offers.validator";
import type { ApiResponse, UpdateOfferStatusDTO, ApiErrorResponse } from "../../../../types";

/**
 * PUT /api/offers/:offerId/status
 * Endpoint do aktualizacji statusu oferty (tylko dla administratorów)
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { offerId } = params;

  if (!offerId) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Brak identyfikatora oferty",
      } satisfies ApiResponse),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Sprawdzenie autoryzacji
  const { supabase, user } = locals;

  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany aby wykonać tę akcję",
      } satisfies ApiResponse),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Sprawdzenie uprawnień administratora
  if (user.role !== "admin") {
    return new Response(
      JSON.stringify({
        error: "Forbidden",
        message: "Nie masz uprawnień do wykonania tej akcji",
      } satisfies ApiResponse),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parsowanie i walidacja danych
    const body = (await request.json()) as UpdateOfferStatusDTO;
    const validationResult = updateOfferStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Nieprawidłowe dane wejściowe",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
          statusCode: 400,
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Aktualizacja statusu oferty
    const offersService = new OffersService(supabase);
    const updatedOffer = await offersService.updateOfferStatus(offerId, validationResult.data.status);

    return new Response(
      JSON.stringify({
        data: updatedOffer,
      } satisfies ApiResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Update offer status API error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji statusu oferty",
      } satisfies ApiResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
