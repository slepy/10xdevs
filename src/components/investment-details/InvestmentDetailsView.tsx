import { useState } from "react";
import type { UserRole, InvestmentDetailsViewModel, InvestmentDetailsDTO, InvestmentStatus } from "@/types";
import { useInvestmentDetails } from "../hooks/useInvestmentDetails";
import { InvestmentStatusBadge } from "./InvestmentStatusBadge";
import { InvestmentActions } from "./InvestmentActions";
import { InvestmentInfoCard } from "./InvestmentInfoCard";
import { OfferInfoCard } from "./OfferInfoCard";
import { UserInfoCard } from "./UserInfoCard";
import { ConfirmationModal } from "./ConfirmationModal";
import { BaseAlert } from "@/components/base/BaseAlert";

interface InvestmentDetailsViewProps {
  investmentId: string;
  userRole: UserRole;
}

/**
 * Mapuje InvestmentDetailsDTO z API na InvestmentDetailsViewModel
 */
function mapToViewModel(dto: InvestmentDetailsDTO, userRole: UserRole): InvestmentDetailsViewModel {
  return {
    id: dto.id,
    amount: dto.amount,
    status: dto.status,
    created_at: dto.created_at,
    completed_at: dto.completed_at,
    reason: dto.reason,
    offer: dto.offer,
    user: userRole === "admin" ? dto.user : undefined,
  };
}

/**
 * Główny komponent Reactowy widoku szczegółów inwestycji
 * Pobiera dane inwestycji, zarządza stanem i renderuje podkomponenty
 */
export function InvestmentDetailsView({ investmentId, userRole }: InvestmentDetailsViewProps) {
  const { data, isLoading, isError, error, refetch } = useInvestmentDetails(investmentId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<{
    type: "cancel" | "accept" | "reject";
    payload?: InvestmentStatus;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Obsługa otwarcia modala dla anulowania
  const handleCancelClick = () => {
    setActionToConfirm({ type: "cancel" });
    setIsModalOpen(true);
  };

  // Obsługa otwarcia modala dla zmiany statusu
  const handleStatusChangeClick = (newStatus: InvestmentStatus) => {
    setActionToConfirm({
      type: newStatus === "accepted" ? "accept" : "reject",
      payload: newStatus,
    });
    setIsModalOpen(true);
  };

  // Potwierdzenie akcji w modalu
  const handleConfirmAction = async () => {
    if (!actionToConfirm) return;

    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // TODO: Wywołanie API dla anulowania/zmiany statusu
      // Obecnie tylko symulacja - endpointy PUT będą dodane później
      console.log("Executing action:", actionToConfirm);

      // Symulacja opóźnienia API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Po sukcesie: odśwież dane i pokaż komunikat
      refetch();
      setIsModalOpen(false);
      setActionToConfirm(null);

      const successMessages = {
        cancel: "Inwestycja została anulowana",
        accept: "Inwestycja została zaakceptowana",
        reject: "Inwestycja została odrzucona",
      };
      setActionSuccess(successMessages[actionToConfirm.type]);

      // Automatyczne ukrycie komunikatu po 5 sekundach
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      console.error("Action failed:", err);
      setActionError(err instanceof Error ? err.message : "Wystąpił błąd podczas wykonywania operacji");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Anulowanie akcji w modalu
  const handleCancelAction = () => {
    setIsModalOpen(false);
    setActionToConfirm(null);
  };

  // Generowanie tytułu i opisu modala
  const getModalContent = () => {
    if (!actionToConfirm) return { title: "", description: "" };

    switch (actionToConfirm.type) {
      case "cancel":
        return {
          title: "Anuluj inwestycję",
          description: "Czy na pewno chcesz anulować tę inwestycję? Ta operacja jest nieodwracalna.",
        };
      case "accept":
        return {
          title: "Akceptuj inwestycję",
          description: "Czy na pewno chcesz zaakceptować tę inwestycję?",
        };
      case "reject":
        return {
          title: "Odrzuć inwestycję",
          description: "Czy na pewno chcesz odrzucić tę inwestycję? Ta operacja jest nieodwracalna.",
        };
    }
  };

  // Stan ładowania
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Szczegóły Inwestycji</h1>
          <p className="text-muted-foreground mt-2">Ładowanie...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  // Stan błędu
  if (isError || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Szczegóły Inwestycji</h1>
        </div>
        <BaseAlert variant="error" title="Błąd">
          {error || "Nie udało się pobrać szczegółów inwestycji"}
        </BaseAlert>
      </div>
    );
  }

  // Mapowanie danych
  const investment = mapToViewModel(data, userRole);
  const modalContent = getModalContent();

  return (
    <div className="space-y-6">
      {/* Nagłówek z tytułem i statusem */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Szczegóły Inwestycji</h1>
          <p className="text-muted-foreground mt-2">ID: {investmentId}</p>
        </div>
        <InvestmentStatusBadge status={investment.status} />
      </div>

      {/* Komunikaty sukcesu/błędu */}
      {actionSuccess && (
        <BaseAlert variant="success" title="Sukces" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </BaseAlert>
      )}
      {actionError && (
        <BaseAlert variant="error" title="Błąd" onClose={() => setActionError(null)}>
          {actionError}
        </BaseAlert>
      )}

      {/* Przyciski akcji */}
      <InvestmentActions
        investment={investment}
        userRole={userRole}
        onCancel={handleCancelClick}
        onStatusChange={handleStatusChangeClick}
        isLoading={isActionLoading}
      />

      {/* Karty z informacjami */}
      <div className="grid grid-cols-1 gap-6">
        <InvestmentInfoCard investment={investment} />
        <OfferInfoCard offer={investment.offer} />
        {userRole === "admin" && investment.user && <UserInfoCard user={investment.user} />}
      </div>

      {/* Modal potwierdzenia */}
      <ConfirmationModal
        isOpen={isModalOpen}
        title={modalContent.title}
        description={modalContent.description}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </div>
  );
}
