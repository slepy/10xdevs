import type { APIContext } from "astro";
import { offerQuerySchema } from "../../../lib/validators/offer.validators";
import { OffersService } from "../../../lib/services/offers.service";

export const prerender = false;

export async function GET(context: APIContext) {
  const { searchParams } = context.url;
  const query = Object.fromEntries(searchParams.entries());

  const validationResult = offerQuerySchema.safeParse(query);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Invalid query parameters.",
        details: validationResult.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const queryParams = validationResult.data;
  const offersService = new OffersService(context.locals.supabase);

  try {
    const result = await offersService.getAvailableOffers(queryParams);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "An unexpected error occurred.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
