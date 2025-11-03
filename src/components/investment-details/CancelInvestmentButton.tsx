import { BaseButton } from "@/components/base/BaseButton";

interface CancelInvestmentButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

/**
 * Przycisk anulowania inwestycji dla użytkownika (Signer)
 * Wyświetlany tylko gdy status inwestycji to 'pending'
 */
export function CancelInvestmentButton({ onClick, isLoading = false }: CancelInvestmentButtonProps) {
  return (
    <BaseButton variant="danger" onClick={onClick} loading={isLoading}>
      {isLoading ? "Anulowanie..." : "Anuluj inwestycję"}
    </BaseButton>
  );
}
