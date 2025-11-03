import { Badge } from "@/components/ui/badge";
import { getInvestmentStatusBadge } from "@/lib/investment-status";
import type { InvestmentStatus } from "@/types";

interface InvestmentStatusBadgeProps {
  status: InvestmentStatus;
}

/**
 * Wyświetla etykietę ze statusem inwestycji, z odpowiednim kolorem i tekstem
 */
export function InvestmentStatusBadge({ status }: InvestmentStatusBadgeProps) {
  const config = getInvestmentStatusBadge(status);

  if (!config) {
    return null;
  }

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
