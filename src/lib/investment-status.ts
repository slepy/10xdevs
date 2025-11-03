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
