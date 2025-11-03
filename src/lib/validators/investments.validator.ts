import { z } from "zod";

/**
 * Schema walidacji dla tworzenia nowej inwestycji
 * Kwota w złotych (PLN) - będzie przekonwertowana na centy w serwisie
 */
export const createInvestmentSchema = z.object({
  offer_id: z.string().uuid("Nieprawidłowy format ID oferty"),

  amount: z.number().positive("Kwota musi być większa od 0").max(100000000, "Kwota jest zbyt duża"), // 1 mln PLN - zgodne z limitem z offers.validator.ts
});

/**
 * Schema walidacji dla kwoty inwestycji w formularzu frontendowym
 * Parametryczna walidacja uwzględniająca minimum_investment danej oferty
 */
export const investmentAmountSchema = (minimumInvestment: number) =>
  z
    .number({
      required_error: "Kwota jest wymagana",
      invalid_type_error: "Kwota musi być liczbą",
    })
    .positive("Kwota musi być większa od 0")
    .min(minimumInvestment, `Kwota musi wynosić co najmniej ${minimumInvestment.toFixed(2)} zł`)
    .max(100000000, "Kwota jest zbyt duża (maksymalnie 100 000 000 zł)");

/**
 * Typ wynikowy z walidacji dla tworzenia inwestycji
 */
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;

/**
 * Dozwolone wartości statusów inwestycji dla filtrowania
 */
export const investmentStatusValues = ["pending", "accepted", "rejected", "cancelled", "completed"] as const;

/**
 * Schema walidacji parametrów zapytania dla listy inwestycji
 * Używany w GET /api/investments i GET /api/investments/admin
 */
export const investmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(investmentStatusValues).optional(),
  offer_id: z.string().uuid().optional(),
  filter: z.string().min(1).optional(), // Wyszukiwanie po emailu użytkownika lub nazwie oferty
});

/**
 * Typ wynikowy z walidacji parametrów zapytania
 */
export type InvestmentQueryParams = z.infer<typeof investmentQuerySchema>;
