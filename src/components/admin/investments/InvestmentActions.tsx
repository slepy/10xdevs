import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BaseButton } from "@/components/base";
import { Badge } from "@/components/ui/badge";
import type { InvestmentStatus } from "@/types";
import { getInvestmentStatusBadge, getAllowedStatusTransitions } from "@/lib/investment-status";

interface InvestmentActionsProps {
  investmentId: string;
  currentStatus: InvestmentStatus;
  onStatusChange: (investmentId: string, newStatus: InvestmentStatus) => void;
}

/**
 * Komponent do zmiany statusu inwestycji
 * Po wyborze nowego statusu pokazuje modal potwierdzający
 */
export function InvestmentActions({ investmentId, currentStatus, onStatusChange }: InvestmentActionsProps) {
  const [selectedStatus, setSelectedStatus] = useState<InvestmentStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pobranie dozwolonych statusów z wspólnej funkcji (używanej też w backendzie)
  const allowedStatuses = getAllowedStatusTransitions(currentStatus);

  /**
   * Obsługuje zmianę wartości w select
   * Otwiera modal potwierdzający
   */
  const handleSelectChange = (value: string) => {
    if (value !== currentStatus) {
      setSelectedStatus(value as InvestmentStatus);
      setIsModalOpen(true);
    }
  };

  /**
   * Potwierdza zmianę statusu
   */
  const handleConfirm = () => {
    if (!selectedStatus) return;

    onStatusChange(investmentId, selectedStatus);
    setIsModalOpen(false);
    setSelectedStatus(null);
  };

  /**
   * Anuluje zmianę statusu
   */
  const handleCancel = () => {
    setSelectedStatus(null);
    setIsModalOpen(false);
  };

  const currentConfig = getInvestmentStatusBadge(currentStatus);
  const selectedConfig = selectedStatus ? getInvestmentStatusBadge(selectedStatus) : null;

  // Jeśli brak możliwości zmiany statusu, wyświetl tylko badge
  if (allowedStatuses.length === 0) {
    return <Badge variant={currentConfig.variant}>{currentConfig.label}</Badge>;
  }

  return (
    <>
      <Select value={currentStatus} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <Badge variant={currentConfig.variant}>{currentConfig.label}</Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Aktualny status */}
          <SelectItem value={currentStatus} disabled>
            <Badge variant={currentConfig.variant}>{currentConfig.label}</Badge>
          </SelectItem>
          {/* Dozwolone statusy */}
          {allowedStatuses.map((status) => {
            const config = getInvestmentStatusBadge(status);
            return (
              <SelectItem key={status} value={status}>
                <Badge variant={config.variant}>{config.label}</Badge>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdzenie zmiany statusu</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz zmienić status inwestycji z{" "}
              <span className="font-semibold">{currentConfig.label}</span> na{" "}
              <span className="font-semibold">{selectedConfig?.label}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <BaseButton variant="outline" onClick={handleCancel}>
              Anuluj
            </BaseButton>
            <BaseButton variant="primary" onClick={handleConfirm}>
              Potwierdź
            </BaseButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
