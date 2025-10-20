import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/validators/auth.validator";
import type { RegisterResponse, ApiResponse } from "../../../types";
import type { ZodIssue } from "zod";
import { AuthService } from "../../../lib/services/auth.service";
import { withFeatureFlag } from "../../../features";

export const prerender = false;

export const POST: APIRoute = withFeatureFlag("auth", async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Podane dane są nieprawidłowe",
          details: validationResult.error.errors.map((err: ZodIssue) => ({
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

    const { firstName, lastName, email, password } = validationResult.data;

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
    const result = await authService.register(firstName, lastName, email, password);

    // Email confirmation required
    if (!result) {
      return new Response(
        JSON.stringify({
          message: "Rejestracja pomyślna. Sprawdź swoją skrzynkę pocztową i potwierdź adres e-mail.",
        } as ApiResponse),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // User registered and logged in immediately
    const response: RegisterResponse = {
      data: {
        user: result.user,
        session: result.session,
      },
      message: "Rejestracja i logowanie zakończone pomyślnie",
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log error for debugging
    // eslint-disable-next-line no-console
    console.error("Registration API error:", error);

    // Handle business logic errors with specific messages
    let errorMessage = "Wystąpił nieoczekiwany błąd serwera";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // If it's a known business logic error, use 400 status code
      if (
        error.message.includes("już istnieje") ||
        error.message.includes("already") ||
        error.message.includes("Hasło musi") ||
        error.message.includes("Nieprawidłowy") ||
        error.message.includes("wyłączona") ||
        error.message.includes("disabled")
      ) {
        statusCode = 400;
      }
    }

    return new Response(
      JSON.stringify({
        error: "Registration failed",
        message: errorMessage,
      } as ApiResponse),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});
