import { INVESTMENT_STATUSES, type InvestmentStatus } from "@/types";

/**
 * Konfiguracja badge dla statusu inwestycji
 */
export interface InvestmentStatusConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
}

/**
 * Zwraca konfigurację badge dla danego statusu inwestycji
 * Używane w komponentach wyświetlających status inwestycji (tabele, szczegóły)
 *
 * @param status - Status inwestycji z typu InvestmentStatus
 * @returns Obiekt z wariantem badge i etykietą w języku polskim
 *
 * @example
 * ```tsx
 * const statusConfig = getInvestmentStatusBadge(investment.status);
 * <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
 * ```
 */
export function getInvestmentStatusBadge(status: InvestmentStatus): InvestmentStatusConfig {
  const config: Record<InvestmentStatus, InvestmentStatusConfig> = {
    [INVESTMENT_STATUSES.PENDING]: {
      variant: "secondary",
      label: "W oczekiwaniu",
    },
    [INVESTMENT_STATUSES.ACCEPTED]: {
      variant: "default",
      label: "Zaakceptowana",
    },
    [INVESTMENT_STATUSES.REJECTED]: {
      variant: "destructive",
      label: "Odrzucona",
    },
    [INVESTMENT_STATUSES.CANCELLED]: {
      variant: "outline",
      label: "Anulowana",
    },
    [INVESTMENT_STATUSES.COMPLETED]: {
      variant: "default",
      label: "Zakończona",
    },
  };

  return config[status] || { variant: "secondary", label: status };
}

/**
 * Zwraca dozwolone przejścia statusu dla inwestycji
 * Używane zarówno w backendzie (walidacja) jak i frontendzie (UI)
 *
 * @param currentStatus - Aktualny status inwestycji
 * @returns Tablica dozwolonych statusów do przejścia
 *
 * @example
 * ```ts
 * const allowed = getAllowedStatusTransitions(INVESTMENT_STATUSES.PENDING);
 * // Returns: ['accepted', 'rejected', 'cancelled']
 * ```
 */
export function getAllowedStatusTransitions(currentStatus: InvestmentStatus): InvestmentStatus[] {
  const transitions: Record<InvestmentStatus, InvestmentStatus[]> = {
    [INVESTMENT_STATUSES.PENDING]: [
      INVESTMENT_STATUSES.ACCEPTED,
      INVESTMENT_STATUSES.REJECTED,
      INVESTMENT_STATUSES.CANCELLED,
    ],
    [INVESTMENT_STATUSES.ACCEPTED]: [INVESTMENT_STATUSES.COMPLETED],
    [INVESTMENT_STATUSES.REJECTED]: [], // Status końcowy - brak możliwości zmiany
    [INVESTMENT_STATUSES.CANCELLED]: [], // Status końcowy - brak możliwości zmiany
    [INVESTMENT_STATUSES.COMPLETED]: [], // Status końcowy - brak możliwości zmiany
  };

  return transitions[currentStatus] || [];
}
