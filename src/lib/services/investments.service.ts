import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateInvestmentInput,
  InvestmentQueryParams,
  UpdateInvestmentStatusInput,
  CancelInvestmentInput,
} from "../validators/investments.validator";
import type {
  InvestmentDTO,
  InvestmentListResponse,
  UserInvestmentListResponse,
  InvestmentWithOfferNameDTO,
  InvestmentWithRelationsDTO,
  AdminInvestmentListResponse,
  InvestmentDetailsDTO,
  OfferDTO,
  UserDTO,
  InvestmentStatus,
} from "../../types";
import { INVESTMENT_STATUSES, OFFER_STATUSES } from "../../types";
import { convertToSatoshi, convertFromSatoshi, formatCurrency } from "../utils";
import { getAllowedStatusTransitions } from "../investment-status";

/**
 * Serwis do zarządzania inwestycjami
 */
export class InvestmentsService {
  /**
   * Mapowanie statusów admina (z API) na statusy systemowe (w bazie danych)
   */
  private static readonly STATUS_MAPPING: Record<string, string> = {
    accepted: INVESTMENT_STATUSES.ACCEPTED,
    rejected: INVESTMENT_STATUSES.REJECTED,
    closed: INVESTMENT_STATUSES.COMPLETED,
  };

  constructor(private supabase: SupabaseClient) {}

  /**
   * Tworzy nową inwestycję
   * @param data Dane inwestycji po walidacji
   * @param userId ID użytkownika z sesji
   * @returns Utworzona inwestycja lub błąd
   */
  async createInvestment(data: CreateInvestmentInput, userId: string): Promise<InvestmentDTO> {
    try {
      // 1. Pobranie oferty z bazy (z potrzebnymi polami do walidacji)
      const { data: offer, error: offerError } = await this.supabase
        .from("offers")
        .select("id, status, end_at, minimum_investment")
        .eq("id", data.offer_id)
        .single();

      // 2. Sprawdzenie czy oferta istnieje
      if (offerError || !offer) {
        throw new Error("Nie znaleziono oferty o podanym ID");
      }

      // 3. Sprawdzenie czy oferta jest aktywna
      if (offer.status !== OFFER_STATUSES.ACTIVE) {
        throw new Error("Ta oferta nie jest dostępna do inwestycji");
      }

      // 4. Sprawdzenie czy oferta nie wygasła
      const now = new Date();
      const endDate = new Date(offer.end_at);
      if (endDate <= now) {
        throw new Error("Oferta jest już nieaktywna");
      }

      // 5. Sprawdzenie minimalnej kwoty (przed konwersją na centy)
      const offerMinimumInPln = convertFromSatoshi(offer.minimum_investment);
      if (data.amount < offerMinimumInPln) {
        throw new Error(`Kwota inwestycji musi wynosić co najmniej ${formatCurrency(offerMinimumInPln)}`);
      }

      // 6. Konwersja kwoty z PLN na centy
      const amountInCents = convertToSatoshi(data.amount);

      // 7. Utworzenie inwestycji
      const { data: investment, error: insertError } = await this.supabase
        .from("investments")
        .insert({
          user_id: userId,
          offer_id: data.offer_id,
          amount: amountInCents,
          status: INVESTMENT_STATUSES.PENDING,
        })
        .select()
        .single();

      if (insertError || !investment) {
        throw new Error("Nie udało się utworzyć inwestycji");
      }

      // 8. Konwersja kwoty z powrotem na PLN przed zwróceniem
      return {
        ...investment,
        amount: convertFromSatoshi(investment.amount),
      };
    } catch (error) {
      // Re-throw z kontekstem
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas tworzenia inwestycji");
    }
  }

  /**
   * Pobiera inwestycje zalogowanego użytkownika z paginacją i filtrowaniem
   * @param userId ID użytkownika z sesji
   * @param params Parametry zapytania (page, limit, status)
   * @returns Lista inwestycji użytkownika z metadanymi paginacji i nazwą oferty
   */
  async getUserInvestments(userId: string, params: InvestmentQueryParams): Promise<UserInvestmentListResponse> {
    try {
      const { page, limit, status } = params;
      const offset = (page - 1) * limit;

      // Budowanie zapytania z filtrowaniem po user_id i dołączeniem nazwy oferty
      let query = this.supabase.from("investments").select("*, offers(name)", { count: "exact" }).eq("user_id", userId);

      // Opcjonalne filtrowanie po statusie
      if (status) {
        query = query.eq("status", status);
      }

      // Sortowanie (najnowsze najpierw) i paginacja
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Błąd podczas pobierania inwestycji: ${error.message}`);
      }

      const investments = (data as InvestmentWithOfferNameDTO[]) ?? [];

      // Konwersja kwot z centów na PLN przed zwróceniem
      const investmentsWithConvertedAmounts = investments.map((investment) => ({
        ...investment,
        amount: convertFromSatoshi(investment.amount),
      }));

      const totalPages = Math.ceil((count ?? 0) / limit);

      return {
        data: investmentsWithConvertedAmounts,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas pobierania inwestycji użytkownika");
    }
  }

  /**
   * Pobiera wszystkie inwestycje z paginacją i filtrowaniem (tylko dla admina)
   * @param params Parametry zapytania (page, limit, status)
   * @returns Lista wszystkich inwestycji z metadanymi paginacji
   */
  async getAllInvestments(params: InvestmentQueryParams): Promise<InvestmentListResponse> {
    try {
      const { page, limit, status } = params;
      const offset = (page - 1) * limit;

      // Budowanie zapytania bez filtrowania po user_id (admin widzi wszystkie)
      let query = this.supabase.from("investments").select("*", { count: "exact" });

      // Opcjonalne filtrowanie po statusie
      if (status) {
        query = query.eq("status", status);
      }

      // Sortowanie (najnowsze najpierw) i paginacja
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Błąd podczas pobierania inwestycji: ${error.message}`);
      }

      const investments = (data as InvestmentDTO[]) ?? [];

      // Konwersja kwot z centów na PLN przed zwróceniem
      const investmentsWithConvertedAmounts = investments.map((investment) => ({
        ...investment,
        amount: convertFromSatoshi(investment.amount),
      }));

      const totalPages = Math.ceil((count ?? 0) / limit);

      return {
        data: investmentsWithConvertedAmounts,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas pobierania wszystkich inwestycji");
    }
  }

  /**
   * Pobiera wszystkie inwestycje z danymi użytkowników i ofert (dla adminów)
   * @param params Parametry zapytania (page, limit, status, offer_id, filter)
   * @returns Lista inwestycji z danymi relacji i metadanymi paginacji
   */
  async getAdminInvestments(params: InvestmentQueryParams): Promise<AdminInvestmentListResponse> {
    try {
      const { page, limit, status, offer_id, filter } = params;
      const offset = (page - 1) * limit;

      // Budowanie zapytania z relacjami do offers i users_view
      let query = this.supabase
        .from("investments")
        .select("*, offers(name), users_view(id, email, role, first_name, last_name)", { count: "exact" });

      // Opcjonalne filtrowanie po statusie
      if (status) {
        query = query.eq("status", status);
      }

      // Opcjonalne filtrowanie po offer_id
      if (offer_id) {
        query = query.eq("offer_id", offer_id);
      }

      // Opcjonalne filtrowanie po emailu użytkownika lub nazwie oferty (text search)
      if (filter) {
        // Ten typ filtrowania wymaga full-text search lub OR conditions
        // Supabase nie wspiera bezpośrednio OR w query builder, więc użyjemy ilike
        query = query.or(`users_view.email.ilike.%${filter}%,offers.name.ilike.%${filter}%`);
      }

      // Sortowanie (najnowsze najpierw) i paginacja
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Błąd podczas pobierania inwestycji: ${error.message}`);
      }

      const investments = (data as InvestmentWithRelationsDTO[]) ?? [];

      // Konwersja kwot z centów na PLN przed zwróceniem
      const investmentsWithConvertedAmounts = investments.map((investment) => ({
        ...investment,
        amount: convertFromSatoshi(investment.amount),
      }));

      const totalPages = Math.ceil((count ?? 0) / limit);

      return {
        data: investmentsWithConvertedAmounts,
        pagination: {
          page,
          limit,
          total: count ?? 0,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas pobierania inwestycji dla admina");
    }
  }

  /**
   * Pobiera szczegółowe informacje o konkretnej inwestycji
   * @param investmentId ID inwestycji do pobrania
   * @param userId ID zalogowanego użytkownika
   * @param isAdmin Czy użytkownik jest adminem
   * @returns Szczegółowe dane inwestycji z powiązaną ofertą i użytkownikiem
   * @throws Error jeśli inwestycja nie istnieje lub użytkownik nie ma dostępu
   */
  async getInvestmentDetails(investmentId: string, userId: string, isAdmin: boolean): Promise<InvestmentDetailsDTO> {
    try {
      // 1. Pobranie inwestycji z pełnymi danymi oferty i użytkownika
      const { data: investment, error } = await this.supabase
        .from("investments")
        .select(
          `
          *,
          offers(*),
          users_view(id, email, role, first_name, last_name)
        `
        )
        .eq("id", investmentId)
        .single();

      // 2. Sprawdzenie czy inwestycja istnieje
      if (error || !investment) {
        throw new Error("Inwestycja o podanym ID nie istnieje");
      }

      // 3. Sprawdzenie autoryzacji - czy użytkownik ma dostęp do tej inwestycji
      if (!isAdmin && investment.user_id !== userId) {
        throw new Error("Brak dostępu - nie masz uprawnień do przeglądania tej inwestycji");
      }

      // 4. Sprawdzenie czy dane relacji zostały pobrane
      if (!investment.offers) {
        throw new Error("Nie udało się pobrać danych oferty powiązanej z inwestycją");
      }

      if (!investment.users_view) {
        throw new Error("Nie udało się pobrać danych użytkownika powiązanego z inwestycją");
      }

      // 5. Walidacja wymaganych pól użytkownika z users_view
      if (!investment.users_view.id || !investment.users_view.email || !investment.users_view.role) {
        throw new Error("Brakujące dane użytkownika w rekordzie inwestycji");
      }

      // 6. Konwersja kwot z centów na PLN
      const investmentAmount = convertFromSatoshi(investment.amount);
      const offerTargetAmount = convertFromSatoshi(investment.offers.target_amount);
      const offerMinInvestment = convertFromSatoshi(investment.offers.minimum_investment);

      // 7. Mapowanie danych użytkownika z users_view do UserDTO (konwersja snake_case na camelCase)
      const userDTO: UserDTO = {
        id: investment.users_view.id,
        email: investment.users_view.email,
        firstName: investment.users_view.first_name ?? undefined,
        lastName: investment.users_view.last_name ?? undefined,
        role: investment.users_view.role as "admin" | "signer",
      };

      // 8. Mapowanie danych oferty z konwersją kwot
      const offerDTO: OfferDTO = {
        ...investment.offers,
        target_amount: offerTargetAmount,
        minimum_investment: offerMinInvestment,
      };

      // 9. Zwrócenie pełnych danych inwestycji
      return {
        id: investment.id,
        user_id: investment.user_id,
        offer_id: investment.offer_id,
        amount: investmentAmount,
        status: investment.status,
        created_at: investment.created_at,
        updated_at: investment.updated_at,
        completed_at: investment.completed_at,
        reason: investment.reason,
        deleted_at: investment.deleted_at,
        offer: offerDTO,
        user: userDTO,
      };
    } catch (error) {
      // Re-throw z kontekstem
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas pobierania szczegółów inwestycji");
    }
  }

  /**
   * Aktualizuje status inwestycji (tylko dla adminów)
   * @param investmentId ID inwestycji do zaktualizowania
   * @param data Dane statusu po walidacji (status + opcjonalny reason)
   * @returns Zaktualizowana inwestycja
   * @throws Error jeśli inwestycja nie istnieje lub przejście statusu jest nieprawidłowe
   */
  async updateInvestmentStatus(investmentId: string, data: UpdateInvestmentStatusInput): Promise<InvestmentDTO> {
    try {
      // 1. Pobranie i walidacja istnienia inwestycji
      const currentInvestment = await this.getInvestmentById(investmentId);

      // 2. Walidacja przejścia statusu
      this.validateStatusTransition(currentInvestment.status, data.status);

      // 3. Mapowanie statusu admina na status systemowy
      const mappedStatus = InvestmentsService.STATUS_MAPPING[data.status] || data.status;

      // 4. Przygotowanie danych do aktualizacji
      const updateData: {
        status: string;
        reason?: string | null;
        completed_at?: string | null;
        updated_at: string;
      } = {
        status: mappedStatus,
        reason: data.reason ?? null,
        updated_at: new Date().toISOString(),
      };

      // 5. Ustawienie completed_at dla statusu "completed" (closed z API)
      if (mappedStatus === INVESTMENT_STATUSES.COMPLETED) {
        updateData.completed_at = new Date().toISOString();
      }

      // 6. Aktualizacja w bazie danych
      return await this.updateInvestmentInDatabase(investmentId, updateData);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas aktualizacji statusu inwestycji");
    }
  }

  /**
   * Anuluje inwestycję przez użytkownika (tylko własną i tylko w statusie pending)
   * @param investmentId ID inwestycji do anulowania
   * @param userId ID zalogowanego użytkownika
   * @param data Dane anulowania (reason)
   * @returns Zaktualizowana inwestycja
   * @throws Error jeśli inwestycja nie istnieje, użytkownik nie jest właścicielem lub status nie pozwala na anulowanie
   */
  async cancelInvestment(investmentId: string, userId: string, data: CancelInvestmentInput): Promise<InvestmentDTO> {
    try {
      // 1. Pobranie i walidacja istnienia inwestycji
      const currentInvestment = await this.getInvestmentById(investmentId);

      // 2. Sprawdzenie czy użytkownik jest właścicielem inwestycji
      if (currentInvestment.user_id !== userId) {
        throw new Error("Brak dostępu - możesz anulować tylko własne inwestycje");
      }

      // 3. Sprawdzenie czy inwestycja ma status "pending"
      if (currentInvestment.status !== INVESTMENT_STATUSES.PENDING) {
        throw new Error(
          `Nie można anulować inwestycji ze statusem '${currentInvestment.status}'. Tylko inwestycje oczekujące mogą być anulowane.`
        );
      }

      // 4. Przygotowanie danych do aktualizacji
      const updateData = {
        status: INVESTMENT_STATUSES.CANCELLED,
        reason: data.reason,
        updated_at: new Date().toISOString(),
      };

      // 5. Aktualizacja w bazie danych
      return await this.updateInvestmentInDatabase(investmentId, updateData);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas anulowania inwestycji");
    }
  }

  /**
   * Pobiera inwestycję po ID (metoda pomocnicza)
   * @param investmentId ID inwestycji
   * @returns Obiekt inwestycji z bazy danych
   * @throws Error jeśli inwestycja nie istnieje
   */
  private async getInvestmentById(investmentId: string): Promise<InvestmentDTO> {
    const { data: investment, error } = await this.supabase
      .from("investments")
      .select("*")
      .eq("id", investmentId)
      .single();

    if (error || !investment) {
      throw new Error("Inwestycja o podanym ID nie istnieje");
    }

    return investment;
  }

  /**
   * Aktualizuje inwestycję w bazie danych (metoda pomocnicza)
   * @param investmentId ID inwestycji do zaktualizowania
   * @param updateData Dane do aktualizacji
   * @returns Zaktualizowana inwestycja z konwersją kwoty
   * @throws Error jeśli aktualizacja nie powiedzie się
   */
  private async updateInvestmentInDatabase(
    investmentId: string,
    updateData: {
      status: string;
      reason?: string | null;
      completed_at?: string | null;
      updated_at: string;
    }
  ): Promise<InvestmentDTO> {
    const { data: updatedInvestment, error: updateError } = await this.supabase
      .from("investments")
      .update(updateData)
      .eq("id", investmentId)
      .select()
      .single();

    if (updateError || !updatedInvestment) {
      throw new Error("Nie udało się zaktualizować inwestycji");
    }

    // Konwersja kwoty z centów na PLN przed zwróceniem
    return {
      ...updatedInvestment,
      amount: convertFromSatoshi(updatedInvestment.amount),
    };
  }

  /**
   * Waliduje czy przejście statusu jest dozwolone
   * @param currentStatus Aktualny status inwestycji
   * @param newStatus Nowy status inwestycji
   * @throws Error jeśli przejście nie jest dozwolone
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    // Mapowanie statusu admina na status systemowy
    const mappedNewStatus = InvestmentsService.STATUS_MAPPING[newStatus] || newStatus;

    // Sprawdzenie dozwolonych przejść (używamy wspólnej funkcji z investment-status.ts)
    const allowedNextStatuses = getAllowedStatusTransitions(currentStatus as InvestmentStatus);

    if (!allowedNextStatuses.includes(mappedNewStatus as InvestmentStatus)) {
      throw new Error(
        `Nieprawidłowe przejście statusu: nie można zmienić statusu z '${currentStatus}' na '${newStatus}'`
      );
    }
  }
}
