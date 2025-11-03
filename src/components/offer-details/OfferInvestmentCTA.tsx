import type { OfferStatus, UserRole } from "../../types";
import { USER_ROLES, OFFER_STATUSES } from "../../types";
import { InvestmentModal } from "../forms/InvestmentModal";

interface OfferInvestmentCTAProps {
  offerId: string;
  offerStatus: OfferStatus;
  userRole: UserRole;
  minimumInvestment: number;
}

/**
 * Determines if the CTA button should be enabled
 * Only active offers and signer users can invest
 */
function canInvest(offerStatus: OfferStatus, userRole: UserRole): boolean {
  return offerStatus === OFFER_STATUSES.ACTIVE && userRole === USER_ROLES.SIGNER;
}

/**
 * Gets the appropriate button text and disabled message based on status and role
 */
function getButtonState(offerStatus: OfferStatus, userRole: UserRole) {
  // Admin users cannot invest
  if (userRole === USER_ROLES.ADMIN) {
    return {
      text: "Inwestuj teraz",
      disabled: true,
      message: "Administratorzy nie mogą inwestować w oferty",
    };
  }

  // Check offer status
  switch (offerStatus) {
    case OFFER_STATUSES.DRAFT:
      return {
        text: "Oferta niedostępna",
        disabled: true,
        message: "Ta oferta jest jeszcze w fazie szkicu",
      };
    case OFFER_STATUSES.CLOSED:
      return {
        text: "Oferta zamknięta",
        disabled: true,
        message: "Ta oferta została już zamknięta",
      };
    case OFFER_STATUSES.ACTIVE:
      return {
        text: "Inwestuj teraz",
        disabled: false,
        message: null,
      };
    default:
      return {
        text: "Niedostępne",
        disabled: true,
        message: "Ta oferta nie jest obecnie dostępna",
      };
  }
}

/**
 * OfferInvestmentCTA component displays the call-to-action button for investing
 * Opens investment modal on click for eligible users
 */
export function OfferInvestmentCTA({ offerId, offerStatus, userRole, minimumInvestment }: OfferInvestmentCTAProps) {
  const buttonState = getButtonState(offerStatus, userRole);
  const isEnabled = canInvest(offerStatus, userRole);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Zainteresowany?</h2>

      {/* CTA Button wrapped in InvestmentModal */}
      <InvestmentModal offerId={offerId} minimumInvestment={minimumInvestment}>
        <button
          type="button"
          disabled={buttonState.disabled}
          className={`
            w-full px-6 py-3 rounded-lg font-semibold text-base transition-all
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${
              buttonState.disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800"
            }
          `}
          aria-disabled={buttonState.disabled}
        >
          {buttonState.text}
        </button>
      </InvestmentModal>

      {/* Disabled message - shown when button is disabled */}
      {buttonState.disabled && buttonState.message && (
        <div className="text-sm text-gray-600 text-center p-3 bg-gray-50 rounded-lg" role="status" aria-live="polite">
          {buttonState.message}
        </div>
      )}

      {/* Info text for active offers */}
      {isEnabled && (
        <p className="text-sm text-gray-600 text-center">Kliknij przycisk, aby złożyć deklarację inwestycyjną</p>
      )}

      {/* Contact information */}
      <div className="pt-4 border-t border-gray-100 text-sm text-gray-600 space-y-2">
        <p className="font-medium text-gray-900">Masz pytania?</p>
        <p>
          Skontaktuj się z nami:
          <br />
          <a href="mailto:kontakt@blindinvest.pl" className="text-blue-600 hover:text-blue-800 hover:underline">
            kontakt@blindinvest.pl
          </a>
        </p>
      </div>
    </div>
  );
}
