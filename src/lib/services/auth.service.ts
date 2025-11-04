import type { SupabaseClient } from "../../db/supabase.client";
import { USER_ROLES, type UserDTO, type AuthResponseDTO, type UserRole } from "../../types";

/**
 * Service do zarządzania autoryzacją i uwierzytelnianiem użytkowników
 */
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Rejestruje nowego użytkownika w systemie
   * @param firstName Imię użytkownika
   * @param lastName Nazwisko użytkownika
   * @param email Adres e-mail
   * @param password Hasło
   * @returns Dane użytkownika i sesji lub null jeśli wymagana jest potwierdzenie e-maila
   */
  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<{ user: UserDTO; session: AuthResponseDTO["session"] } | null> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          role: USER_ROLES.SIGNER,
        },
      },
    });

    if (error) {
      throw this.handleAuthError(error.message);
    }

    if (!data.user) {
      throw new Error("Rejestracja nie powiodła się");
    }

    // Email confirmation required
    if (data.user && !data.session) {
      return null;
    }

    // User registered and logged in immediately
    if (data.session) {
      await this.supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      return {
        user: this.mapUserToDTO(data.user),
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || 0,
        },
      };
    }

    return null;
  }

  /**
   * Loguje użytkownika do systemu
   * @param email Adres e-mail
   * @param password Hasło
   * @returns Dane użytkownika i sesji
   */
  async login(email: string, password: string): Promise<{ user: UserDTO; session: AuthResponseDTO["session"] }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw this.handleAuthError(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error("Logowanie nie powiodło się");
    }

    return {
      user: this.mapUserToDTO(data.user),
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
      },
    };
  }

  /**
   * Wylogowuje użytkownika z systemu
   */
  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new Error("Błąd podczas wylogowywania");
    }
  }

  /**
   * Zmienia hasło użytkownika
   * @param currentPassword Aktualne hasło
   * @param newPassword Nowe hasło
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Najpierw weryfikujemy aktualne hasło poprzez próbę logowania
    const { data: currentUser } = await this.supabase.auth.getUser();

    if (!currentUser.user?.email) {
      throw new Error("Nie można zidentyfikować użytkownika");
    }

    // Weryfikacja aktualnego hasła poprzez próbę logowania
    const { error: verifyError } = await this.supabase.auth.signInWithPassword({
      email: currentUser.user.email,
      password: currentPassword,
    });

    if (verifyError) {
      throw new Error("Aktualne hasło jest nieprawidłowe");
    }

    // Jeśli weryfikacja się udała, aktualizujemy hasło
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw this.handleAuthError(updateError.message);
    }
  }

  /**
   * Mapuje dane użytkownika z Supabase Auth do DTO
   * @param user Użytkownik z Supabase Auth
   * @returns UserDTO
   */
  private mapUserToDTO(user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
    created_at: string;
    updated_at?: string;
  }): UserDTO {
    return {
      id: user.id,
      email: user.email || "",
      firstName: (user.user_metadata?.firstName as string) || (user.user_metadata?.first_name as string) || "",
      lastName: (user.user_metadata?.lastName as string) || (user.user_metadata?.last_name as string) || "",
      role: ((user.user_metadata?.role as string) ||
        (user.app_metadata?.role as string) ||
        USER_ROLES.SIGNER) as UserRole,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Obsługuje błędy autoryzacji i zwraca przyjazne komunikaty
   * @param errorMessage Wiadomość błędu z Supabase
   * @returns Error z dostosowanym komunikatem
   */
  private handleAuthError(errorMessage: string): Error {
    switch (errorMessage) {
      case "User already registered":
        return new Error("Użytkownik o tym adresie e-mail już istnieje");
      case "Password should be at least 6 characters":
        return new Error("Hasło musi mieć co najmniej 6 znaków");
      case "Invalid email":
        return new Error("Nieprawidłowy format adresu e-mail");
      case "Signup is disabled":
        return new Error("Rejestracja jest obecnie wyłączona");
      case "Invalid login credentials":
        return new Error("Nieprawidłowy e-mail lub hasło");
      case "Email not confirmed":
        return new Error("E-mail nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.");
      case "Too many requests":
        return new Error("Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.");
      default:
        if (errorMessage.includes("already been registered")) {
          return new Error("Użytkownik o tym adresie e-mail już istnieje");
        }
        return new Error(errorMessage);
    }
  }
}
