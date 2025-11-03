import { BaseButton } from "@/components/base/BaseButton";

interface CompleteInvestmentButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

/**
 * Przycisk zakończenia inwestycji dla administratora
 * Wyświetlany tylko gdy status inwestycji to 'accepted'
 */
export function CompleteInvestmentButton({ onClick, isLoading = false }: CompleteInvestmentButtonProps) {
  return (
    <BaseButton variant="primary" onClick={onClick} loading={isLoading}>
      {isLoading ? "Zakończanie..." : "Zakończ inwestycję"}
    </BaseButton>
  );
}
