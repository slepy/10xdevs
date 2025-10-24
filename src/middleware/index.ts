import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.client";
import { canAccessPath } from "../lib/auth/roles";
import { buildRedirectUrl } from "../lib/auth/redirects";

import type { UserRole } from "../types";
import { USER_ROLES } from "../types";

/**
 * Define route patterns that require specific authentication states
 */
const ROUTE_PATTERNS = {
  // Admin routes - require admin role
  admin: /^\/admin/,
  // Authenticated routes - require any logged-in user
  authenticated: /^\/(dashboard|investments|profile|offers)/,
  // Anonymous routes - only for non-logged-in users
  anonymous: /^\/(login|register|forgot-password)/,
  // API routes - handled separately, no automatic redirects
  api: /^\/api\//,
} as const;

/**
 * Check if path matches any of the defined route patterns
 */
function matchesPattern(path: string, pattern: RegExp): boolean {
  return pattern.test(path);
}

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

      // Dodaj helpery do sprawdzania stanu autoryzacji
      context.locals.isAuthenticated = true;
      context.locals.isAdmin = context.locals.user.role === USER_ROLES.ADMIN;
    } else {
      // Użytkownik niezalogowany
      context.locals.isAuthenticated = false;
      context.locals.isAdmin = false;
    }
  } catch {
    // Błąd podczas pobierania session - użytkownik pozostaje niezalogowany
    context.locals.isAuthenticated = false;
    context.locals.isAdmin = false;
  }

  // Get current path
  const path = context.url.pathname;

  // Skip protection for API routes (they handle auth themselves)
  if (matchesPattern(path, ROUTE_PATTERNS.api)) {
    return next();
  }

  // Skip protection for static assets
  if (path.startsWith("/_") || path.includes(".")) {
    return next();
  }

  const user = context.locals.user;

  // Redirect logged-in users from homepage to offers or admin
  if (path === "/" && user) {
    const redirectPath = user.role === USER_ROLES.ADMIN ? "/admin" : "/offers";
    return context.redirect(redirectPath);
  }

  // Protect admin routes - require admin role
  if (matchesPattern(path, ROUTE_PATTERNS.admin)) {
    if (!user) {
      // Not logged in - redirect to login with return path
      return context.redirect(buildRedirectUrl("/login", path));
    }
    if (user.role !== USER_ROLES.ADMIN) {
      // Logged in but not admin - redirect to unauthorized page
      return context.redirect("/unauthorized");
    }
  }

  // Protect authenticated routes - require any logged-in user
  if (matchesPattern(path, ROUTE_PATTERNS.authenticated)) {
    if (!user) {
      // Not logged in - redirect to login with return path
      return context.redirect(buildRedirectUrl("/login", path));
    }
  }

  // Protect anonymous routes - redirect logged-in users away
  if (matchesPattern(path, ROUTE_PATTERNS.anonymous)) {
    if (user) {
      // Already logged in - redirect to appropriate dashboard
      const redirectPath = user.role === USER_ROLES.ADMIN ? "/admin" : "/dashboard";
      return context.redirect(redirectPath);
    }
  }

  // Use general path access check as fallback
  if (!canAccessPath(user, path)) {
    if (!user) {
      return context.redirect(buildRedirectUrl("/login", path));
    } else {
      return context.redirect("/unauthorized");
    }
  }

  return next();
});
