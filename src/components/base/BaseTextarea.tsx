import React, { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BaseTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "error" | "success";
  textareaSize?: "sm" | "md" | "lg";
  showCharCount?: boolean;
  maxLength?: number;
}

/**
 * BaseTextarea - podstawowy komponent textarea z różnymi wariantami
 *
 * @example
 * ```tsx
 * <BaseTextarea
 *   placeholder="Wprowadź opis"
 *   variant="default"
 *   textareaSize="md"
 *   rows={4}
 *   showCharCount
 *   maxLength={500}
 * />
 * ```
 */
const BaseTextarea = forwardRef<HTMLTextAreaElement, BaseTextareaProps>(
  (
    {
      className,
      variant = "default",
      textareaSize = "md",
      showCharCount = false,
      maxLength,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(0);

    React.useEffect(() => {
      if (value) {
        setCharCount(String(value).length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (showCharCount) {
        setCharCount(e.target.value.length);
      }
      if (onChange) {
        onChange(e);
      }
    };

    const baseStyles =
      "w-full border rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed resize-y";

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

    const textareaClasses = cn(baseStyles, variantStyles[variant], sizeStyles[textareaSize], className);

    return (
      <div className="relative">
        <textarea
          ref={ref}
          disabled={disabled}
          className={textareaClasses}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          {...props}
        />
        {showCharCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white/80 px-1 rounded">
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);

BaseTextarea.displayName = "BaseTextarea";

export { BaseTextarea };
