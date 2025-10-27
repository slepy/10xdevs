import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleBadge } from "./RoleBadge";
import { EmptyState } from "./EmptyState";
import type { UserDTO } from "@/types";

interface UsersTableProps {
  users: UserDTO[];
}

/**
 * Komponent tabeli użytkowników dla panelu administracyjnego
 * Wyświetla listę użytkowników z ich danymi: email, imię, nazwisko, rola, data utworzenia
 */
export function UsersTable({ users }: UsersTableProps) {
  // Wyświetl EmptyState jeśli brak użytkowników
  if (users.length === 0) {
    return <EmptyState />;
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

  /**
   * Wyświetla imię i nazwisko lub placeholder jeśli brak
   */
  const formatFullName = (firstName?: string, lastName?: string) => {
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    return fullName || "—";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Imię i nazwisko</TableHead>
            <TableHead>Rola</TableHead>
            <TableHead>Data utworzenia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{formatFullName(user.firstName, user.lastName)}</TableCell>
              <TableCell>
                <RoleBadge role={user.role} />
              </TableCell>
              <TableCell className="text-gray-600">{formatDate(user.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
