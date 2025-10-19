import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "../../lib/validators/auth.validator";
import { BaseButton, BaseAlert, BaseFormField } from "../base";
import type { UserDTO } from "../../types";
import { useLogin } from "./hooks/useLogin";

interface LoginFormProps {
  onSuccess?: (user: UserDTO) => void;
  onError?: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const { login, isLoading } = useLogin({ onSuccess, onError });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {
      // Set form-level error for general authentication failures
      setError("root", {
        type: "manual",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate data-testid="login-form">
      {errors.root && (
        <BaseAlert variant="error" data-testid="login-error-message">
          {errors.root.message}
        </BaseAlert>
      )}

      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <BaseFormField
            label="E-mail"
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
            error={fieldState.error?.message}
            data-testid="password-field"
            inputProps={{
              ...field,
              type: "password",
              placeholder: "Wprowadź swoje hasło",
              autoComplete: "current-password",
            }}
          />
        )}
      />

      <BaseButton type="submit" disabled={isLoading} loading={isLoading} fullWidth data-testid="login-submit-button">
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </BaseButton>

      <div className="text-center text-sm text-gray-600">
        Nie masz konta?{" "}
        <a
          href="/register"
          className="text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          data-testid="register-link"
        >
          Zarejestruj się
        </a>
      </div>
    </form>
  );
}
