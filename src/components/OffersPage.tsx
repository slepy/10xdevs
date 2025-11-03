import { useState, useEffect } from "react";
import type { OfferWithImagesDTO, AvailableOffersResponse, OfferViewModel, PaginationMeta } from "../types";
import { BaseAlert } from "./base/BaseAlert";
import { OfferCard } from "./OfferCard";
import { Pagination } from "./Pagination";
import { formatCurrency } from "../lib/utils";

export function OffersPage() {
  const [offers, setOffers] = useState<OfferViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchOffers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/offers/available?page=${currentPage}&limit=10`);

        if (!response.ok) {
          throw new Error("Nie udało się pobrać ofert");
        }

        const data: AvailableOffersResponse = await response.json();

        // Map OfferWithImagesDTO to OfferViewModel with formatted amounts
        const viewModels: OfferViewModel[] = data.data.map((offer: OfferWithImagesDTO) => ({
          id: offer.id,
          name: offer.name,
          target_amount: formatCurrency(offer.target_amount),
          min_investment: formatCurrency(offer.minimum_investment),
          main_image_url: offer.images && offer.images.length > 0 ? offer.images[0] : undefined,
        }));

        setOffers(viewModels);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="sr-only">Ładowanie...</span>
          </div>
          <p className="mt-4 text-gray-600">Ładowanie ofert...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <BaseAlert variant="error">{error}</BaseAlert>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Obecnie nie ma żadnych aktywnych ofert.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {pagination && pagination.totalPages && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}
