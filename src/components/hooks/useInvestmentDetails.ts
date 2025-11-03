import { useState, useEffect } from "react";
import type { InvestmentDetailsDTO, ApiResponse } from "@/types";

interface UseInvestmentDetailsResult {
  data: InvestmentDetailsDTO | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook do pobierania szczegółowych danych inwestycji
 * Automatycznie pobiera dane przy montowaniu komponentu
 *
 * @param investmentId - ID inwestycji do pobrania
 * @returns Obiekt z danymi, stanami ładowania i błędu oraz funkcją refetch
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, error, refetch } = useInvestmentDetails(investmentId);
 *
 * if (isLoading) return <div>Ładowanie...</div>;
 * if (isError) return <div>Błąd: {error}</div>;
 * if (!data) return null;
 *
 * return <div>{data.amount}</div>;
 * ```
 */
export function useInvestmentDetails(investmentId: string): UseInvestmentDetailsResult {
  const [data, setData] = useState<InvestmentDetailsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchInvestmentDetails = async () => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const response = await fetch(`/api/investments/${investmentId}`);

        if (!response.ok) {
          const errorData: ApiResponse = await response.json();
          throw new Error(errorData.message || "Nie udało się pobrać szczegółów inwestycji");
        }

        const result: ApiResponse<InvestmentDetailsDTO> = await response.json();

        if (!result.data) {
          throw new Error("Brak danych w odpowiedzi serwera");
        }

        setData(result.data);
      } catch (err) {
        setIsError(true);
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestmentDetails();
  }, [investmentId, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
  };
}
