import type { AdminInvestmentViewModel } from "./AdminInvestmentsView";
import { TableCell, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { InvestmentActions } from "./InvestmentActions";
import { getInvestmentStatusBadge } from "@/lib/investment-status";

export interface InvestmentRowProps {
  investment: AdminInvestmentViewModel;
}

export function InvestmentRow({ investment }: InvestmentRowProps) {
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
        <InvestmentActions investmentId={investment.id} />
      </TableCell>
    </TableRow>
  );
}
