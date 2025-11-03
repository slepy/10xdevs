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
import { InvestmentFilesCard } from "./InvestmentFilesCard";

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
    status: dto.status as InvestmentStatus,
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
    type: "cancel" | "accept" | "reject" | "complete";
    payload?: InvestmentStatus;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0);

  // Obsługa otwarcia modala dla anulowania
  const handleCancelClick = () => {
    setActionToConfirm({ type: "cancel" });
    setIsModalOpen(true);
  };

  // Obsługa otwarcia modala dla zmiany statusu
  const handleStatusChangeClick = (newStatus: InvestmentStatus) => {
    let type: "accept" | "reject" | "complete";

    if (newStatus === "accepted") {
      type = "accept";
    } else if (newStatus === "completed") {
      type = "complete";
    } else {
      type = "reject";
    }

    setActionToConfirm({
      type,
      payload: newStatus,
    });
    setIsModalOpen(true);
  };

  // Potwierdzenie akcji w modalu
  const handleConfirmAction = async (reason?: string) => {
    if (!actionToConfirm) return;

    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      let response: Response;

      if (actionToConfirm.type === "cancel") {
        // Anulowanie przez użytkownika (signer)
        response = await fetch(`/api/investments/${investmentId}/cancel`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        });
      } else {
        // Akceptacja, odrzucenie lub zakończenie przez admina
        const payload: { status: string; reason?: string } = {
          status: actionToConfirm.payload || "accepted",
        };

        // Dodaj reason tylko dla odrzucenia
        if (actionToConfirm.payload === "rejected" && reason) {
          payload.reason = reason;
        }

        response = await fetch(`/api/investments/${investmentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Wystąpił błąd podczas wykonywania operacji");
      }

      // Po sukcesie: odśwież dane i pokaż komunikat
      await refetch();
      setIsModalOpen(false);
      setActionToConfirm(null);

      const successMessages = {
        cancel: "Inwestycja została anulowana",
        accept: "Inwestycja została zaakceptowana",
        reject: "Inwestycja została odrzucona",
        complete: "Inwestycja została zakończona",
      };
      setActionSuccess(successMessages[actionToConfirm.type]);

      // Automatyczne ukrycie komunikatu po 5 sekundach
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
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

  // Generowanie tytułu, opisu i konfiguracji modala
  const getModalContent = () => {
    if (!actionToConfirm)
      return { title: "", description: "", requiresReason: false, reasonLabel: "", reasonPlaceholder: "" };

    switch (actionToConfirm.type) {
      case "cancel":
        return {
          title: "Anuluj inwestycję",
          description: "Czy na pewno chcesz anulować tę inwestycję? Ta operacja jest nieodwracalna.",
          requiresReason: true,
          reasonLabel: "Powód anulowania",
          reasonPlaceholder: "Wprowadź powód anulowania inwestycji...",
        };
      case "accept":
        return {
          title: "Akceptuj inwestycję",
          description: "Czy na pewno chcesz zaakceptować tę inwestycję?",
          requiresReason: false,
          reasonLabel: "",
          reasonPlaceholder: "",
        };
      case "reject":
        return {
          title: "Odrzuć inwestycję",
          description: "Czy na pewno chcesz odrzucić tę inwestycję? Ta operacja jest nieodwracalna.",
          requiresReason: true,
          reasonLabel: "Powód odrzucenia",
          reasonPlaceholder: "Wprowadź powód odrzucenia inwestycji...",
        };
      case "complete":
        return {
          title: "Zakończ inwestycję",
          description: "Czy na pewno chcesz zakończyć tę inwestycję?",
          requiresReason: false,
          reasonLabel: "",
          reasonPlaceholder: "",
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

  // Handler dla odświeżenia listy plików po uploadu
  const handleUploadSuccess = () => {
    setFilesRefreshTrigger((prev) => prev + 1);
  };

  // Sprawdź czy inwestycja jest zaakceptowana lub zakończona (wtedy można przeglądać pliki)
  const isAccepted = investment.status === "accepted";
  const isCompleted = investment.status === "completed";
  const canViewFiles = isAccepted || isCompleted;

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
        {canViewFiles && (
          <InvestmentFilesCard
            investmentId={investmentId}
            userRole={userRole}
            investmentStatus={investment.status}
            refreshTrigger={filesRefreshTrigger}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
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
        requiresReason={modalContent.requiresReason}
        reasonLabel={modalContent.reasonLabel}
        reasonPlaceholder={modalContent.reasonPlaceholder}
      />
    </div>
  );
}
