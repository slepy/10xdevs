import { useState } from "react";
import type { UserDTO } from "../../../types";

interface UseLoginOptions {
  onSuccess?: (user: UserDTO) => void;
  onError?: (error: string) => void;
}

interface LoginResult {
  user: UserDTO;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export function useLogin({ onSuccess, onError }: UseLoginOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: { email: string; password: string }) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Błąd podczas logowania");
      }

      const loginResult = result.data as LoginResult;

      // Store tokens in localStorage for client-side access
      if (loginResult.session) {
        localStorage.setItem("supabase-token", loginResult.session.access_token);

        // Set cookies for SSR - using standard Supabase cookie names
        const secure = window.location.protocol === "https:" ? "; secure" : "";
        const expires = new Date(loginResult.session.expires_at * 1000).toUTCString();

        document.cookie = `sb-access-token=${loginResult.session.access_token}; path=/; expires=${expires}; samesite=lax${secure}`;
        document.cookie = `sb-refresh-token=${loginResult.session.refresh_token}; path=/; expires=${expires}; samesite=lax${secure}`;
      }

      // Call success callback
      if (onSuccess && loginResult.user) {
        onSuccess(loginResult.user);
      }

      // Redirect to offers page - use location.replace for full page reload
      // to ensure middleware can pick up the new session
      window.location.replace("/offers");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";

      if (onError) {
        onError(errorMessage);
      }

      throw error; // Re-throw to let React Hook Form handle it
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    isLoading,
  };
}
