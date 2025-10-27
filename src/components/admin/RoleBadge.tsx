import { Badge } from "@/components/ui/badge";
import { USER_ROLES, type UserRole } from "@/types";

interface RoleBadgeProps {
  role: UserRole;
}

/**
 * Komponent wyświetlający badge z rolą użytkownika
 * Admin - czerwony badge (destructive)
 * Signer - niebieski badge (default)
 */
export function RoleBadge({ role }: RoleBadgeProps) {
  const isAdmin = role === USER_ROLES.ADMIN;

  return (
    <Badge variant={isAdmin ? "destructive" : "default"}>
      {isAdmin ? "Administrator" : "Inwestor"}
    </Badge>
  );
}
