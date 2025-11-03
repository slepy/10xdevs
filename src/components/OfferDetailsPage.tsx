import { useState, useEffect } from "react";
import type { OfferWithImagesDTO, OfferDetailsViewModel, ApiResponse, UserRole, OfferStatus } from "../types";
import { BaseHeader } from "./base/BaseHeader";
import { OfferImageGallery } from "./offer-details/OfferImageGallery";
import { OfferFinancials } from "./offer-details/OfferFinancials";
import { OfferDescription } from "./offer-details/OfferDescription";
import { OfferInvestmentCTA } from "./offer-details/OfferInvestmentCTA";
import { formatCurrency } from "../lib/utils";

interface OfferDetailsPageProps {
  offerId: string;
  userRole: UserRole;
}

/**
 * Transforms OfferWithImagesDTO to OfferDetailsViewModel
 * Formats financial data for display (amounts already converted to PLN by backend)
 */
function transformToViewModel(dto: OfferWithImagesDTO): OfferDetailsViewModel {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status as OfferStatus,
    description: dto.description || "Brak opisu",
    images: dto.images || [],
    target_amount: formatCurrency(dto.target_amount),
    minimum_investment: formatCurrency(dto.minimum_investment),
    minimum_investment_raw: dto.minimum_investment, // Store raw numeric value for validation
  };
}

/**
 * Main component for offer details view
 * Handles data fetching, state management, and coordinates all subcomponents
 */
export function OfferDetailsPage({ offerId, userRole }: OfferDetailsPageProps) {
  const [offer, setOffer] = useState<OfferDetailsViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOfferDetails() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/offers/${offerId}`);
        const result: ApiResponse<OfferWithImagesDTO> = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError("Nie znaleziono takiej oferty");
          } else if (response.status === 401 || response.status === 403) {
            setError("Brak dostępu do tej oferty");
          } else {
            setError(result.error || "Wystąpił błąd serwera. Spróbuj ponownie później.");
          }
          return;
        }

        if (result.data) {
          const viewModel = transformToViewModel(result.data);
          setOffer(viewModel);
        } else {
          setError("Nie otrzymano danych oferty");
        }
      } catch {
        // Error occurred during fetch
        setError("Wystąpił błąd podczas pobierania danych. Spróbuj ponownie.");
      } finally {
        setIsLoading(false);
      }
    }

    if (offerId) {
      fetchOfferDetails();
    } else {
      setError("Brak identyfikatora oferty");
      setIsLoading(false);
    }
  }, [offerId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>

          {/* Grid layout matching actual structure */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left column - images and description */}
            <div className="md:col-span-2 space-y-6">
              {/* Image gallery skeleton */}
              <div className="h-96 bg-gray-200 rounded"></div>

              {/* Description skeleton */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>

            {/* Right column - financials and CTA */}
            <div className="space-y-6">
              {/* Financials card skeleton */}
              <div className="bg-gray-200 rounded-lg h-48"></div>

              {/* CTA button skeleton */}
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !offer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center" role="alert">
          <svg
            className="mx-auto h-12 w-12 text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-red-900 mb-2">Wystąpił błąd</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <a
            href="/offers"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Powrót do listy ofert
          </a>
        </div>
      </div>
    );
  }

  // Success state - render offer details
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <BaseHeader title={offer.name} />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {offer.images.length > 0 && <OfferImageGallery images={offer.images} offerName={offer.name} />}
            <OfferDescription description={offer.description} />
          </div>

          <div className="space-y-6">
            <OfferFinancials offer={offer} />
            <OfferInvestmentCTA
              offerId={offer.id}
              offerStatus={offer.status}
              userRole={userRole}
              minimumInvestment={offer.minimum_investment_raw}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
