import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateInvestmentInput, InvestmentQueryParams } from "../validators/investments.validator";
import type {
  InvestmentDTO,
  InvestmentListResponse,
  UserInvestmentListResponse,
  InvestmentWithOfferNameDTO,
  InvestmentWithRelationsDTO,
  AdminInvestmentListResponse,
} from "../../types";
import { INVESTMENT_STATUSES, OFFER_STATUSES } from "../../types";
import { convertToSatoshi, convertFromSatoshi, formatCurrency } from "../utils";

/**
 * Serwis do zarządzania inwestycjami
 */
export class InvestmentsService {
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
}
