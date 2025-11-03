import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateOfferDTO, OfferDTO, OfferStatus, AvailableOffersResponse, OfferWithImagesDTO } from "../../types";
import type { CreateOfferInput, UpdateOfferInput } from "../validators/offers.validator";
import type { OfferQueryParams } from "../validators/offer.validators";
import { convertToSatoshi, convertFromSatoshi } from "../utils";

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
        target_amount: convertToSatoshi(data.target_amount),
        minimum_investment: convertToSatoshi(data.minimum_investment),
        end_at: data.end_at, // String w formacie ISO8601 lub datetime-local
        // Status automatycznie ustawiany na "draft"
        // created_at i updated_at automatycznie generowane przez bazę
      };

      // Zapis oferty do bazy danych
      const { data: offer, error: offerError } = await this.supabase.from("offers").insert(offerData).select().single();

      if (offerError) {
        throw new Error(`Błąd podczas tworzenia oferty: ${offerError.message}`);
      }

      if (!offer) {
        throw new Error("Nie udało się utworzyć oferty - brak zwróconych danych");
      }

      // Zapis obrazów do tabeli offer_images (jeśli są)
      if (data.images && data.images.length > 0) {
        const imageRecords = data.images.map((url, index) => ({
          offer_id: offer.id,
          url: url,
          display_order: index,
        }));

        const { error: imagesError } = await this.supabase.from("offer_images").insert(imageRecords);

        if (imagesError) {
          // Jeśli nie udało się dodać obrazów, usuń utworzoną ofertę (rollback)
          await this.supabase.from("offers").delete().eq("id", offer.id);
          throw new Error(`Błąd podczas dodawania obrazów: ${imagesError.message}`);
        }
      }

      // Konwersja kwot z groszy na PLN przed zwróceniem do frontendu
      return {
        ...offer,
        target_amount: convertFromSatoshi(offer.target_amount),
        minimum_investment: convertFromSatoshi(offer.minimum_investment),
      };
    } catch (error) {
      // Re-throw z kontekstem
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas tworzenia oferty");
    }
  }

  /**
   * Pobiera wszystkie oferty
   * @returns Lista ofert lub błąd
   */
  async getOffers(): Promise<OfferDTO[]> {
    try {
      const { data, error } = await this.supabase.from("offers").select("*");

      if (error) {
        throw new Error(`Błąd podczas pobierania ofert: ${error.message}`);
      }

      // Konwersja kwot z groszy na PLN przed zwróceniem do frontendu
      return (data || []).map((offer) => ({
        ...offer,
        target_amount: convertFromSatoshi(offer.target_amount),
        minimum_investment: convertFromSatoshi(offer.minimum_investment),
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas pobierania ofert");
    }
  }

  /**
   * Pobiera szczegóły pojedynczej oferty z obrazami
   * @param offerId ID oferty
   * @returns Oferta z obrazami lub błąd
   */
  async getOfferById(offerId: string): Promise<OfferWithImagesDTO> {
    try {
      // Pobierz ofertę
      const { data: offer, error: offerError } = await this.supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .single();

      if (offerError || !offer) {
        // Specific error for not found case
        throw new Error("Nie znaleziono oferty o podanym ID");
      }

      // Pobierz obrazy dla oferty
      const { data: images, error: imagesError } = await this.supabase
        .from("offer_images")
        .select("url")
        .eq("offer_id", offerId)
        .order("display_order", { ascending: true });

      // Konwersja kwot z groszy na PLN przed zwróceniem do frontendu
      return {
        ...offer,
        target_amount: convertFromSatoshi(offer.target_amount),
        minimum_investment: convertFromSatoshi(offer.minimum_investment),
        images: imagesError ? [] : (images?.map((img) => img.url) ?? []),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas pobierania oferty");
    }
  }

  /**
   * Aktualizuje ofertę (pełna zastawa - PUT)
   * @param offerId ID oferty do aktualizacji
   * @param data Pełne dane oferty po walidacji (identyczne jak przy tworzeniu)
   * @returns Zaktualizowana oferta
   */
  async updateOffer(offerId: string, data: UpdateOfferInput): Promise<OfferDTO> {
    try {
      // Konwersja kwot z PLN na centy (×100) - identycznie jak przy tworzeniu
      const offerData: CreateOfferDTO = {
        name: data.name,
        description: data.description || null,
        target_amount: convertToSatoshi(data.target_amount),
        minimum_investment: convertToSatoshi(data.minimum_investment),
        end_at: data.end_at,
      };

      // Aktualizacja oferty w bazie danych
      const { data: offer, error: offerError } = await this.supabase
        .from("offers")
        .update(offerData)
        .eq("id", offerId)
        .select()
        .single();

      if (offerError) {
        throw new Error(`Błąd podczas aktualizacji oferty: ${offerError.message}`);
      }

      if (!offer) {
        throw new Error("Nie znaleziono oferty o podanym ID");
      }

      // Aktualizacja obrazów tylko jeśli pole images jest podane w danych
      if (data.images !== undefined) {
        // Najpierw usuń istniejące obrazy
        const { error: deleteError } = await this.supabase.from("offer_images").delete().eq("offer_id", offerId);

        if (deleteError) {
          throw new Error(`Błąd podczas usuwania starych obrazów: ${deleteError.message}`);
        }

        // Dodaj nowe obrazy (jeśli są)
        if (data.images.length > 0) {
          const imageRecords = data.images.map((url, index) => ({
            offer_id: offerId,
            url: url,
            display_order: index,
          }));

          const { error: imagesError } = await this.supabase.from("offer_images").insert(imageRecords);

          if (imagesError) {
            throw new Error(`Błąd podczas dodawania nowych obrazów: ${imagesError.message}`);
          }
        }
      }

      // Konwersja kwot z groszy na PLN przed zwróceniem do frontendu
      return {
        ...offer,
        target_amount: convertFromSatoshi(offer.target_amount),
        minimum_investment: convertFromSatoshi(offer.minimum_investment),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas aktualizacji oferty");
    }
  }

  /**
   * Aktualizuje status oferty
   * @param offerId ID oferty
   * @param status Nowy status
   * @returns Zaktualizowana oferta
   */
  async updateOfferStatus(offerId: string, status: OfferStatus): Promise<OfferDTO> {
    try {
      const { data, error } = await this.supabase
        .from("offers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", offerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Błąd podczas aktualizacji statusu oferty: ${error.message}`);
      }

      if (!data) {
        throw new Error("Nie znaleziono oferty o podanym ID");
      }

      // Konwersja kwot z groszy na PLN przed zwróceniem do frontendu
      return {
        ...data,
        target_amount: convertFromSatoshi(data.target_amount),
        minimum_investment: convertFromSatoshi(data.minimum_investment),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Nieznany błąd podczas aktualizacji statusu oferty");
    }
  }

  /**
   * Pobiera publicznie dostępne aktywne oferty z paginacją i sortowaniem
   * @param params Parametry zapytania (page, limit, sort)
   * @returns Lista aktywnych ofert z obrazami i metadanymi paginacji
   */
  async getAvailableOffers(params: OfferQueryParams): Promise<AvailableOffersResponse> {
    const { page, limit, sort } = params;
    const offset = (page - 1) * limit;

    const query = this.supabase
      .from("offers")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .gt("end_at", new Date().toISOString())
      .order(sort, { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Błąd podczas pobierania dostępnych ofert: ${error.message}`);
    }

    const offers = (data as OfferDTO[]) ?? [];

    // Fetch images for all offers
    // Konwersja kwot z groszy na PLN przed zwróceniem do frontendu
    const offersWithImages: OfferWithImagesDTO[] = await Promise.all(
      offers.map(async (offer) => {
        const { data: images, error: imagesError } = await this.supabase
          .from("offer_images")
          .select("url")
          .eq("offer_id", offer.id)
          .order("display_order", { ascending: true });

        // If error fetching images, return offer without images
        if (imagesError) {
          return {
            ...offer,
            target_amount: convertFromSatoshi(offer.target_amount),
            minimum_investment: convertFromSatoshi(offer.minimum_investment),
            images: [],
          };
        }

        return {
          ...offer,
          target_amount: convertFromSatoshi(offer.target_amount),
          minimum_investment: convertFromSatoshi(offer.minimum_investment),
          images: images?.map((img) => img.url) ?? [],
        };
      })
    );

    const totalPages = Math.ceil((count ?? 0) / limit);

    return {
      data: offersWithImages,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages,
      },
    };
  }
}
