import { CancelInvestmentButton } from "./CancelInvestmentButton";
import { UpdateInvestmentStatusButtons } from "./UpdateInvestmentStatusButtons";
import type { InvestmentDetailsViewModel, InvestmentStatus, UserRole } from "@/types";

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
  const showCancelButton = userRole === "signer" && investment.status === "pending";

  // Przyciski zmiany statusu dla Admina - tylko gdy status to 'pending'
  const showStatusButtons = userRole === "admin" && investment.status === "pending";

  // Jeśli nie ma żadnych akcji do wyświetlenia, zwróć null
  if (!showCancelButton && !showStatusButtons) {
    return null;
  }

  return (
    <div className="flex justify-end">
      {showCancelButton && <CancelInvestmentButton onClick={onCancel} isLoading={isLoading} />}
      {showStatusButtons && (
        <UpdateInvestmentStatusButtons
          onAccept={() => onStatusChange("accepted")}
          onReject={() => onStatusChange("rejected")}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
