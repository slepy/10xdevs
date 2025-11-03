import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { InvestmentDetailsViewModel } from "@/types";

interface InvestmentInfoCardProps {
  investment: InvestmentDetailsViewModel;
}

/**
 * Wyświetla kluczowe informacje o inwestycji (kwota, data złożenia)
 */
export function InvestmentInfoCard({ investment }: InvestmentInfoCardProps) {
  const submissionDate = new Date(investment.created_at).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const completionDate = investment.completed_at
    ? new Date(investment.completed_at).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o inwestycji</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Kwota inwestycji</div>
            <div className="text-2xl font-semibold">{formatCurrency(investment.amount)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Data złożenia</div>
            <div className="text-lg font-medium">{submissionDate}</div>
          </div>
          {completionDate && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Data zakończenia</div>
              <div className="text-lg font-medium">{completionDate}</div>
            </div>
          )}
          {investment.reason && (
            <div className="md:col-span-2">
              <div className="text-sm text-muted-foreground mb-1">Powód</div>
              <div className="text-base">{investment.reason}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
