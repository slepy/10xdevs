import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvestmentForm } from "./InvestmentForm";
import { BaseAlert } from "@/components/base/BaseAlert";
import type { CreateInvestmentDTO, InvestmentDTO, ApiResponse, ApiErrorResponse, ValidationError } from "@/types";

/**
 * Props dla komponentu InvestmentModal
 */
export interface InvestmentModalProps {
  offerId: string; // ID oferty do inwestycji
  minimumInvestment: number; // Minimalna kwota inwestycji (w PLN)
  children: React.ReactNode; // Przycisk trigger (DialogTrigger)
}

/**
 * InvestmentModal - główny komponent modalu inwestycyjnego
 *
 * Odpowiedzialny za zarządzanie stanem otwarcia/zamknięcia, orkiestrację formularza
 * i komunikację z API. Renderuje Dialog z shadcn/ui oraz zawiera logikę biznesową
 * związaną z procesem inwestycyjnym.
 *
 * @example
 * ```tsx
 * <InvestmentModal offerId="123" minimumInvestment={1000}>
 *   <button>Inwestuj teraz</button>
 * </InvestmentModal>
 * ```
 */
export function InvestmentModal({ offerId, minimumInvestment, children }: InvestmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obsługa submisji inwestycji
   */
  const handleInvestmentSubmit = async (amount: number) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offer_id: offerId,
          amount: amount,
        } satisfies CreateInvestmentDTO),
      });

      const result: ApiResponse<InvestmentDTO> | ApiErrorResponse = await response.json();

      if (!response.ok) {
        // Obsługa błędów walidacji
        if (response.status === 400 && "details" in result) {
          const validationErrors = (result as ApiErrorResponse).details;
          const errorMessages = validationErrors?.map((e: ValidationError) => e.message).join(", ");
          setError(errorMessages || result.error || "Wystąpił błąd walidacji");
        } else if (response.status === 401) {
          setError("Musisz być zalogowany, aby dokonać inwestycji");
        } else if (response.status === 404) {
          setError("Nie znaleziono oferty");
        } else {
          setError(result.message || result.error || "Wystąpił błąd podczas tworzenia inwestycji");
        }
        return;
      }

      // Sukces - zamknij modal i przekieruj
      setIsOpen(false);
      window.location.href = "/investments";
    } catch {
      setError("Wystąpił błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Obsługa anulowania inwestycji
   */
  const handleCancel = () => {
    setIsOpen(false);
  };

  /**
   * Obsługa zmiany stanu modalu
   * Reset błędów przy zamknięciu
   */
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Inwestuj w ofertę</DialogTitle>
          <DialogDescription>
            Wprowadź kwotę, którą chcesz zainwestować w tę ofertę. Po zatwierdzeniu Twoja inwestycja zostanie przesłana
            do rozpatrzenia.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <BaseAlert variant="error" className="mt-4">
            {error}
          </BaseAlert>
        )}

        <InvestmentForm
          minimumInvestment={minimumInvestment}
          isSubmitting={isSubmitting}
          onSubmit={handleInvestmentSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
