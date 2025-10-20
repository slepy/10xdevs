import type { APIRoute } from "astro";
import type { LogoutResponse, ApiResponse } from "../../../types";
import { AuthService } from "../../../lib/services/auth.service";
import { withFeatureFlag } from "../../../features";

export const prerender = false;

export const POST: APIRoute = withFeatureFlag("auth", async ({ locals }) => {
  try {
    // Get Supabase client from locals
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "Błąd konfiguracji serwera",
        } as ApiResponse),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Execute business logic via service
    const authService = new AuthService(supabase);
    await authService.logout();

    const response: LogoutResponse = {
      message: "Wylogowano pomyślnie",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("Logout API error:", error);

    // Handle business logic errors
    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd serwera";

    return new Response(
      JSON.stringify({
        error: "Logout failed",
        message: errorMessage,
      } as ApiResponse),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});
