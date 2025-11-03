import type { OfferViewModel } from "../types";

export interface OfferCardProps {
  offer: OfferViewModel;
}

export function OfferCard({ offer }: OfferCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <a
        href={`/offers/${offer.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
      >
        {/* Image section */}
        <div className="relative h-48 bg-gray-200">
          {offer.main_image_url ? (
            <img src={offer.main_image_url} alt={offer.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{offer.name}</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Kwota docelowa:</span>
              <span className="text-lg font-semibold text-gray-900">{offer.target_amount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Minimalna inwestycja:</span>
              <span className="text-lg font-semibold text-blue-600">{offer.min_investment}</span>
            </div>
          </div>

          <div className="mt-6">
            <span className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
              Zobacz szczegóły
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}
