import { z } from "zod";

/**
 * maksymalna wielkość pliku: 10 mb
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * dozwolone typy plików
 */
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "text/plain",
] as const;

/**
 * schema walidacji dla metadanych uploadowanego pliku
 * używany w post /api/investments/:investmentid/files
 */
export const uploadFileMetadataSchema = z.object({
  file_name: z.string().min(1, "nazwa pliku jest wymagana").max(255, "nazwa pliku jest zbyt długa"),
  file_size: z
    .number()
    .positive("wielkość pliku musi być większa od 0")
    .max(MAX_FILE_SIZE, `wielkość pliku nie może przekraczać ${MAX_FILE_SIZE / 1024 / 1024} mb`),
  file_type: z.string().refine((type) => ALLOWED_FILE_TYPES.includes(type as any), {
    message: "nieobsługiwany typ pliku",
  }),
});

/**
 * typ wynikowy z walidacji metadanych pliku
 */
export type UploadFileMetadataInput = z.infer<typeof uploadFileMetadataSchema>;

/**
 * schema walidacji dla parametrów zapytania listy plików
 * używany w get /api/investments/:investmentid/files
 */
export const investmentFilesQuerySchema = z.object({
  investment_id: z.string().uuid("nieprawidłowy format id inwestycji"),
});

/**
 * typ wynikowy z walidacji parametrów zapytania
 */
export type InvestmentFilesQueryInput = z.infer<typeof investmentFilesQuerySchema>;

/**
 * schema walidacji dla usuwania pliku
 * używany w delete /api/investments/:investmentid/files/:fileid
 */
export const deleteFileSchema = z.object({
  investment_id: z.string().uuid("nieprawidłowy format id inwestycji"),
  file_id: z.string().uuid("nieprawidłowy format id pliku"),
});

/**
 * typ wynikowy z walidacji usuwania pliku
 */
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;

/**
 * eksport stałych dla wykorzystania w innych modułach
 */
export { MAX_FILE_SIZE, ALLOWED_FILE_TYPES };
