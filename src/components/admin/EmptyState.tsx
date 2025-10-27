import { Users } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

/**
 * Komponent wyświetlający stan pustej listy użytkowników
 */
export function EmptyState({
  title = "Brak zarejestrowanych użytkowników",
  description = "Nie znaleziono żadnych użytkowników w systemie.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
      <Users className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
