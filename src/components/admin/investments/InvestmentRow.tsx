import type { AdminInvestmentViewModel } from "./AdminInvestmentsView";
import type { InvestmentStatus } from "@/types";
import { TableCell, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { InvestmentActions } from "./InvestmentActions";
import { getInvestmentStatusBadge } from "@/lib/investment-status";

export interface InvestmentRowProps {
  investment: AdminInvestmentViewModel;
  onStatusChange: (investmentId: string, newStatus: InvestmentStatus) => void;
}

export function InvestmentRow({ investment, onStatusChange }: InvestmentRowProps) {
  const statusConfig = getInvestmentStatusBadge(investment.status);
  return (
    <TableRow>
      <TableCell className="font-medium">{investment.offerName}</TableCell>
      <TableCell>{investment.userFullName}</TableCell>
      <TableCell>{investment.userEmail}</TableCell>
      <TableCell>{investment.amount}</TableCell>
      <TableCell>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </TableCell>
      <TableCell>{investment.submissionDate}</TableCell>
      <TableCell className="text-right">
        <InvestmentActions
          investmentId={investment.id}
          currentStatus={investment.status}
          onStatusChange={onStatusChange}
        />
      </TableCell>
    </TableRow>
  );
}
