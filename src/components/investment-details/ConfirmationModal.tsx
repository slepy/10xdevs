import { useEffect } from "react";
import { BaseButton } from "@/components/base/BaseButton";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal dialogowy do potwierdzania przez użytkownika wykonania krytycznej akcji
 * (np. anulowanie, zmiana statusu)
 */
export function ConfirmationModal({ isOpen, title, description, onConfirm, onCancel }: ConfirmationModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <p id="modal-description" className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <BaseButton variant="outline" onClick={onCancel}>
            Anuluj
          </BaseButton>
          <BaseButton variant="primary" onClick={onConfirm}>
            Potwierdź
          </BaseButton>
        </div>
      </div>
    </div>
  );
}
