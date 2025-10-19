import React, { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BaseInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: "default" | "error" | "success";
  inputSize?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * BaseInput - podstawowy komponent input z różnymi wariantami
 *
 * @example
 * ```tsx
 * <BaseInput
 *   type="email"
 *   placeholder="Wprowadź email"
 *   variant="error"
 *   inputSize="md"
 * />
 * ```
 */
const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  (
    { className, variant = "default", inputSize = "md", leftIcon, rightIcon, type = "text", disabled, ...props },
    ref
  ) => {
    const baseStyles =
      "w-full border rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      default: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
      error: "border-red-300 focus:border-red-500 focus:ring-red-500",
      success: "border-green-300 focus:border-green-500 focus:ring-green-500",
    };

    const sizeStyles = {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-base",
      lg: "px-4 py-3 text-lg",
    };

    const inputClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[inputSize],
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      className
    );

    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{leftIcon}</div>
          )}
          <input ref={ref} type={type} disabled={disabled} className={inputClasses} {...props} />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return <input ref={ref} type={type} disabled={disabled} className={inputClasses} {...props} />;
  }
);

BaseInput.displayName = "BaseInput";

export { BaseInput };
