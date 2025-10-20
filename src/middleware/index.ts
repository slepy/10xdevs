/* eslint-disable no-console */
import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "../db/database.types";
import type { UserRole } from "../types";
import { USER_ROLES } from "../types";

export const onRequest = defineMiddleware(async (context, next) => {
  // Log presence of Supabase env vars (do NOT log actual secret values).
  // This helps confirm whether Cloudflare Pages makes them available at runtime.
  try {
    const hasUrl = typeof import.meta.env.SUPABASE_URL === "string" && import.meta.env.SUPABASE_URL.length > 0;
    const hasKey = typeof import.meta.env.SUPABASE_KEY === "string" && import.meta.env.SUPABASE_KEY.length > 0;
    // Use console.warn so it appears in Pages/function logs; keep values masked
    const msg =
      "[middleware] SUPABASE_URL present: " +
      (hasUrl ? "yes" : "no") +
      ", SUPABASE_KEY present: " +
      (hasKey ? "yes" : "no");
    console.warn(msg);
  } catch (e) {
    // Shouldn't happen, but avoid crashing middleware if env access throws
    console.warn("[middleware] Unable to check SUPABASE_* env vars presence", e);
  }

  // Utwórz server client Supabase z obsługą cookies
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get(name: string) {
        return context.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        context.cookies.set(name, value, options);
      },
      remove(name: string, options: Record<string, unknown>) {
        context.cookies.delete(name, options);
      },
    },
  });

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
