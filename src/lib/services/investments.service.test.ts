import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvestmentsService } from "./investments.service";
import type { SupabaseClient } from "../../db/supabase.client";
import { INVESTMENT_STATUSES, OFFER_STATUSES } from "../../types";

describe("InvestmentsService", () => {
  let mockSupabase: SupabaseClient;
  let investmentsService: InvestmentsService;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;

    investmentsService = new InvestmentsService(mockSupabase);
  });

  describe("createInvestment", () => {
    const userId = "user-123";
    const validInput = {
      offer_id: "offer-123",
      amount: 5000, // 5000 PLN
    };

    const mockActiveOffer = {
      id: "offer-123",
      status: OFFER_STATUSES.ACTIVE,
      end_at: new Date(Date.now() + 86400000).toISOString(), // +1 dzień
      minimum_investment: 100000, // 1000 PLN w centach
    };

    it("should successfully create investment for valid data", async () => {
      const mockInvestment = {
        id: "investment-123",
        user_id: userId,
        offer_id: "offer-123",
        amount: 500000, // 5000 PLN w centach
        status: INVESTMENT_STATUSES.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        reason: null,
        deleted_at: null,
      };

      // Mock dla zapytania o ofertę
      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockActiveOffer,
          error: null,
        }),
      };

      // Mock dla utworzenia inwestycji
      const mockInvestmentQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvestment,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockOfferQuery as any)
        .mockReturnValueOnce(mockInvestmentQuery as any);

      const result = await investmentsService.createInvestment(validInput, userId);

      // Sprawdzenie wywołań
      expect(mockSupabase.from).toHaveBeenCalledWith("offers");
      expect(mockOfferQuery.select).toHaveBeenCalledWith("id, status, end_at, minimum_investment");
      expect(mockOfferQuery.eq).toHaveBeenCalledWith("id", "offer-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("investments");
      expect(mockInvestmentQuery.insert).toHaveBeenCalledWith({
        user_id: userId,
        offer_id: "offer-123",
        amount: 500000, // Konwersja 5000 PLN -> 500000 centów
        status: INVESTMENT_STATUSES.PENDING,
      });

      // Sprawdzenie wyniku (kwota skonwertowana z powrotem na PLN)
      expect(result).toEqual({
        ...mockInvestment,
        amount: 5000, // Konwersja z powrotem: 500000 centów -> 5000 PLN
      });
    });

    it("should throw error when offer does not exist", async () => {
      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockOfferQuery as any);

      await expect(investmentsService.createInvestment(validInput, userId)).rejects.toThrow(
        "Nie znaleziono oferty o podanym ID"
      );

      expect(mockSupabase.from).toHaveBeenCalledWith("offers");
      expect(mockOfferQuery.select).toHaveBeenCalledWith("id, status, end_at, minimum_investment");
    });

    it("should throw error when offer is not active", async () => {
      const mockDraftOffer = {
        ...mockActiveOffer,
        status: OFFER_STATUSES.DRAFT,
      };

      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockDraftOffer,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockOfferQuery as any);

      await expect(investmentsService.createInvestment(validInput, userId)).rejects.toThrow(
        "Ta oferta nie jest dostępna do inwestycji"
      );
    });

    it("should throw error when offer is closed", async () => {
      const mockClosedOffer = {
        ...mockActiveOffer,
        status: OFFER_STATUSES.CLOSED,
      };

      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockClosedOffer,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockOfferQuery as any);

      await expect(investmentsService.createInvestment(validInput, userId)).rejects.toThrow(
        "Ta oferta nie jest dostępna do inwestycji"
      );
    });

    it("should throw error when offer has expired", async () => {
      const mockExpiredOffer = {
        ...mockActiveOffer,
        end_at: new Date(Date.now() - 86400000).toISOString(), // -1 dzień (przeszłość)
      };

      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockExpiredOffer,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockOfferQuery as any);

      await expect(investmentsService.createInvestment(validInput, userId)).rejects.toThrow(
        "Oferta jest już nieaktywna"
      );
    });

    it("should throw error when investment amount is below minimum", async () => {
      const tooLowInput = {
        offer_id: "offer-123",
        amount: 500, // 500 PLN (za mało, minimum to 1000 PLN)
      };

      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockActiveOffer,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce(mockOfferQuery as any);

      await expect(investmentsService.createInvestment(tooLowInput, userId)).rejects.toThrow(
        /Kwota inwestycji musi wynosić co najmniej/
      );
    });

    it("should accept investment amount equal to minimum", async () => {
      const minimalInput = {
        offer_id: "offer-123",
        amount: 1000, // Dokładnie minimum
      };

      const mockInvestment = {
        id: "investment-123",
        user_id: userId,
        offer_id: "offer-123",
        amount: 100000, // 1000 PLN w centach
        status: INVESTMENT_STATUSES.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        reason: null,
        deleted_at: null,
      };

      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockActiveOffer,
          error: null,
        }),
      };

      const mockInvestmentQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvestment,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockOfferQuery as any)
        .mockReturnValueOnce(mockInvestmentQuery as any);

      const result = await investmentsService.createInvestment(minimalInput, userId);

      expect(result.amount).toBe(1000); // Konwersja z powrotem na PLN
    });

    it("should throw error when investment insert fails", async () => {
      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockActiveOffer,
          error: null,
        }),
      };

      const mockInvestmentQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockOfferQuery as any)
        .mockReturnValueOnce(mockInvestmentQuery as any);

      await expect(investmentsService.createInvestment(validInput, userId)).rejects.toThrow(
        "Nie udało się utworzyć inwestycji"
      );
    });

    it("should handle float amounts correctly with proper rounding", async () => {
      const floatInput = {
        offer_id: "offer-123",
        amount: 1234.56, // Kwota z ułamkami
      };

      const mockInvestment = {
        id: "investment-123",
        user_id: userId,
        offer_id: "offer-123",
        amount: 123456, // 1234.56 PLN w centach (zaokrąglone)
        status: INVESTMENT_STATUSES.PENDING,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        reason: null,
        deleted_at: null,
      };

      const mockOfferQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockActiveOffer,
          error: null,
        }),
      };

      const mockInvestmentQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockInvestment,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(mockOfferQuery as any)
        .mockReturnValueOnce(mockInvestmentQuery as any);

      const result = await investmentsService.createInvestment(floatInput, userId);

      // Sprawdź, że insert został wywołany z poprawnie zaokrągloną wartością
      expect(mockInvestmentQuery.insert).toHaveBeenCalledWith({
        user_id: userId,
        offer_id: "offer-123",
        amount: 123456, // 1234.56 * 100 zaokrąglone
        status: INVESTMENT_STATUSES.PENDING,
      });

      expect(result.amount).toBe(1234.56);
    });
  });

  describe("getUserInvestments", () => {
    const userId = "user-123";
    const queryParams = {
      page: 1,
      limit: 10,
      status: undefined,
    };

    const mockInvestments = [
      {
        id: "investment-1",
        user_id: userId,
        offer_id: "offer-1",
        amount: 500000, // 5000 PLN w centach
        status: INVESTMENT_STATUSES.PENDING,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        completed_at: null,
        reason: null,
        deleted_at: null,
      },
      {
        id: "investment-2",
        user_id: userId,
        offer_id: "offer-2",
        amount: 1000000, // 10000 PLN w centach
        status: INVESTMENT_STATUSES.ACCEPTED,
        created_at: "2024-01-14T10:00:00Z",
        updated_at: "2024-01-14T10:00:00Z",
        completed_at: null,
        reason: null,
        deleted_at: null,
      },
    ];

    it("should successfully fetch user investments with pagination", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockInvestments,
          error: null,
          count: 2,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await investmentsService.getUserInvestments(userId, queryParams);

      // Sprawdzenie wywołań
      expect(mockSupabase.from).toHaveBeenCalledWith("investments");
      expect(mockQuery.select).toHaveBeenCalledWith("*", { count: "exact" });
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9); // page 1, limit 10

      // Sprawdzenie wyniku (kwoty skonwertowane na PLN)
      expect(result.data).toHaveLength(2);
      expect(result.data[0].amount).toBe(5000);
      expect(result.data[1].amount).toBe(10000);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it("should filter by status when provided", async () => {
      const queryWithStatus = {
        ...queryParams,
        status: INVESTMENT_STATUSES.PENDING,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockInvestments[0]],
          error: null,
          count: 1,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      await investmentsService.getUserInvestments(userId, queryWithStatus);

      // Sprawdzenie że status został użyty jako filtr
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQuery.eq).toHaveBeenCalledWith("status", INVESTMENT_STATUSES.PENDING);
    });

    it("should handle pagination for page 2", async () => {
      const page2Params = {
        page: 2,
        limit: 5,
        status: undefined,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 7,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await investmentsService.getUserInvestments(userId, page2Params);

      // Sprawdzenie offset dla strony 2 (5 * (2-1) = 5)
      expect(mockQuery.range).toHaveBeenCalledWith(5, 9); // offset 5, limit 5

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 7,
        totalPages: 2,
      });
    });

    it("should return empty array when no investments found", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await investmentsService.getUserInvestments(userId, queryParams);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should throw error when database query fails", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
          count: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      await expect(investmentsService.getUserInvestments(userId, queryParams)).rejects.toThrow(
        "Błąd podczas pobierania inwestycji"
      );
    });
  });

  describe("getAllInvestments", () => {
    const queryParams = {
      page: 1,
      limit: 10,
      status: undefined,
    };

    const mockAllInvestments = [
      {
        id: "investment-1",
        user_id: "user-123",
        offer_id: "offer-1",
        amount: 500000,
        status: INVESTMENT_STATUSES.PENDING,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        completed_at: null,
        reason: null,
        deleted_at: null,
      },
      {
        id: "investment-2",
        user_id: "user-456",
        offer_id: "offer-2",
        amount: 1000000,
        status: INVESTMENT_STATUSES.ACCEPTED,
        created_at: "2024-01-14T10:00:00Z",
        updated_at: "2024-01-14T10:00:00Z",
        completed_at: null,
        reason: null,
        deleted_at: null,
      },
      {
        id: "investment-3",
        user_id: "user-789",
        offer_id: "offer-1",
        amount: 2000000,
        status: INVESTMENT_STATUSES.COMPLETED,
        created_at: "2024-01-13T10:00:00Z",
        updated_at: "2024-01-13T10:00:00Z",
        completed_at: "2024-01-20T10:00:00Z",
        reason: null,
        deleted_at: null,
      },
    ];

    it("should successfully fetch all investments without user filter", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockAllInvestments,
          error: null,
          count: 3,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await investmentsService.getAllInvestments(queryParams);

      // Sprawdzenie że NIE filtruje po user_id (brak wywołania eq z user_id)
      expect(mockSupabase.from).toHaveBeenCalledWith("investments");
      expect(mockQuery.select).toHaveBeenCalledWith("*", { count: "exact" });
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });

      // Sprawdzenie wyniku
      expect(result.data).toHaveLength(3);
      expect(result.data[0].amount).toBe(5000); // Konwersja z centów
      expect(result.data[1].amount).toBe(10000);
      expect(result.data[2].amount).toBe(20000);
    });

    it("should filter by status when provided", async () => {
      const queryWithStatus = {
        ...queryParams,
        status: INVESTMENT_STATUSES.COMPLETED,
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [mockAllInvestments[2]],
          error: null,
          count: 1,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await investmentsService.getAllInvestments(queryWithStatus);

      // Sprawdzenie filtrowania po statusie
      expect(mockQuery.eq).toHaveBeenCalledWith("status", INVESTMENT_STATUSES.COMPLETED);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(INVESTMENT_STATUSES.COMPLETED);
    });

    it("should calculate total pages correctly", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockAllInvestments,
          error: null,
          count: 25, // 25 inwestycji total
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      const result = await investmentsService.getAllInvestments(queryParams);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3, // ceil(25/10) = 3
      });
    });

    it("should throw error when database query fails", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection error" },
          count: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      await expect(investmentsService.getAllInvestments(queryParams)).rejects.toThrow(
        "Błąd podczas pobierania inwestycji"
      );
    });

    it("should exclude soft-deleted investments", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockAllInvestments,
          error: null,
          count: 3,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQuery as any);

      await investmentsService.getAllInvestments(queryParams);

      // Sprawdzenie że wyklucza deleted_at
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
    });
  });
});
