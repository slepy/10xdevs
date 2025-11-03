/**
 * Client-side authentication state listener
 *
 * This script monitors authentication state changes and synchronizes
 * session across browser tabs/windows. It also handles automatic
 * token refresh and session cleanup.
 */

// Types for session storage
interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
  };
}

const SESSION_STORAGE_KEY = "blind-invest-session";
const CHECK_INTERVAL = 60000; // Check every minute

/**
 * Initialize authentication state listener
 */
function initAuthListener() {
  // Listen for storage events (changes in other tabs)
  window.addEventListener("storage", handleStorageChange);

  // Check session periodically
  const intervalId = setInterval(checkSession, CHECK_INTERVAL);

  // Initial session check
  checkSession();

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    clearInterval(intervalId);
  });
}

/**
 * Handle storage changes from other tabs
 */
function handleStorageChange(event: StorageEvent) {
  // Only handle our session key
  if (event.key !== SESSION_STORAGE_KEY) {
    return;
  }

  // Session was removed (logout in another tab)
  if (event.newValue === null && event.oldValue !== null) {
    handleLogout();
    return;
  }

  // Session was added/updated (login in another tab)
  if (event.newValue !== null && event.oldValue === null) {
    handleLogin();
    return;
  }
}

/**
 * Check current session status and refresh if needed
 */
async function checkSession() {
  const session = getStoredSession();

  if (!session) {
    // No session - do nothing (user is not logged in)
    return;
  }

  const now = Date.now();
  const expiresAt = session.expires_at * 1000; // Convert to milliseconds
  const timeUntilExpiry = expiresAt - now;

  // If session expires in less than 5 minutes, try to refresh
  if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
    await refreshSession();
  }

  // If session is already expired, log out
  if (timeUntilExpiry <= 0) {
    await handleExpiredSession();
  }
}

/**
 * Refresh the current session
 */
async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data?.session) {
        storeSession(data.data.session);
        return true;
      }
    }

    return false;
  } catch {
    // Session refresh failed - will be handled by calling code
    return false;
  }
}

/**
 * Handle expired session
 */
async function handleExpiredSession() {
  // Try to refresh first
  const refreshed = await refreshSession();

  if (!refreshed) {
    // Refresh failed - clear session and redirect to login
    clearStoredSession();

    // Only redirect if we're on a protected page
    const path = window.location.pathname;
    const isProtectedPath =
      path.startsWith("/dashboard") ||
      path.startsWith("/investments") ||
      path.startsWith("/profile") ||
      path.startsWith("/admin");

    if (isProtectedPath) {
      window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
    }
  }
}

/**
 * Handle logout event (from another tab)
 */
function handleLogout() {
  // Clear local session data
  clearStoredSession();

  // Redirect to login if on protected page
  const path = window.location.pathname;
  const isProtectedPath =
    path.startsWith("/dashboard") ||
    path.startsWith("/investments") ||
    path.startsWith("/profile") ||
    path.startsWith("/admin");

  if (isProtectedPath) {
    window.location.href = "/login";
  } else {
    // Just reload to update UI
    window.location.reload();
  }
}

/**
 * Handle login event (from another tab)
 */
function handleLogin() {
  // Reload page to update UI with logged-in state
  window.location.reload();
}

/**
 * Get stored session from localStorage
 */
function getStoredSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredSession;
  } catch {
    return null;
  }
}

/**
 * Store session in localStorage
 */
function storeSession(session: StoredSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Clear session from localStorage
 */
function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthListener);
} else {
  initAuthListener();
}

// Export functions for use in other scripts if needed
export { storeSession, clearStoredSession, getStoredSession };
