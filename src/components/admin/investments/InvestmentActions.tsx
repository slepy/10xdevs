import { BaseButton } from "@/components/base";

interface InvestmentActionsProps {
  investmentId: string;
}

/**
 * Komponent z linkiem do szczegółów inwestycji
 * Umożliwia administratorowi przejście do widoku szczegółów, gdzie może zarządzać inwestycją
 */
export function InvestmentActions({ investmentId }: InvestmentActionsProps) {
  return (
    <BaseButton variant="outline" size="sm" href={`/admin/investments/${investmentId}`}>
      Zobacz szczegóły
    </BaseButton>
  );
}
