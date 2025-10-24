import type { AstroGlobal } from "astro";
import type { UserDTO, UserRole } from "../../types";
import { buildRedirectUrl } from "./redirects";

/**
 * Requires user to be authenticated. Redirects to login if not.
 * Returns authenticated user if successful.
 *
 * @param context - Astro context object
 * @param redirectTo - Optional custom redirect path after login
 * @returns Authenticated user object
 */
export function requireAuth(context: AstroGlobal, redirectTo?: string): UserDTO {
  const user = context.locals.user;

  if (!user) {
    const targetPath = redirectTo || context.url.pathname;
    const loginUrl = buildRedirectUrl("/login", targetPath);
    return context.redirect(loginUrl) as never;
  }

  return user;
}

/**
 * Requires user to have a specific role. Redirects to login or unauthorized page.
 * Returns authenticated user with required role if successful.
 *
 * @param context - Astro context object
 * @param role - Required user role
 * @returns User object with required role
 */
export function requireRole(context: AstroGlobal, role: UserRole): UserDTO {
  const user = requireAuth(context);

  if (user.role !== role) {
    // User is authenticated but doesn't have required role
    // Redirect to unauthorized page or home
    return context.redirect("/unauthorized") as never;
  }

  return user;
}

/**
 * Requires user to NOT be authenticated (for login/register pages).
 * Redirects authenticated users to dashboard or redirect target.
 *
 * @param context - Astro context object
 */
export function requireAnonymous(context: AstroGlobal): void {
  const user = context.locals.user;

  if (user) {
    // User is already logged in, redirect to offers or redirect target
    const redirectTarget = context.url.searchParams.get("redirect") || "/offers";
    context.redirect(redirectTarget);
  }
}

/**
 * Optional auth - returns user if authenticated, undefined if not.
 * Does not redirect, useful for pages that work for both authenticated and anonymous users.
 *
 * @param context - Astro context object
 * @returns User object if authenticated, undefined otherwise
 */
export function optionalAuth(context: AstroGlobal): UserDTO | undefined {
  return context.locals.user;
}
