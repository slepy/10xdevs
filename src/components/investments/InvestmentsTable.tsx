import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/EmptyState";
import { getInvestmentStatusBadge } from "@/lib/investment-status";
import type { InvestmentViewModel } from "./types";

interface InvestmentsTableProps {
  investments: InvestmentViewModel[];
  onRowClick: (investmentId: string) => void;
}

/**
 * Tabela wyświetlająca listę inwestycji użytkownika
 * Wyświetla nazwę oferty, kwotę, datę złożenia i status
 */
export function InvestmentsTable({ investments, onRowClick }: InvestmentsTableProps) {
  // Wyświetl EmptyState jeśli brak inwestycji
  if (investments.length === 0) {
    return (
      <EmptyState
        title="Brak inwestycji do wyświetlenia"
        description="Przejdź do ofert i złóż swoją pierwszą inwestycję"
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa oferty</TableHead>
            <TableHead>Kwota inwestycji</TableHead>
            <TableHead>Data złożenia</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((investment) => {
            const statusConfig = getInvestmentStatusBadge(investment.status);

            return (
              <TableRow
                key={investment.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onRowClick(investment.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(investment.id);
                  }
                }}
              >
                <TableCell className="font-medium">{investment.offerName}</TableCell>
                <TableCell>{investment.amount}</TableCell>
                <TableCell className="text-gray-600">{investment.submissionDate}</TableCell>
                <TableCell>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
