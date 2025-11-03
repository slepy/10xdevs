import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { UserDTO } from "@/types";

interface UserInfoCardProps {
  user: UserDTO;
}

/**
 * Wyświetla dane użytkownika, który złożył inwestycję
 * Komponent widoczny tylko dla administratora
 */
export function UserInfoCard({ user }: UserInfoCardProps) {
  const registrationDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const fullName =
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "Brak danych";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informacje o inwestorze</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Imię i nazwisko</div>
            <div className="text-lg font-medium">{fullName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Email</div>
            <div className="text-lg font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Rola</div>
            <div className="text-lg font-medium capitalize">{user.role}</div>
          </div>
          {registrationDate && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Data rejestracji</div>
              <div className="text-lg font-medium">{registrationDate}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
