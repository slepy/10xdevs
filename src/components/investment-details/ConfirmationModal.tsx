import { useEffect, useState } from "react";
import { BaseButton } from "@/components/base/BaseButton";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  requiresReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
}

/**
 * Modal dialogowy do potwierdzania przez użytkownika wykonania krytycznej akcji
 * (np. anulowanie, zmiana statusu)
 */
export function ConfirmationModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  requiresReason = false,
  reasonLabel = "Powód",
  reasonPlaceholder = "Wprowadź powód...",
}: ConfirmationModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset stanu przy zamknięciu modala
  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  // Blokowanie scrollowania gdy modal jest otwarty
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Obsługa klawisza Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  // Obsługa potwierdzenia z walidacją
  const handleConfirm = () => {
    if (requiresReason && !reason.trim()) {
      setError("To pole jest wymagane");
      return;
    }

    if (requiresReason && reason.trim().length < 10) {
      setError("Powód musi mieć co najmniej 10 znaków");
      return;
    }

    onConfirm(reason.trim() || undefined);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="button"
      aria-label="Close dialog"
      tabIndex={0}
      onClick={(e) => {
        // Only close when clicking the overlay itself, not child elements
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onCancel();
        }
      }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        tabIndex={-1}
      >
        <div className="mb-4">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <p id="modal-description" className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        {requiresReason && (
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {reasonLabel}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder={reasonPlaceholder}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
              aria-describedby={error ? "reason-error" : undefined}
              aria-invalid={error ? "true" : "false"}
            />
            {error && (
              <p id="reason-error" className="mt-1 text-sm text-red-500">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <BaseButton variant="outline" onClick={onCancel}>
            Anuluj
          </BaseButton>
          <BaseButton variant="primary" onClick={handleConfirm}>
            Potwierdź
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
