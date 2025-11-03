import { useState, useEffect } from "react";
import { InvestmentsFilter } from "./InvestmentsFilter";
import { InvestmentsTable } from "./InvestmentsTable";
import { TableSkeleton } from "./TableSkeleton";
import { Pagination } from "../Pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InvestmentStatus, InvestmentWithOfferNameDTO, InvestmentViewModel } from "@/types";
import { formatCurrency } from "@/lib/utils";

/**
 * Główny komponent widoku "Moje Inwestycje"
 * Zarządza stanem, pobiera dane z API i koordynuje komponenty podrzędne
 */
export function InvestmentsView() {
  const [investments, setInvestments] = useState<InvestmentViewModel[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InvestmentStatus | "all">("all");

  useEffect(() => {
    const fetchInvestments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Budowanie query string
        const searchParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
        });

        if (statusFilter !== "all") {
          searchParams.append("status", statusFilter);
        }

        const url = `/api/investments/investor?${searchParams.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Nie udało się pobrać inwestycji");
        }

        const result = await response.json();

        // Mapowanie danych na ViewModel
        const viewModels = result.data.map((investment: InvestmentWithOfferNameDTO) => {
          const date = new Date(investment.created_at);
          const formattedDate = date.toLocaleDateString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });

          return {
            id: investment.id,
            offerName: investment.offers?.name || "Nieznana oferta",
            amount: formatCurrency(investment.amount),
            status: investment.status,
            submissionDate: formattedDate,
          };
        });

        setInvestments(viewModels);
        setPagination(result.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestments();
  }, [currentPage, statusFilter]);

  const handleStatusChange = (newStatus: InvestmentStatus | "all") => {
    setCurrentPage(1); // Reset do pierwszej strony przy zmianie filtra
    setStatusFilter(newStatus);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (investmentId: string) => {
    // TODO: Nawigacja do szczegółów inwestycji (gdy będzie zaimplementowany widok)
    window.location.href = `/investments/${investmentId}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moje Inwestycje</h1>
          <p className="text-muted-foreground mt-2">Przeglądaj i zarządzaj swoimi inwestycjami</p>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moje Inwestycje</h1>
          <p className="text-muted-foreground mt-2">Przeglądaj i zarządzaj swoimi inwestycjami</p>
        </div>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moje Inwestycje</h1>
          <p className="text-muted-foreground mt-2">Przeglądaj i zarządzaj swoimi inwestycjami</p>
        </div>

        <InvestmentsFilter currentStatus={statusFilter} onStatusChange={handleStatusChange} disabled={false} />

        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <p className="text-muted-foreground text-lg mb-2">
            {statusFilter !== "all" ? "Brak inwestycji o wybranym statusie" : "Nie masz jeszcze żadnych inwestycji"}
          </p>
          <p className="text-muted-foreground text-sm mb-4">Przejdź do ofert i złóż swoją pierwszą inwestycję</p>
          <a
            href="/offers"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Przeglądaj oferty
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moje Inwestycje</h1>
        <p className="text-muted-foreground mt-2">Przeglądaj i zarządzaj swoimi inwestycjami</p>
      </div>

      <InvestmentsFilter currentStatus={statusFilter} onStatusChange={handleStatusChange} disabled={false} />

      <InvestmentsTable investments={investments} onRowClick={handleRowClick} />

      {pagination && pagination.totalPages && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}
