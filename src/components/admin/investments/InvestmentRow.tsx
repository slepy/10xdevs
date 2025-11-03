import type { AdminInvestmentViewModel } from "./AdminInvestmentsView";
import { TableCell, TableRow } from "../../ui/table";
import { InvestmentStatusBadge } from "@/components/investment-details/InvestmentStatusBadge";
import { InvestmentActions } from "./InvestmentActions";

export interface InvestmentRowProps {
  investment: AdminInvestmentViewModel;
}

export function InvestmentRow({ investment }: InvestmentRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{investment.offerName}</TableCell>
      <TableCell>{investment.userFullName}</TableCell>
      <TableCell>{investment.userEmail}</TableCell>
      <TableCell>{investment.amount}</TableCell>
      <TableCell>
        <InvestmentStatusBadge status={investment.status} />
      </TableCell>
      <TableCell>{investment.submissionDate}</TableCell>
      <TableCell className="text-right">
        <InvestmentActions investmentId={investment.id} />
      </TableCell>
    </TableRow>
  );
}
