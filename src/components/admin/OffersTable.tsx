import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BaseButton } from "@/components/base";
import { EmptyState } from "./EmptyState";
import { OfferStatusDropdown } from "./OfferStatusDropdown";
import type { OfferDTO, OfferStatus } from "@/types";

interface OffersTableProps {
  offers: OfferDTO[];
}

/**
 * Komponent tabeli ofert dla panelu administracyjnego
 * Wyświetla listę ofert z ich danymi: nazwa, status, data zakończenia, akcje
 */
export function OffersTable({ offers }: OffersTableProps) {
  // Wyświetl EmptyState jeśli brak ofert
  if (offers.length === 0) {
    return (
      <EmptyState
        title="Brak dostępnych ofert"
        description="Dodaj pierwszą ofertę, aby rozpocząć zarządzanie inwestycjami."
      />
    );
  }

  /**
   * Formatuje datę ISO do czytelnego formatu polskiego
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";

    try {
      const date = parseISO(dateString);
      return format(date, "dd.MM.yyyy, HH:mm", { locale: pl });
    } catch {
      return "—";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data zakończenia</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => {
            return (
              <TableRow key={offer.id}>
                <TableCell className="font-medium">{offer.name}</TableCell>
                <TableCell>
                  <OfferStatusDropdown offerId={offer.id} currentStatus={offer.status as OfferStatus} />
                </TableCell>
                <TableCell className="text-gray-600">{formatDate(offer.end_at)}</TableCell>
                <TableCell className="text-right">
                  <a href={`/admin/offers/${offer.id}/edit`}>
                    <BaseButton variant="ghost" size="sm">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edytuj
                    </BaseButton>
                  </a>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
