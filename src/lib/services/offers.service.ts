import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateOfferDTO, OfferDTO } from "../../types";
import type { CreateOfferInput } from "../validators/offers.validator";

/**
 * Serwis do zarządzania ofertami inwestycyjnymi
 */
export class OffersService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Tworzy nową ofertę inwestycyjną
   * @param data Dane oferty po walidacji
   * @returns Utworzona oferta lub błąd
   */
  async createOffer(data: CreateOfferInput): Promise<OfferDTO> {
    try {
      // Konwersja kwot z PLN na centy (×100)
      const offerData: CreateOfferDTO = {
        name: data.name,
        description: data.description || null,
        target_amount: this.convertToSatoshi(data.target_amount),
        minimum_investment: this.convertToSatoshi(data.minimum_investment),
        end_at: data.end_at,
        // Status automatycznie ustawiany na "draft"
        // created_at i updated_at automatycznie generowane przez bazę
      };

      // Zapis do bazy danych
      const { data: offer, error } = await this.supabase.from("offers").insert(offerData).select().single();

      if (error) {
        throw new Error(`Błąd podczas tworzenia oferty: ${error.message}`);
      }

      if (!offer) {
        throw new Error("Nie udało się utworzyć oferty - brak zwróconych danych");
      }

      return offer;
    } catch (error) {
      // Re-throw z kontekstem
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas tworzenia oferty");
    }
  }

  /**
   * Konwertuje kwotę z PLN na centy (grosz)
   * @param amount Kwota w PLN
   * @returns Kwota w groszach
   */
  private convertToSatoshi(amount: number): number {
    // Mnożenie przez 100 i zaokrąglenie, aby uniknąć problemów z floating point
    return Math.round(amount * 100);
  }

  /**
   * Konwertuje kwotę z groszy na PLN
   * @param satoshi Kwota w groszach
   * @returns Kwota w PLN
   */
  private convertFromSatoshi(satoshi: number): number {
    return satoshi / 100;
  }
}
