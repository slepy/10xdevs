import { describe, it, expect, vi, beforeEach } from "vitest";
import { OffersService } from "./offers.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type { OfferQueryParams } from "../validators/offer.validators";

describe("OffersService", () => {
  let mockSupabase: SupabaseClient;
  let offersService: OffersService;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;

    offersService = new OffersService(mockSupabase);
  });

  describe("getAvailableOffers", () => {
    it("should fetch available offers with default parameters", async () => {
      const mockOffers = [
        {
          id: "1",
          name: "Oferta 1",
          description: "Opis",
          target_amount: 100000, // w centach (satoshi)
          minimum_investment: 1000, // w centach (satoshi)
          status: "active",
          end_at: new Date(Date.now() + 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockOffers,
          error: null,
          count: 1,
        }),
      };

      const mockImagesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockQuery as any)
        .mockReturnValue(mockImagesQuery as any);

      const params: OfferQueryParams = {
        page: 1,
        limit: 10,
        sort: "created_at",
      };

      const result = await offersService.getAvailableOffers(params);

      expect(mockSupabase.from).toHaveBeenCalledWith("offers");
      expect(mockQuery.select).toHaveBeenCalledWith("*", { count: "exact" });
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "active");
      expect(mockQuery.gt).toHaveBeenCalledWith("end_at", expect.any(String));
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);

      // Sprawdź konwersję z satoshi na PLN i dodanie images
      expect(result).toEqual({
        data: [
          {
            ...mockOffers[0],
            target_amount: 1000, // Backend konwertuje: 100000 / 100 = 1000 PLN
            minimum_investment: 10, // Backend konwertuje: 1000 / 100 = 10 PLN
            images: [],
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it("should handle pagination correctly", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 25,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const params: OfferQueryParams = {
        page: 3,
        limit: 10,
        sort: "created_at",
      };

      const result = await offersService.getAvailableOffers(params);

      expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
      expect(result.pagination.totalPages).toBe(3);
    });

    it("should handle different sort fields", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const params: OfferQueryParams = {
        page: 1,
        limit: 10,
        sort: "target_amount",
      };

      await offersService.getAvailableOffers(params);

      expect(mockQuery.order).toHaveBeenCalledWith("target_amount", { ascending: false });
    });

    it("should throw error when database query fails", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
          count: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const params: OfferQueryParams = {
        page: 1,
        limit: 10,
        sort: "created_at",
      };

      await expect(offersService.getAvailableOffers(params)).rejects.toThrow(
        "Błąd podczas pobierania dostępnych ofert: Database error"
      );
    });

    it("should return empty array when no offers found", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const params: OfferQueryParams = {
        page: 1,
        limit: 10,
        sort: "created_at",
      };

      const result = await offersService.getAvailableOffers(params);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe("updateOffer", () => {
    it("should update offer successfully with all fields", async () => {
      const offerId = "offer-123";
      const updateData = {
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 500000, // Frontend wysyła PLN: 500000 PLN
        minimum_investment: 10000, // Frontend wysyła PLN: 10000 PLN
        end_at: "2025-12-31T23:59:59Z",
        images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      };

      const mockUpdatedOffer = {
        id: offerId,
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 50000000, // Baza przechowuje w groszach: 500000 * 100
        minimum_investment: 1000000, // Baza przechowuje w groszach: 10000 * 100
        end_at: "2025-12-31T23:59:59Z",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock update query
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedOffer,
          error: null,
        }),
      };

      // Mock delete images query
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      // Mock insert images query
      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockUpdateQuery as any) // First call: update offer
        .mockReturnValueOnce(mockDeleteQuery as any) // Second call: delete old images
        .mockReturnValueOnce(mockInsertQuery as any); // Third call: insert new images

      const result = await offersService.updateOffer(offerId, updateData);

      // Verify offer update
      expect(mockSupabase.from).toHaveBeenCalledWith("offers");
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 50000000,
        minimum_investment: 1000000,
        end_at: "2025-12-31T23:59:59Z",
      });
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith("id", offerId);

      // Verify images deletion
      expect(mockSupabase.from).toHaveBeenCalledWith("offer_images");
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith("offer_id", offerId);

      // Verify images insertion
      expect(mockInsertQuery.insert).toHaveBeenCalledWith([
        { offer_id: offerId, url: "https://example.com/image1.jpg", display_order: 0 },
        { offer_id: offerId, url: "https://example.com/image2.jpg", display_order: 1 },
      ]);

      // Backend zwraca PLN (skonwertowane z groszy)
      expect(result).toEqual({
        ...mockUpdatedOffer,
        target_amount: 500000, // Backend konwertuje: 50000000 / 100 = 500000 PLN
        minimum_investment: 10000, // Backend konwertuje: 1000000 / 100 = 10000 PLN
      });
    });

    it("should update offer without images", async () => {
      const offerId = "offer-123";
      const updateData = {
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 500000,
        minimum_investment: 10000,
        end_at: "2025-12-31T23:59:59Z",
      };

      const mockUpdatedOffer = {
        id: offerId,
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 50000000,
        minimum_investment: 1000000,
        end_at: "2025-12-31T23:59:59Z",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedOffer,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUpdateQuery as any);

      const result = await offersService.updateOffer(offerId, updateData);

      // Backend zwraca PLN (skonwertowane z groszy)
      expect(result).toEqual({
        ...mockUpdatedOffer,
        target_amount: 500000, // Backend konwertuje: 50000000 / 100 = 500000 PLN
        minimum_investment: 10000, // Backend konwertuje: 1000000 / 100 = 10000 PLN
      });
      // Should only call from() once for offer update, not for images
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it("should update offer with empty images array (remove all images)", async () => {
      const offerId = "offer-123";
      const updateData = {
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 500000,
        minimum_investment: 10000,
        end_at: "2025-12-31T23:59:59Z",
        images: [],
      };

      const mockUpdatedOffer = {
        id: offerId,
        name: "Updated Offer",
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedOffer,
          error: null,
        }),
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockUpdateQuery as any)
        .mockReturnValueOnce(mockDeleteQuery as any);

      await offersService.updateOffer(offerId, updateData);

      // Should delete images but not insert any
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledTimes(2); // update + delete only
    });

    it("should throw error when offer not found", async () => {
      const offerId = "non-existent";
      const updateData = {
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 500000,
        minimum_investment: 10000,
        end_at: "2025-12-31T23:59:59Z",
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUpdateQuery as any);

      await expect(offersService.updateOffer(offerId, updateData)).rejects.toThrow(
        "Nie znaleziono oferty o podanym ID"
      );
    });

    it("should throw error when database update fails", async () => {
      const offerId = "offer-123";
      const updateData = {
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 500000,
        minimum_investment: 10000,
        end_at: "2025-12-31T23:59:59Z",
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockUpdateQuery as any);

      await expect(offersService.updateOffer(offerId, updateData)).rejects.toThrow(
        "Błąd podczas aktualizacji oferty: Database error"
      );
    });

    it("should throw error when deleting old images fails", async () => {
      const offerId = "offer-123";
      const updateData = {
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 500000,
        minimum_investment: 10000,
        end_at: "2025-12-31T23:59:59Z",
        images: ["https://example.com/image1.jpg"],
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: offerId, name: "Updated Offer" },
          error: null,
        }),
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: "Delete failed" },
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockUpdateQuery as any)
        .mockReturnValueOnce(mockDeleteQuery as any);

      await expect(offersService.updateOffer(offerId, updateData)).rejects.toThrow(
        "Błąd podczas usuwania starych obrazów: Delete failed"
      );
    });

    it("should throw error when inserting new images fails", async () => {
      const offerId = "offer-123";
      const updateData = {
        name: "Updated Offer",
        description: "Updated description",
        target_amount: 500000,
        minimum_investment: 10000,
        end_at: "2025-12-31T23:59:59Z",
        images: ["https://example.com/image1.jpg"],
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: offerId, name: "Updated Offer" },
          error: null,
        }),
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({
          error: { message: "Insert failed" },
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockUpdateQuery as any)
        .mockReturnValueOnce(mockDeleteQuery as any)
        .mockReturnValueOnce(mockInsertQuery as any);

      await expect(offersService.updateOffer(offerId, updateData)).rejects.toThrow(
        "Błąd podczas dodawania nowych obrazów: Insert failed"
      );
    });
  });
});
