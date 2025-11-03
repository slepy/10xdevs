import { Badge } from "@/components/ui/badge";
import type { InvestmentStatus } from "@/types";

interface InvestmentStatusBadgeProps {
  status: InvestmentStatus;
}

/**
 * Wyświetla etykietę ze statusem inwestycji, z odpowiednim kolorem i tekstem
 */
export function InvestmentStatusBadge({ status }: InvestmentStatusBadgeProps) {
  const statusConfig: Record<
    InvestmentStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { label: "Oczekująca", variant: "outline" },
    accepted: { label: "Zaakceptowana", variant: "default" },
    rejected: { label: "Odrzucona", variant: "destructive" },
    cancelled: { label: "Anulowana", variant: "secondary" },
    completed: { label: "Zakończona", variant: "default" },
  };

  const config = statusConfig[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
