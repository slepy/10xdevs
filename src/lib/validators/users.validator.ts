import { z } from "zod";

/**
 * Schema walidacji dla parametrów zapytania listy użytkowników (GET /api/users)
 */
export const listUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive("Numer strony musi być liczbą dodatnią").default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive("Limit musi być liczbą dodatnią").max(100, "Maksymalny limit to 100").default(10)),
  sort: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const [field, order] = val.split(":");
        return ["created_at", "updated_at", "email"].includes(field) && (!order || ["asc", "desc"].includes(order));
      },
      {
        message: "Sortowanie musi być w formacie 'field:order' (np. 'created_at:desc')",
      }
    ),
  filter: z.string().trim().max(100, "Filtr może mieć maksymalnie 100 znaków").optional(),
});

/**
 * Typ inferred ze schematu walidacji
 */
export type ListUsersQueryParams = z.infer<typeof listUsersQuerySchema>;
