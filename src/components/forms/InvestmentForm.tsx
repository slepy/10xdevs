import { useState, useMemo, type FormEvent } from "react";
import { BaseFormField } from "@/components/base/BaseFormField";
import { BaseButton } from "@/components/base/BaseButton";
import { formatCurrency } from "@/lib/utils";
import { investmentAmountSchema } from "@/lib/validators/investments.validator";

/**
 * Props dla komponentu InvestmentForm
 */
export interface InvestmentFormProps {
  minimumInvestment: number; // Minimalna kwota (w PLN)
  isSubmitting: boolean; // Czy trwa wysyłanie
  onSubmit: (amount: number) => Promise<void>; // Callback submisji
  onCancel: () => void; // Callback anulowania
}

/**
 * InvestmentForm - komponent formularza inwestycyjnego
 *
 * Zawiera pole do wprowadzenia kwoty inwestycji oraz przyciski akcji.
 * Zarządza lokalnym stanem pola kwoty i walidacją przed submisją przy użyciu Zod.
 *
 * @example
 * ```tsx
 * <InvestmentForm
 *   minimumInvestment={1000}
 *   isSubmitting={false}
 *   onSubmit={async (amount) => { await createInvestment(amount); }}
 *   onCancel={() => setIsOpen(false)}
 * />
 * ```
 */
export function InvestmentForm({ minimumInvestment, isSubmitting, onSubmit, onCancel }: InvestmentFormProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [validationError, setValidationError] = useState("");

  // Memoizowany schema walidacji z parametrem minimumInvestment
  const amountSchema = useMemo(() => investmentAmountSchema(minimumInvestment), [minimumInvestment]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Walidacja z użyciem Zod
    const result = amountSchema.safeParse(amount);

    if (!result.success) {
      // Wyciągnięcie pierwszego błędu walidacji
      const firstError = result.error.errors[0];
      setValidationError(firstError.message);
      return;
    }

    // Wywołanie callback z rodzica
    await onSubmit(result.data);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value === "" ? "" : Number(value));
    // Usunięcie błędu walidacji po zmianie wartości
    if (validationError) {
      setValidationError("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BaseFormField
        label="Kwota inwestycji (PLN)"
        error={validationError}
        helpText={`Minimalna kwota inwestycji: ${formatCurrency(minimumInvestment)}`}
        inputProps={{
          type: "number",
          min: minimumInvestment,
          step: "0.01",
          placeholder: "Wpisz kwotę",
          value: amount,
          onChange: handleAmountChange,
          disabled: isSubmitting,
          "aria-required": "true",
        }}
        data-testid="investment-form-amount"
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <BaseButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Anuluj
        </BaseButton>
        <BaseButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          loading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Inwestuj
        </BaseButton>
      </div>
    </form>
  );
}
