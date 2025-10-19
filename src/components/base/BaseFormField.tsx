import { useId, forwardRef } from "react";
import { BaseLabel, type BaseLabelProps } from "./BaseLabel";
import { BaseInput, type BaseInputProps } from "./BaseInput";
import { BaseTextarea, type BaseTextareaProps } from "./BaseTextarea";
import { cn } from "@/lib/utils";

export interface BaseFormFieldProps {
  label?: string;
  labelProps?: Omit<BaseLabelProps, "htmlFor" | "children">;
  error?: string;
  helpText?: string;
  className?: string;
  fieldType?: "input" | "textarea";
  inputProps?: BaseInputProps;
  textareaProps?: BaseTextareaProps;
  "data-testid"?: string;
}

/**
 * BaseFormField - wrapper łączący Label, Input/Textarea, komunikat błędu i tekst pomocniczy
 *
 * Automatycznie zarządza ID dla accessibility i integruje wszystkie elementy pola formularza
 * Kompatybilny z React Hook Form przez forwardRef
 *
 * @example
 * ```tsx
 * // Standard usage
 * <BaseFormField
 *   label="E-mail"
 *   labelProps={{ required: true }}
 *   error={errors.email}
 *   helpText="Podaj swój adres e-mail"
 *   inputProps={{
 *     type: "email",
 *     placeholder: "jan@example.com",
 *     value: email,
 *     onChange: (e) => setEmail(e.target.value)
 *   }}
 * />
 *
 * // With React Hook Form Controller
 * <Controller
 *   name="email"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <BaseFormField
 *       label="E-mail"
 *       error={fieldState.error?.message}
 *       inputProps={{
 *         ...field,
 *         type: "email",
 *         placeholder: "jan@example.com"
 *       }}
 *     />
 *   )}
 * />
 * ```
 */
export const BaseFormField = forwardRef<HTMLInputElement | HTMLTextAreaElement, BaseFormFieldProps>(
  (
    {
      label,
      labelProps,
      error,
      helpText,
      className,
      fieldType = "input",
      inputProps,
      textareaProps,
      "data-testid": dataTestId,
    },
    ref
  ) => {
    const generatedId = useId();
    const fieldId = inputProps?.id || textareaProps?.id || generatedId;
    const errorId = `${fieldId}-error`;
    const helpTextId = `${fieldId}-help`;

    const ariaDescribedBy =
      [error ? errorId : null, helpText && !error ? helpTextId : null].filter(Boolean).join(" ") || undefined;

    const variant = error ? "error" : "default";

    return (
      <div className={cn("space-y-2", className)} data-testid={dataTestId}>
        {label && (
          <BaseLabel htmlFor={fieldId} {...labelProps}>
            {label}
          </BaseLabel>
        )}

        {fieldType === "textarea" ? (
          <BaseTextarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={fieldId}
            variant={variant}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            {...textareaProps}
          />
        ) : (
          <BaseInput
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            variant={variant}
            aria-invalid={!!error}
            aria-describedby={ariaDescribedBy}
            {...inputProps}
          />
        )}

        {helpText && !error && (
          <p id={helpTextId} className="text-xs text-gray-500">
            {helpText}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

BaseFormField.displayName = "BaseFormField";
