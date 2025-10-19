import { useState } from "react";
import type { UserDTO } from "../../../types";

interface UseRegisterOptions {
  onSuccess?: (user: UserDTO) => void;
  onError?: (error: string) => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterResult {
  user: UserDTO;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export function useRegister({ onSuccess, onError }: UseRegisterOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const register = async (data: RegisterData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors from API
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details
            .map((detail: { field: string; message: string }) => `${detail.field}: ${detail.message}`)
            .join(", ");
          throw new Error(errorMessages);
        }
        // Use the specific error message from API, fallback to generic message
        throw new Error(result.message || result.error || "Błąd podczas rejestracji");
      }

      const registerResult = result.data as RegisterResult;

      // Store tokens in localStorage for client-side access
      if (registerResult.session) {
        localStorage.setItem("supabase-token", registerResult.session.access_token);
      }

      // Call success callback
      if (onSuccess && registerResult.user) {
        onSuccess(registerResult.user);
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
    register,
    isLoading,
  };
}
