import type { OfferDetailsViewModel } from "../../types";

interface OfferFinancialsProps {
  offer: OfferDetailsViewModel;
}

/**
 * OfferFinancials component displays financial information about the offer
 * Includes target amount, investment limits, and funding progress bar
 */
export function OfferFinancials({ offer }: OfferFinancialsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Informacje finansowe</h2>

      {/* Financial details list */}
      <dl className="space-y-4">
        {/* Target amount */}
        <div className="flex items-start justify-between py-3 border-b border-gray-100">
          <dt className="text-sm font-medium text-gray-600">Cel finansowy</dt>
          <dd className="text-base font-semibold text-gray-900 text-right">{offer.target_amount}</dd>
        </div>

        {/* Minimum investment */}
        <div className="flex items-start justify-between py-3">
          <dt className="text-sm font-medium text-gray-600">Minimalna inwestycja</dt>
          <dd className="text-base font-semibold text-gray-900 text-right">{offer.minimum_investment}</dd>
        </div>
      </dl>
    </div>
  );
}
