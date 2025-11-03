import type { AdminInvestmentViewModel } from "./AdminInvestmentsView";
import type { InvestmentStatus } from "@/types";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "../../ui/table";
import { InvestmentRow } from "./InvestmentRow";

export interface InvestmentsTableProps {
  investments: AdminInvestmentViewModel[];
  onStatusChange: (investmentId: string, newStatus: InvestmentStatus) => void;
}

export function InvestmentsTable({ investments, onStatusChange }: InvestmentsTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Oferta</TableHead>
            <TableHead>Użytkownik</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Kwota</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data zgłoszenia</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((investment) => (
            <InvestmentRow key={investment.id} investment={investment} onStatusChange={onStatusChange} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
