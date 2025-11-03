import { z } from "zod";
import { OFFER_STATUSES } from "../../types";

/**
 * Schema walidacji dla tworzenia nowej oferty
 * Wszystkie kwoty w złotych (PLN) - będą przekonwertowane na centy w serwisie
 */
export const createOfferSchema = z
  .object({
    name: z.string().min(1, "Nazwa jest wymagana").max(255, "Nazwa może mieć maksymalnie 255 znaków").trim(),

    description: z.string().optional(),

    target_amount: z
      .number()
      .positive("Docelowa kwota musi być większa od 0")
      .max(1000000000, "Docelowa kwota jest zbyt duża"), // 10 mln PLN

    minimum_investment: z
      .number()
      .positive("Minimalna inwestycja musi być większa od 0")
      .max(100000000, "Minimalna inwestycja jest zbyt duża"), // 1 mln PLN

    end_at: z
      .string()
      .min(1, "Data zakończenia jest wymagana")
      .refine(
        (val) => {
          // Akceptuj format datetime-local (YYYY-MM-DDTHH:mm) lub ISO 8601
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: "Nieprawidłowy format daty" }
      ),

    images: z.array(z.string().url("Nieprawidłowy URL obrazu")).max(5, "Możesz dodać maksymalnie 5 obrazów").optional(),
  })
  .refine(
    (data) => {
      return data.minimum_investment <= data.target_amount;
    },
    {
      message: "Minimalna inwestycja nie może być większa niż docelowa kwota",
      path: ["minimum_investment"],
    }
  )
  .refine(
    (data) => {
      const endDate = new Date(data.end_at);
      return endDate > new Date();
    },
    {
      message: "Data zakończenia nie może być w przeszłości",
      path: ["end_at"],
    }
  );

/**
 * Typ wynikowy z walidacji dla tworzenia oferty
 */
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

/**
 * Typ reprezentujący dane formularza w komponencie React
 * Zgodny ze schematem walidacji Zod
 */
export type CreateOfferViewModel = CreateOfferInput;

/**
 * Schema walidacji dla aktualizacji statusu oferty
 */
export const updateOfferStatusSchema = z.object({
  status: z.enum([OFFER_STATUSES.DRAFT, OFFER_STATUSES.ACTIVE, OFFER_STATUSES.CLOSED], {
    errorMap: () => ({ message: "Nieprawidłowy status oferty" }),
  }),
});

/**
 * Typ wynikowy z walidacji dla aktualizacji statusu
 */
export type UpdateOfferStatusInput = z.infer<typeof updateOfferStatusSchema>;

/**
 * Schema walidacji dla aktualizacji oferty (PUT)
 * Używa tego samego schematu co tworzenie - wszystkie pola wymagane
 * Formularz edycji jest identyczny jak formularz tworzenia
 */
export const updateOfferSchema = createOfferSchema;

/**
 * Typ wynikowy z walidacji dla aktualizacji oferty
 */
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
