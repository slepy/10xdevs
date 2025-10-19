import { z } from "zod";

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
      .date({
        required_error: "Data zakończenia jest wymagana",
        invalid_type_error: "Nieprawidłowy format daty",
      })
      .min(new Date(), { message: "Data nie może być z przeszłości" }),
  })
  .refine(
    (data) => {
      return data.minimum_investment <= data.target_amount;
    },
    {
      message: "Minimalna inwestycja nie może być większa niż docelowa kwota",
      path: ["minimum_investment"],
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
export type CreateOfferViewModel = z.infer<typeof createOfferSchema>;
