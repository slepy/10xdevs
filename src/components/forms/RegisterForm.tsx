import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "../../lib/validators/auth.validator";
import { BaseButton, BaseAlert, BaseFormField } from "../base";
import type { UserDTO } from "../../types";
import { useRegister } from "./hooks/useRegister";

interface RegisterFormProps {
  onSuccess?: (user: UserDTO) => void;
  onError?: (error: string) => void;
}

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const { register: registerUser, isLoading } = useRegister({ onSuccess, onError });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
    } catch (error) {
      // Handle API validation errors that contain field information
      if (error instanceof Error && error.message.includes(":")) {
        const fieldErrors = error.message.split(", ");
        fieldErrors.forEach((fieldError) => {
          const [field, message] = fieldError.split(": ");
          if (field && message) {
            setError(field as keyof RegisterFormData, {
              type: "manual",
              message,
            });
          }
        });
      } else {
        // Set form-level error for general failures
        setError("root", {
          type: "manual",
          message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate data-testid="register-form">
      {errors.root && (
        <BaseAlert variant="error" data-testid="register-error-message">
          {errors.root.message}
        </BaseAlert>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Controller
          name="firstName"
          control={control}
          render={({ field, fieldState }) => (
            <BaseFormField
              label="Imię"
              labelProps={{ required: true }}
              error={fieldState.error?.message}
              data-testid="firstName-field"
              inputProps={{
                ...field,
                type: "text",
                placeholder: "Wprowadź swoje imię",
                autoComplete: "given-name",
              }}
            />
          )}
        />

        <Controller
          name="lastName"
          control={control}
          render={({ field, fieldState }) => (
            <BaseFormField
              label="Nazwisko"
              labelProps={{ required: true }}
              error={fieldState.error?.message}
              data-testid="lastName-field"
              inputProps={{
                ...field,
                type: "text",
                placeholder: "Wprowadź swoje nazwisko",
                autoComplete: "family-name",
              }}
            />
          )}
        />
      </div>

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <BaseFormField
            label="E-mail"
            labelProps={{ required: true }}
            error={fieldState.error?.message}
            data-testid="email-field"
            inputProps={{
              ...field,
              type: "email",
              placeholder: "Wprowadź swój e-mail",
              autoComplete: "email",
            }}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <BaseFormField
            label="Hasło"
            labelProps={{ required: true }}
            error={fieldState.error?.message}
            helpText="Hasło musi zawierać min. 8 znaków, wielką literę, cyfrę i znak specjalny"
            data-testid="password-field"
            inputProps={{
              ...field,
              type: "password",
              placeholder: "Utwórz bezpieczne hasło",
              autoComplete: "new-password",
            }}
          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        render={({ field, fieldState }) => (
          <BaseFormField
            label="Potwierdź hasło"
            labelProps={{ required: true }}
            error={fieldState.error?.message}
            data-testid="confirmPassword-field"
            inputProps={{
              ...field,
              type: "password",
              placeholder: "Wprowadź hasło ponownie",
              autoComplete: "new-password",
            }}
          />
        )}
      />

      <BaseButton type="submit" disabled={isLoading} loading={isLoading} fullWidth data-testid="register-submit-button">
        {isLoading ? "Rejestracja..." : "Zarejestruj się"}
      </BaseButton>

      <div className="text-center text-sm text-gray-600">
        Masz już konto?{" "}
        <a
          href="/login"
          className="text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          data-testid="login-link"
        >
          Zaloguj się
        </a>
      </div>
    </form>
  );
}
