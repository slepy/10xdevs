import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormData } from "../../lib/validators/auth.validator";
import { BaseButton, BaseAlert, BaseFormField } from "../base";
import { useChangePassword } from "./hooks/useChangePassword";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function ChangePasswordForm({ onSuccess, onError }: ChangePasswordFormProps) {
  const { changePassword, isLoading } = useChangePassword({ onSuccess, onError });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword(data);
      setSuccessMessage("Hasło zostało pomyślnie zmienione");
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      // Set form-level error for general failures
      setError("root", {
        type: "manual",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate data-testid="change-password-form">
      {successMessage && (
        <BaseAlert variant="success" data-testid="change-password-success-message">
          {successMessage}
        </BaseAlert>
      )}

      {errors.root && (
        <BaseAlert variant="error" data-testid="change-password-error-message">
          {errors.root.message}
        </BaseAlert>
      )}

      <Controller
        name="currentPassword"
        control={control}
        render={({ field, fieldState }) => (
          <BaseFormField
            label="Aktualne hasło"
            error={fieldState.error?.message}
            data-testid="current-password-field"
            inputProps={{
              ...field,
              type: "password",
              placeholder: "Wprowadź swoje aktualne hasło",
              autoComplete: "current-password",
            }}
          />
        )}
      />

      <Controller
        name="newPassword"
        control={control}
        render={({ field, fieldState }) => (
          <BaseFormField
            label="Nowe hasło"
            error={fieldState.error?.message}
            data-testid="new-password-field"
            inputProps={{
              ...field,
              type: "password",
              placeholder: "Wprowadź nowe hasło",
              autoComplete: "new-password",
            }}
          />
        )}
      />

      <Controller
        name="confirmNewPassword"
        control={control}
        render={({ field, fieldState }) => (
          <BaseFormField
            label="Potwierdź nowe hasło"
            error={fieldState.error?.message}
            data-testid="confirm-new-password-field"
            inputProps={{
              ...field,
              type: "password",
              placeholder: "Potwierdź nowe hasło",
              autoComplete: "new-password",
            }}
          />
        )}
      />

      <BaseButton
        type="submit"
        disabled={isLoading}
        loading={isLoading}
        fullWidth
        data-testid="change-password-submit-button"
      >
        {isLoading ? "Zmiana hasła..." : "Zmień hasło"}
      </BaseButton>
    </form>
  );
}
