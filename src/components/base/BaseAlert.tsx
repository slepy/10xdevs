import React, { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BaseAlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  onClose?: () => void;
  icon?: React.ReactNode;
}

/**
 * BaseAlert - komponent do wyświetlania komunikatów (info, success, warning, error)
 *
 * @example
 * ```tsx
 * <BaseAlert variant="error" title="Błąd" onClose={() => console.log('closed')}>
 *   Wystąpił błąd podczas przetwarzania żądania
 * </BaseAlert>
 *
 * <BaseAlert variant="success">
 *   Operacja zakończona sukcesem!
 * </BaseAlert>
 * ```
 */
export function BaseAlert({ className, variant = "info", title, onClose, icon, children, ...props }: BaseAlertProps) {
  const baseStyles = "rounded-md p-4 border";

  const variantStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  const iconColors = {
    info: "text-blue-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  const defaultIcons = {
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)} role="alert" {...props}>
      <div className="flex items-start gap-3">
        {displayIcon && <div className={cn("flex-shrink-0 mt-0.5", iconColors[variant])}>{displayIcon}</div>}

        <div className="flex-1">
          {title && <h3 className="font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "flex-shrink-0 ml-2 -mr-1 -mt-1 p-1 rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1",
              iconColors[variant]
            )}
            aria-label="Zamknij"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
