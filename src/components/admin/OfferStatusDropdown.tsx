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
import { OFFER_STATUSES, type OfferStatus } from "@/types";

interface OfferStatusDropdownProps {
  offerId: string;
  currentStatus: OfferStatus;
  onStatusChange?: (offerId: string, newStatus: OfferStatus) => Promise<void>;
}

/**
 * Komponent dropdown do zmiany statusu oferty
 * Po wyborze nowego statusu pokazuje modal potwierdzający
 */
export function OfferStatusDropdown({ offerId, currentStatus, onStatusChange }: OfferStatusDropdownProps) {
  const [selectedStatus, setSelectedStatus] = useState<OfferStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Zwraca konfigurację badge dla danego statusu oferty
   */
  const getStatusConfig = (status: OfferStatus) => {
    const config = {
      [OFFER_STATUSES.DRAFT]: {
        variant: "secondary" as const,
        label: "Wersja robocza",
      },
      [OFFER_STATUSES.ACTIVE]: {
        variant: "default" as const,
        label: "Aktywna",
      },
      [OFFER_STATUSES.CLOSED]: {
        variant: "destructive" as const,
        label: "Zamknięta",
      },
    };

    return config[status] || { variant: "secondary" as const, label: status };
  };

  /**
   * Obsługuje zmianę wartości w select
   * Otwiera modal potwierdzający
   */
  const handleSelectChange = (value: string) => {
    if (value !== currentStatus) {
      setSelectedStatus(value as OfferStatus);
      setIsModalOpen(true);
    }
  };

  /**
   * Potwierdza zmianę statusu
   */
  const handleConfirm = async () => {
    if (!selectedStatus) return;

    setIsLoading(true);
    try {
      if (onStatusChange) {
        await onStatusChange(offerId, selectedStatus);
      } else {
        // Domyślna implementacja - wywołanie API
        const response = await fetch(`/api/offers/${offerId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: selectedStatus }),
        });

        if (!response.ok) {
          throw new Error("Nie udało się zmienić statusu");
        }

        // Odświeżenie strony po udanej zmianie
        window.location.reload();
      }

      setIsModalOpen(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Błąd podczas zmiany statusu:", error);
      alert("Wystąpił błąd podczas zmiany statusu. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Anuluje zmianę statusu
   */
  const handleCancel = () => {
    setSelectedStatus(null);
    setIsModalOpen(false);
  };

  const currentConfig = getStatusConfig(currentStatus);
  const selectedConfig = selectedStatus ? getStatusConfig(selectedStatus) : null;

  return (
    <>
      <Select value={currentStatus} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <Badge variant={currentConfig.variant}>{currentConfig.label}</Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={OFFER_STATUSES.DRAFT}>
            <Badge variant="secondary">Wersja robocza</Badge>
          </SelectItem>
          <SelectItem value={OFFER_STATUSES.ACTIVE}>
            <Badge variant="default">Aktywna</Badge>
          </SelectItem>
          <SelectItem value={OFFER_STATUSES.CLOSED}>
            <Badge variant="destructive">Zamknięta</Badge>
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potwierdzenie zmiany statusu</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz zmienić status oferty z <span className="font-semibold">{currentConfig.label}</span>{" "}
              na <span className="font-semibold">{selectedConfig?.label}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <BaseButton variant="outline" onClick={handleCancel} disabled={isLoading}>
              Anuluj
            </BaseButton>
            <BaseButton variant="primary" onClick={handleConfirm} loading={isLoading}>
              Potwierdź
            </BaseButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
