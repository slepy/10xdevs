import type { APIRoute } from "astro";
import { InvestmentFilesService } from "@/lib/services/investment-files.service";
import { investmentFilesQuerySchema, uploadFileMetadataSchema } from "@/lib/validators/investment-files.validator";
import { USER_ROLES } from "@/types";
import type { InvestmentFilesListResponse, InvestmentFileUploadResponse } from "@/types";

export const prerender = false;

/**
 * get /api/investments/:investmentid/files
 * pobiera listę plików dla danej inwestycji
 * dostęp: admin (wszystkie inwestycje) lub signer (tylko własne)
 */
export const GET: APIRoute = async ({ params, locals }) => {
  // 1. sprawdź autoryzację
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const { investmentId } = params;

  // 2. waliduj parametry
  const validation = investmentFilesQuerySchema.safeParse({ investment_id: investmentId });
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "validation error",
        message: validation.error.errors[0]?.message || "nieprawidłowe parametry",
      }),
      { status: 400 }
    );
  }

  try {
    const service = new InvestmentFilesService(locals.supabase);

    // 3. jeśli signer - sprawdź czy to jego inwestycja
    if (locals.user.role === USER_ROLES.SIGNER) {
      const isOwner = await service.isInvestmentOwner(investmentId!, locals.user.id);
      if (!isOwner) {
        return new Response(JSON.stringify({ error: "forbidden", message: "brak dostępu do tej inwestycji" }), {
          status: 403,
        });
      }
    }

    // 4. pobierz pliki
    const files = await service.getInvestmentFiles(investmentId!);

    const response: InvestmentFilesListResponse = { data: files };
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.error("error fetching investment files:", error);
    return new Response(
      JSON.stringify({
        error: "internal server error",
        message: error instanceof Error ? error.message : "nie udało się pobrać plików",
      }),
      { status: 500 }
    );
  }
};

/**
 * post /api/investments/:investmentid/files
 * uploaduje nowy plik do inwestycji
 * dostęp: tylko admin
 * inwestycja musi mieć status "accepted"
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  // 1. sprawdź autoryzację
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  // 2. sprawdź czy użytkownik jest adminem
  if (locals.user.role !== USER_ROLES.ADMIN) {
    return new Response(JSON.stringify({ error: "forbidden", message: "tylko admin może uploadować pliki" }), {
      status: 403,
    });
  }

  const { investmentId } = params;

  // 3. waliduj investment_id
  if (!investmentId) {
    return new Response(JSON.stringify({ error: "validation error", message: "brak id inwestycji" }), { status: 400 });
  }

  try {
    const service = new InvestmentFilesService(locals.supabase);

    // 4. sprawdź czy inwestycja ma status "accepted"
    const isAccepted = await service.isInvestmentAccepted(investmentId);
    if (!isAccepted) {
      return new Response(
        JSON.stringify({
          error: "bad request",
          message: "pliki można dodawać tylko do zaakceptowanych inwestycji",
        }),
        { status: 400 }
      );
    }

    // 5. pobierz formdata
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "validation error", message: "brak pliku" }), { status: 400 });
    }

    // 6. waliduj metadane pliku
    const metadata = {
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
    };

    const validation = uploadFileMetadataSchema.safeParse(metadata);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "validation error",
          message: validation.error.errors[0]?.message || "nieprawidłowe dane pliku",
        }),
        { status: 400 }
      );
    }

    // 7. utwórz rekord w bazie
    const fileRecord = await service.createFileRecord(investmentId, validation.data, locals.user.id);

    // 8. uploaduj plik do storage
    await service.uploadFileToStorage(file, fileRecord.file_path);

    const response: InvestmentFileUploadResponse = { data: fileRecord };
    return new Response(JSON.stringify(response), { status: 201 });
  } catch (error) {
    console.error("error uploading file:", error);
    return new Response(
      JSON.stringify({
        error: "internal server error",
        message: error instanceof Error ? error.message : "nie udało się uploadować pliku",
      }),
      { status: 500 }
    );
  }
};
