import { CancelInvestmentButton } from "./CancelInvestmentButton";
import { UpdateInvestmentStatusButtons } from "./UpdateInvestmentStatusButtons";
import { CompleteInvestmentButton } from "./CompleteInvestmentButton";
import type { InvestmentDetailsViewModel, InvestmentStatus, UserRole } from "@/types";
import { INVESTMENT_STATUSES, USER_ROLES } from "@/types";

interface InvestmentActionsProps {
  investment: InvestmentDetailsViewModel;
  userRole: UserRole;
  onCancel: () => void;
  onStatusChange: (newStatus: InvestmentStatus) => void;
  isLoading?: boolean;
}

/**
 * Renderuje odpowiednie przyciski akcji w zależności od statusu inwestycji i roli użytkownika
 */
export function InvestmentActions({
  investment,
  userRole,
  onCancel,
  onStatusChange,
  isLoading = false,
}: InvestmentActionsProps) {
  // Przycisk anulowania dla Signera - tylko gdy status to 'pending'
  const showCancelButton = userRole === USER_ROLES.SIGNER && investment.status === INVESTMENT_STATUSES.PENDING;

  // Przyciski zmiany statusu dla Admina - tylko gdy status to 'pending'
  const showStatusButtons = userRole === USER_ROLES.ADMIN && investment.status === INVESTMENT_STATUSES.PENDING;

  // Przycisk zakończenia dla Admina - tylko gdy status to 'accepted'
  const showCompleteButton = userRole === USER_ROLES.ADMIN && investment.status === INVESTMENT_STATUSES.ACCEPTED;

  // Jeśli nie ma żadnych akcji do wyświetlenia, zwróć null
  if (!showCancelButton && !showStatusButtons && !showCompleteButton) {
    return null;
  }

  return (
    <div className="flex justify-end">
      {showCancelButton && <CancelInvestmentButton onClick={onCancel} isLoading={isLoading} />}
      {showStatusButtons && (
        <UpdateInvestmentStatusButtons
          onAccept={() => onStatusChange(INVESTMENT_STATUSES.ACCEPTED)}
          onReject={() => onStatusChange(INVESTMENT_STATUSES.REJECTED)}
          isLoading={isLoading}
        />
      )}
      {showCompleteButton && (
        <CompleteInvestmentButton onClick={() => onStatusChange(INVESTMENT_STATUSES.COMPLETED)} isLoading={isLoading} />
      )}
    </div>
  );
}
