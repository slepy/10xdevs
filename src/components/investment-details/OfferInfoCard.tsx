import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { OfferDTO } from "@/types";

interface OfferInfoCardProps {
  offer: OfferDTO;
}

/**
 * Wyświetla informacje o ofercie powiązanej z inwestycją
 */
export function OfferInfoCard({ offer }: OfferInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o ofercie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Nazwa oferty</div>
            <div className="text-xl font-semibold">{offer.name}</div>
          </div>
          {offer.description && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Opis</div>
              <div className="text-base">{offer.description}</div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Kwota docelowa</div>
              <div className="text-lg font-medium">{formatCurrency(offer.target_amount)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Minimalna inwestycja</div>
              <div className="text-lg font-medium">{formatCurrency(offer.minimum_investment)}</div>
            </div>
          </div>
          <div>
            <a
              href={`/offers/${offer.id}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium inline-flex items-center gap-1"
            >
              Zobacz szczegóły oferty
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
