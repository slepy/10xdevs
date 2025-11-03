/**
 * Build a redirect URL with optional redirect parameter
 *
 * @param targetPath - The path to redirect to (e.g., "/login")
 * @param returnPath - The path to return to after completing action (e.g., "/admin/offers")
 * @returns Full URL with redirect parameter if returnPath is provided
 */
export function buildRedirectUrl(targetPath: string, returnPath?: string): string {
  if (!returnPath || returnPath === targetPath) {
    return targetPath;
  }

  // Only add redirect parameter for non-public paths
  if (shouldPreserveRedirect(returnPath)) {
    const url = new URL(targetPath, "http://localhost");
    url.searchParams.set("redirect", returnPath);
    return url.pathname + url.search;
  }

  return targetPath;
}

/**
 * Get redirect target from URL search params with fallback
 *
 * @param url - URL object containing search params
 * @param defaultPath - Default path if no redirect param found
 * @returns Sanitized redirect path or default
 */
export function getRedirectTarget(url: URL, defaultPath = "/"): string {
  const redirectParam = url.searchParams.get("redirect");

  if (!redirectParam) {
    return defaultPath;
  }

  // Validate and sanitize redirect URL
  if (isAllowedRedirect(redirectParam)) {
    return redirectParam;
  }

  return defaultPath;
}

/**
 * Check if a redirect URL is allowed (prevent open redirect vulnerabilities)
 *
 * @param url - URL string to validate
 * @returns true if URL is safe to redirect to, false otherwise
 */
export function isAllowedRedirect(url: string): boolean {
  try {
    // Must be a relative path (start with /)
    if (!url.startsWith("/")) {
      return false;
    }

    // Must not be a protocol-relative URL (// would redirect to external site)
    if (url.startsWith("//")) {
      return false;
    }

    // Must not contain dangerous characters
    if (url.includes("\\") || url.includes("\n") || url.includes("\r")) {
      return false;
    }

    // Blocklist dangerous paths
    const dangerousPaths = ["/api/", "javascript:", "data:", "vbscript:"];
    if (dangerousPaths.some((dangerous) => url.toLowerCase().includes(dangerous))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Determine if we should preserve the redirect parameter for this path
 * Some paths (like login, public pages) shouldn't be preserved
 *
 * @param path - Path to check
 * @returns true if redirect should be preserved, false otherwise
 */
export function shouldPreserveRedirect(path: string): boolean {
  // Don't preserve redirect for auth pages
  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
  if (authPaths.includes(path)) {
    return false;
  }

  // Don't preserve redirect for public pages
  const publicPaths = ["/", "/about", "/contact"];
  if (publicPaths.includes(path)) {
    return false;
  }

  // Preserve redirect for protected pages
  return true;
}

/**
 * Get the appropriate redirect path after successful login
 *
 * @param url - Current URL object
 * @param user - Authenticated user object
 * @returns Path to redirect to after login
 */
export function getPostLoginRedirect(url: URL, user: { role: string }): string {
  // First check if there's a redirect parameter
  const redirectParam = getRedirectTarget(url, "");

  if (redirectParam) {
    return redirectParam;
  }

  // Default redirects based on role
  if (user.role === "admin") {
    return "/admin";
  }

  return "/offers";
}
