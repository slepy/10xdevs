import React, { type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BaseLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
  tooltip?: string;
}

/**
 * BaseLabel - podstawowy komponent label dla pól formularza
 *
 * @example
 * ```tsx
 * <BaseLabel htmlFor="email" required>
 *   Adres e-mail
 * </BaseLabel>
 *
 * <BaseLabel htmlFor="phone" optional>
 *   Numer telefonu
 * </BaseLabel>
 * ```
 */
export function BaseLabel({ className, required, optional, tooltip, children, ...props }: BaseLabelProps) {
  const baseStyles = "block text-sm font-medium text-gray-700";

  return (
    <label className={cn(baseStyles, className)} {...props}>
      <span className="inline-flex items-center gap-1">
        {children}
        {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-gray-500 font-normal">(opcjonalne)</span>}
        {tooltip && (
          <span className="group relative inline-block">
            <svg
              className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
              {tooltip}
            </span>
          </span>
        )}
      </span>
    </label>
  );
}
