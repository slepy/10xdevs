import type { APIRoute } from "astro";
import { InvestmentFilesService } from "@/lib/services/investment-files.service";
import { deleteFileSchema } from "@/lib/validators/investment-files.validator";
import { USER_ROLES } from "@/types";
import type { InvestmentFileDeleteResponse } from "@/types";

export const prerender = false;

/**
 * delete /api/investments/:investmentid/files/:fileid
 * usuwa plik z inwestycji
 * dostęp: tylko admin
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // 1. sprawdź autoryzację
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  // 2. sprawdź czy użytkownik jest adminem
  if (locals.user.role !== USER_ROLES.ADMIN) {
    return new Response(JSON.stringify({ error: "forbidden", message: "tylko admin może usuwać pliki" }), {
      status: 403,
    });
  }

  const { investmentId, fileId } = params;

  // 3. waliduj parametry
  const validation = deleteFileSchema.safeParse({
    investment_id: investmentId,
    file_id: fileId,
  });

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "validation error",
        message: validation.error.errors[0]?.message || "nieprawidłowe parametry",
      }),
      { status: 400 }
    );
  }

  const { investment_id: validatedInvestmentId, file_id: validatedFileId } = validation.data;

  try {
    const service = new InvestmentFilesService(locals.supabase);

    // 4. usuń plik
    await service.deleteFile(validatedFileId, validatedInvestmentId);

    const response: InvestmentFileDeleteResponse = { message: "plik został usunięty" };
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "nie udało się usunąć pliku";

    return new Response(
      JSON.stringify({
        error: "internal server error",
        message,
      }),
      { status: message === "nie znaleziono pliku" ? 404 : 500 }
    );
  }
};

/**
 * get /api/investments/:investmentid/files/:fileid
 * pobiera plik (download)
 * dostęp: admin (wszystkie pliki) lub signer (tylko z własnych inwestycji)
 */
export const GET: APIRoute = async ({ params, locals }) => {
  // 1. sprawdź autoryzację
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const { investmentId, fileId } = params;

  // 2. waliduj parametry
  const validation = deleteFileSchema.safeParse({
    investment_id: investmentId,
    file_id: fileId,
  });

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "validation error",
        message: validation.error.errors[0]?.message || "nieprawidłowe parametry",
      }),
      { status: 400 }
    );
  }

  const { investment_id: validatedInvestmentId, file_id: validatedFileId } = validation.data;

  try {
    const service = new InvestmentFilesService(locals.supabase);

    // 3. jeśli signer - sprawdź czy to jego inwestycja
    if (locals.user.role === USER_ROLES.SIGNER) {
      const isOwner = await service.isInvestmentOwner(validatedInvestmentId, locals.user.id);
      if (!isOwner) {
        return new Response(JSON.stringify({ error: "forbidden", message: "brak dostępu do tego pliku" }), {
          status: 403,
        });
      }
    }

    // 4. pobierz metadane pliku z bazy
    const files = await service.getInvestmentFiles(validatedInvestmentId);
    const fileRecord = files.find((f) => f.id === validatedFileId);

    if (!fileRecord) {
      return new Response(JSON.stringify({ error: "not found", message: "nie znaleziono pliku" }), { status: 404 });
    }

    // 5. pobierz plik z storage
    const blob = await service.downloadFile(fileRecord.file_path);

    // 6. zwróć plik jako response
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": fileRecord.file_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileRecord.file_name}"`,
        "Content-Length": fileRecord.file_size.toString(),
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "internal server error",
        message: error instanceof Error ? error.message : "nie udało się pobrać pliku",
      }),
      { status: 500 }
    );
  }
};
