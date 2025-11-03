import type { InvestmentQueryParams } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { INVESTMENT_STATUSES } from "@/types";

export interface InvestmentsFiltersProps {
  filters: Partial<InvestmentQueryParams>;
  onFilterChange: (filters: Partial<InvestmentQueryParams>) => void;
  disabled: boolean;
}

export function InvestmentsFilters({ filters, onFilterChange, disabled }: InvestmentsFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFilterChange({
      status: value === "all" ? undefined : value,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFilterChange({
      filter: value || undefined,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
      <h3 className="text-lg font-semibold">Filtry</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status filter */}
        <div className="space-y-2">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <Select value={filters.status || "all"} onValueChange={handleStatusChange} disabled={disabled}>
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Wszystkie statusy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              <SelectItem value={INVESTMENT_STATUSES.PENDING}>Oczekujące</SelectItem>
              <SelectItem value={INVESTMENT_STATUSES.ACCEPTED}>Zaakceptowane</SelectItem>
              <SelectItem value={INVESTMENT_STATUSES.REJECTED}>Odrzucone</SelectItem>
              <SelectItem value={INVESTMENT_STATUSES.CANCELLED}>Anulowane</SelectItem>
              <SelectItem value={INVESTMENT_STATUSES.COMPLETED}>Zakończone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search filter */}
        <div className="space-y-2">
          <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700">
            Wyszukaj
          </label>
          <input
            id="search-filter"
            type="text"
            placeholder="Email użytkownika lub nazwa oferty..."
            value={filters.filter || ""}
            onChange={handleSearchChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
