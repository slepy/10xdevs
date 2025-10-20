import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.client";

import type { UserRole } from "../types";
import { USER_ROLES } from "../types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create server Supabase client (cookie handling moved to db/supabase.client.ts)
  const supabase = createSupabaseServerClient(context);

  // Dodaj klienta Supabase do locals
  context.locals.supabase = supabase;

  try {
    // Pobierz session z cookies
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (session?.user && !error) {
      // Dodaj podstawowe informacje o użytkowniku do locals
      context.locals.user = {
        id: session.user.id,
        email: session.user.email || "",
        firstName:
          (session.user.user_metadata?.firstName as string) || (session.user.user_metadata?.first_name as string) || "",
        lastName:
          (session.user.user_metadata?.lastName as string) || (session.user.user_metadata?.last_name as string) || "",
        role: (session.user.user_metadata?.role as UserRole) || USER_ROLES.SIGNER,
      };
    }
  } catch {
    // Błąd podczas pobierania session - użytkownik pozostaje niezalogowany
  }

  return next();
});
