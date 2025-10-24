import type { UserDTO, UserRole } from "../../types";
import { USER_ROLES } from "../../types";

/**
 * Check if user has a specific role
 *
 * @param user - User object to check
 * @param role - Role to verify
 * @returns true if user has the role, false otherwise
 */
export function hasRole(user: UserDTO | undefined, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user is an admin
 *
 * @param user - User object to check
 * @returns true if user is admin, false otherwise
 */
export function isAdmin(user: UserDTO | undefined): boolean {
  return hasRole(user, USER_ROLES.ADMIN);
}

/**
 * Check if user is a signer (regular investor)
 *
 * @param user - User object to check
 * @returns true if user is signer, false otherwise
 */
export function isSigner(user: UserDTO | undefined): boolean {
  return hasRole(user, USER_ROLES.SIGNER);
}

/**
 * Check if user can access a specific path based on their role
 *
 * @param user - User object to check
 * @param path - Path to verify access for
 * @returns true if user can access the path, false otherwise
 */
export function canAccessPath(user: UserDTO | undefined, path: string): boolean {
  // Homepage - only for anonymous users (logged-in users get redirected to dashboard)
  if (path === "/") {
    return !user;
  }

  // Public paths - always accessible
  const publicPaths = ["/about", "/contact"];
  if (publicPaths.some((p) => path === p || path.startsWith(p + "/"))) {
    return true;
  }

  // Auth paths - only for anonymous users
  const authPaths = ["/login", "/register", "/forgot-password"];
  if (authPaths.some((p) => path === p || path.startsWith(p + "/"))) {
    return !user; // Only accessible if NOT logged in
  }

  // Admin paths - only for admins
  if (path.startsWith("/admin")) {
    return isAdmin(user);
  }

  // Authenticated paths - require any logged-in user
  const authenticatedPaths = ["/investments", "/profile", "/offers"];
  if (authenticatedPaths.some((p) => path === p || path.startsWith(p + "/"))) {
    return !!user;
  }

  // Default: allow access
  return true;
}

/**
 * Check if user can create offers
 * Currently only admins can create offers
 *
 * @param user - User object to check
 * @returns true if user can create offers, false otherwise
 */
export function canCreateOffer(user: UserDTO | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can manage investments (approve, reject)
 * Currently only admins can manage investments
 *
 * @param user - User object to check
 * @returns true if user can manage investments, false otherwise
 */
export function canManageInvestments(user: UserDTO | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can invest in offers
 * All authenticated users (signers and admins) can invest
 *
 * @param user - User object to check
 * @returns true if user can invest, false otherwise
 */
export function canInvest(user: UserDTO | undefined): boolean {
  return !!user; // Any authenticated user can invest
}

/**
 * Check if user can view specific investment details
 * User can view if they own the investment or are an admin
 *
 * @param user - User object to check
 * @param investmentUserId - User ID who owns the investment
 * @returns true if user can view the investment, false otherwise
 */
export function canViewInvestment(user: UserDTO | undefined, investmentUserId: string): boolean {
  if (!user) return false;
  return user.id === investmentUserId || isAdmin(user);
}

/**
 * Check if user can cancel an investment
 * User can cancel their own pending investments
 *
 * @param user - User object to check
 * @param investmentUserId - User ID who owns the investment
 * @param investmentStatus - Current status of the investment
 * @returns true if user can cancel the investment, false otherwise
 */
export function canCancelInvestment(
  user: UserDTO | undefined,
  investmentUserId: string,
  investmentStatus: string
): boolean {
  if (!user) return false;
  return user.id === investmentUserId && investmentStatus === "pending";
}
