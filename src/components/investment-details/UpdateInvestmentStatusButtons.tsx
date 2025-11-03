import { BaseButton } from "@/components/base/BaseButton";

interface UpdateInvestmentStatusButtonsProps {
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

/**
 * Przyciski zmiany statusu inwestycji dla administratora
 * Wyświetlane tylko gdy status inwestycji to 'pending'
 */
export function UpdateInvestmentStatusButtons({
  onAccept,
  onReject,
  isLoading = false,
}: UpdateInvestmentStatusButtonsProps) {
  return (
    <div className="flex gap-3">
      <BaseButton variant="danger" onClick={onReject} loading={isLoading}>
        {isLoading ? "Odrzucanie..." : "Odrzuć"}
      </BaseButton>
      <BaseButton variant="primary" onClick={onAccept} loading={isLoading}>
        {isLoading ? "Akceptowanie..." : "Akceptuj"}
      </BaseButton>
    </div>
  );
}
