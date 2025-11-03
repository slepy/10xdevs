import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { UserRole, InvestmentStatus } from "@/types";
import { USER_ROLES } from "@/types";
import { InvestmentFilesUpload } from "./InvestmentFilesUpload";
import { InvestmentFilesList } from "./InvestmentFilesList";

interface InvestmentFilesCardProps {
  investmentId: string;
  userRole: UserRole;
  investmentStatus: InvestmentStatus;
  refreshTrigger: number;
  onUploadSuccess: () => void;
}

/**
 * Wyświetla sekcję z plikami inwestycji
 * Upload plików dostępny tylko dla adminów i tylko gdy inwestycja jest zaakceptowana (nie zakończona)
 * Lista plików dostępna dla adminów i signerów w trybie odczytu gdy inwestycja jest zakończona
 */
export function InvestmentFilesCard({
  investmentId,
  userRole,
  investmentStatus,
  refreshTrigger,
  onUploadSuccess,
}: InvestmentFilesCardProps) {
  // Upload możliwy tylko gdy inwestycja jest zaakceptowana (nie zakończona)
  const canUpload = userRole === USER_ROLES.ADMIN && investmentStatus === "accepted";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pliki inwestycji</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload plików - tylko dla adminów i tylko gdy inwestycja jest zaakceptowana */}
        {canUpload && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Dodaj plik</h3>
            <InvestmentFilesUpload investmentId={investmentId} onUploadSuccess={onUploadSuccess} />
          </div>
        )}

        {/* Lista plików - dla adminów i signerów (tylko odczyt gdy zakończona) */}
        <InvestmentFilesList investmentId={investmentId} userRole={userRole} refreshTrigger={refreshTrigger} />
      </CardContent>
    </Card>
  );
}
