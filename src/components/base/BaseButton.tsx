import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BaseButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>, "type"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: "button" | "submit";
  href?: string;
}

/**
 * BaseButton - podstawowy komponent przycisku z różnymi wariantami
 *
 * Prostszy niż ui/Button, bez zależności od Radix UI.
 * Renderuje <button> lub <a> w zależności od props.
 *
 * @param href - Jeśli podane, renderuje jako <a> tag (link)
 * @param type - Typ buttona: "button" (domyślnie) lub "submit" (tylko dla <button>)
 * @param variant - Styl wizualny: primary, secondary, outline, ghost, danger, link
 * @param size - Rozmiar: sm, md (domyślnie), lg
 * @param loading - Pokazuje spinner i wyłącza interakcję
 * @param disabled - Wyłącza przycisk
 * @param leftIcon - Ikona po lewej stronie
 * @param rightIcon - Ikona po prawej stronie
 * @param fullWidth - Przycisk na pełną szerokość
 *
 * @example
 * ```tsx
 * // Zwykły button (domyślnie type="button")
 * <BaseButton variant="primary" onClick={() => console.log('clicked')}>
 *   Zapisz
 * </BaseButton>
 *
 * // Submit button w formularzu
 * <BaseButton variant="primary" type="submit">
 *   Wyślij
 * </BaseButton>
 *
 * // Link stylizowany jak button (renderuje <a>)
 * <BaseButton variant="primary" href="/dashboard">
 *   Przejdź do panelu
 * </BaseButton>
 *
 * // Loading state
 * <BaseButton variant="primary" loading disabled>
 *   Ładowanie...
 * </BaseButton>
 *
 * // Z ikonami
 * <BaseButton
 *   variant="outline"
 *   leftIcon={<SearchIcon />}
 * >
 *   Szukaj
 * </BaseButton>
 *
 * // Pełna szerokość
 * <BaseButton variant="primary" fullWidth>
 *   Kontynuuj
 * </BaseButton>
 *
 * // Link tekstowy
 * <BaseButton variant="link" href="/learn-more">
 *   Dowiedz się więcej
 * </BaseButton>
 * ```
 */
const BaseButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, BaseButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      type = "button",
      href,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800 shadow-sm",
      secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800 shadow-sm",
      outline:
        "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800 shadow-sm",
      link: "bg-transparent text-blue-600 hover:text-blue-700 hover:underline focus:ring-blue-500 underline-offset-4",
    };

    const sizeStyles = {
      sm: "text-sm px-3 py-1.5 h-8",
      md: "text-base px-4 py-2 h-10",
      lg: "text-lg px-6 py-3 h-12",
    };

    const buttonClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && "w-full",
      loading && "cursor-wait",
      className
    );

    const spinnerSizeMap = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    const content = loading ? (
      <>
        <svg
          className={cn("animate-spin", spinnerSizeMap[size])}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {children}
      </>
    ) : (
      <>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </>
    );

    if (href) {
      return (
        <a
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          href={href}
          className={cn(buttonClasses, (disabled || loading) && "pointer-events-none")}
          aria-disabled={disabled || loading}
          {...props}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type={type}
        disabled={disabled || loading}
        className={buttonClasses}
        {...props}
      >
        {content}
      </button>
    );
  }
);

BaseButton.displayName = "BaseButton";

export { BaseButton };
