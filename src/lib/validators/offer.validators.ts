import { z } from "zod";

export const offerSortableFields = ["name", "target_amount", "minimum_investment", "end_at", "created_at"] as const;

export const offerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(offerSortableFields).default("created_at"),
});

export type OfferQueryParams = z.infer<typeof offerQuerySchema>;
