import { useState, useEffect } from "react";
import type { InvestmentStatus, PaginatedResponse, InvestmentQueryParams, InvestmentWithRelationsDTO } from "@/types";
import { InvestmentsFilters } from "./InvestmentsFilters";
import { InvestmentsTable } from "./InvestmentsTable";
import { Pagination } from "../../Pagination";
import { EmptyState } from "../EmptyState";
import { BaseAlert } from "../../base/BaseAlert";

/**
 * ViewModel for a single investment in the Admin View.
 * Contains formatted and directly usable data for the UI.
 */
export interface AdminInvestmentViewModel {
  id: string;
  offerName: string;
  userFullName: string;
  userEmail: string;
  amount: string; // Sformatowana kwota
  status: InvestmentStatus;
  submissionDate: string; // Sformatowana data
}

type LoadingStatus = "idle" | "loading" | "success" | "error";

/**
 * Mapuje dane z API (InvestmentWithRelationsDTO) na ViewModel dla widoku admina
 * Formatuje daty, kwoty i przygotowuje dane do wyświetlenia
 */
function mapToAdminViewModel(investment: InvestmentWithRelationsDTO): AdminInvestmentViewModel {
  // Formatowanie daty
  const submissionDate = new Date(investment.created_at).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Formatowanie kwoty (API zwraca już skonwertowaną z centów)
  const amount = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(investment.amount);

  // Konstruowanie pełnej nazwy użytkownika z metadanych
  const firstName = investment.users_view?.first_name || "";
  const lastName = investment.users_view?.last_name || "";
  const userFullName =
    firstName && lastName ? `${firstName} ${lastName}` : investment.users_view?.email || "Brak danych";

  return {
    id: investment.id,
    offerName: investment.offers?.name || "Brak nazwy",
    userFullName,
    userEmail: investment.users_view?.email || "Brak emaila",
    amount,
    status: investment.status as InvestmentStatus,
    submissionDate,
  };
}

export function AdminInvestmentsView() {
  const [data, setData] = useState<PaginatedResponse<AdminInvestmentViewModel> | null>(null);
  const [status, setStatus] = useState<LoadingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<InvestmentQueryParams>({
    page: 1,
    limit: 10,
  });

  // Fetch investments data
  useEffect(() => {
    const fetchInvestments = async () => {
      setStatus("loading");
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        if (queryParams.page) searchParams.set("page", queryParams.page.toString());
        if (queryParams.limit) searchParams.set("limit", queryParams.limit.toString());
        if (queryParams.status) searchParams.set("status", queryParams.status);
        if (queryParams.offer_id) searchParams.set("offer_id", queryParams.offer_id);
        if (queryParams.filter) searchParams.set("filter", queryParams.filter);

        const response = await fetch(`/api/investments/admin?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać listy inwestycji");
        }

        const result: PaginatedResponse<InvestmentWithRelationsDTO> = await response.json();

        // Mapowanie danych z API na ViewModel
        const mappedData: PaginatedResponse<AdminInvestmentViewModel> = {
          data: result.data.map(mapToAdminViewModel),
          pagination: result.pagination,
        };

        setData(mappedData);
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
        setStatus("error");
      }
    };

    fetchInvestments();
  }, [queryParams]);

  // Handle filter changes
  const handleFilterChange = (filters: Partial<InvestmentQueryParams>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...filters,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({
      ...prev,
      page,
    }));
  };

  // Handle status change for an investment
  const handleStatusChange = async (investmentId: string, newStatus: InvestmentStatus) => {
    try {
      const response = await fetch(`/api/investments/${investmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się zaktualizować statusu inwestycji");
      }

      // Refresh the list after successful update
      setQueryParams((prev) => ({ ...prev }));
    } catch (err) {
      // TODO: Show toast notification with error
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    }
  };

  const isLoading = status === "loading";
  const hasError = status === "error";
  const isEmpty = status === "success" && (!data?.data || data.data.length === 0);

  return (
    <div className="space-y-6">
      <InvestmentsFilters filters={queryParams} onFilterChange={handleFilterChange} disabled={isLoading} />

      {hasError && <BaseAlert variant="error">{error || "Wystąpił błąd podczas ładowania danych"}</BaseAlert>}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Ładowanie...</p>
        </div>
      )}

      {isEmpty && (
        <EmptyState
          title="Brak inwestycji"
          description="Nie znaleziono żadnych inwestycji spełniających wybrane kryteria."
        />
      )}

      {status === "success" && data && data.data.length > 0 && (
        <>
          <InvestmentsTable investments={data.data} onStatusChange={handleStatusChange} />
          <Pagination pagination={data.pagination} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
}
