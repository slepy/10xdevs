import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVESTMENT_STATUSES, type InvestmentStatus } from "@/types";

interface InvestmentsFilterProps {
  currentStatus: InvestmentStatus | "all";
  onStatusChange: (status: InvestmentStatus | "all") => void;
  disabled?: boolean;
}

/**
 * Komponent filtra statusu inwestycji
 * Pozwala użytkownikowi filtrować listę inwestycji według statusu
 */
export function InvestmentsFilter({ currentStatus, onStatusChange, disabled = false }: InvestmentsFilterProps) {
  /**
   * Zwraca polską etykietę dla statusu inwestycji
   */
  const getStatusLabel = (status: InvestmentStatus | "all"): string => {
    const labels: Record<InvestmentStatus | "all", string> = {
      all: "Wszystkie",
      [INVESTMENT_STATUSES.PENDING]: "W oczekiwaniu",
      [INVESTMENT_STATUSES.ACCEPTED]: "Zaakceptowane",
      [INVESTMENT_STATUSES.REJECTED]: "Odrzucone",
      [INVESTMENT_STATUSES.CANCELLED]: "Anulowane",
      [INVESTMENT_STATUSES.COMPLETED]: "Zakończone",
    };

    return labels[status] || status;
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="status-filter" className="text-sm font-medium">
        Status:
      </label>
      <Select value={currentStatus} onValueChange={onStatusChange} disabled={disabled}>
        <SelectTrigger id="status-filter" className="w-[180px]">
          <SelectValue>{getStatusLabel(currentStatus)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie</SelectItem>
          <SelectItem value={INVESTMENT_STATUSES.PENDING}>W oczekiwaniu</SelectItem>
          <SelectItem value={INVESTMENT_STATUSES.ACCEPTED}>Zaakceptowane</SelectItem>
          <SelectItem value={INVESTMENT_STATUSES.REJECTED}>Odrzucone</SelectItem>
          <SelectItem value={INVESTMENT_STATUSES.CANCELLED}>Anulowane</SelectItem>
          <SelectItem value={INVESTMENT_STATUSES.COMPLETED}>Zakończone</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
