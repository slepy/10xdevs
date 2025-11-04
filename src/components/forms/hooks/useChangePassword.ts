import { useState } from "react";

interface UseChangePasswordOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useChangePassword({ onSuccess, onError }: UseChangePasswordOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const changePassword = async (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Błąd podczas zmiany hasła");
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
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
    changePassword,
    isLoading,
  };
}
