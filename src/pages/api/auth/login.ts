import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/validators/auth.validator";
import type { LoginResponse, ApiResponse } from "../../../types";
import { AuthService } from "../../../lib/services/auth.service";
import { withFeatureFlag } from "../../../features";

export const prerender = false;

export const POST: APIRoute = withFeatureFlag("auth", async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Podane dane są nieprawidłowe",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        } as ApiResponse),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, password } = validationResult.data;

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
    const result = await authService.login(email, password);

    // Prepare response
    const response: LoginResponse = {
      data: {
        user: result.user,
        session: result.session,
      },
      message: "Logowanie zakończone pomyślnie",
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
    console.error("Login API error:", error);

    // Handle business logic errors
    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd serwera";

    return new Response(
      JSON.stringify({
        error: "Authentication failed",
        message: errorMessage,
      } as ApiResponse),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});
