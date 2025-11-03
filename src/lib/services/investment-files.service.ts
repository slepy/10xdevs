import type { SupabaseClient } from "../../db/supabase.client";
import type { InvestmentFileDTO } from "../../types";
import type { UploadFileMetadataInput } from "../validators/investment-files.validator";

/**
 * serwis do zarządzania plikami inwestycji
 */
export class InvestmentFilesService {
  private readonly BUCKET_NAME = "investment_files";

  constructor(private supabase: SupabaseClient) {}

  /**
   * pobiera listę plików dla danej inwestycji
   * @param investmentId id inwestycji
   * @returns lista plików lub błąd
   */
  async getInvestmentFiles(investmentId: string): Promise<InvestmentFileDTO[]> {
    const { data, error } = await this.supabase
      .from("investment_files")
      .select("*")
      .eq("investment_id", investmentId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`nie udało się pobrać plików inwestycji: ${error.message}`);
    }

    return data || [];
  }

  /**
   * sprawdza czy inwestycja ma status "accepted" (tylko do takich można dodawać pliki)
   * @param investmentId id inwestycji
   * @returns true jeśli inwestycja jest zaakceptowana
   */
  async isInvestmentAccepted(investmentId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("investments")
      .select("status")
      .eq("id", investmentId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return false;
    }

    return data.status === "accepted";
  }

  /**
   * sprawdza czy użytkownik jest właścicielem inwestycji
   * @param investmentId id inwestycji
   * @param userId id użytkownika
   * @returns true jeśli użytkownik jest właścicielem
   */
  async isInvestmentOwner(investmentId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("investments")
      .select("user_id")
      .eq("id", investmentId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return false;
    }

    return data.user_id === userId;
  }

  /**
   * tworzy wpis w bazie dla uploadowanego pliku
   * @param investmentId id inwestycji
   * @param metadata metadane pliku
   * @param userId id użytkownika uploadującego
   * @returns utworzony rekord pliku
   */
  async createFileRecord(
    investmentId: string,
    metadata: UploadFileMetadataInput,
    userId: string
  ): Promise<InvestmentFileDTO> {
    const filePath = `${investmentId}/${Date.now()}-${metadata.file_name}`;

    const { data, error } = await this.supabase
      .from("investment_files")
      .insert({
        investment_id: investmentId,
        file_name: metadata.file_name,
        file_path: filePath,
        file_size: metadata.file_size,
        file_type: metadata.file_type,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`nie udało się utworzyć rekordu pliku: ${error.message}`);
    }

    return data;
  }

  /**
   * uploaduje plik do supabase storage
   * @param file obiekt file z formularza
   * @param filePath ścieżka w storage bucket
   * @returns publiczny url do pliku
   */
  async uploadFileToStorage(file: File, filePath: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(this.BUCKET_NAME).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw new Error(`nie udało się uploadować pliku do storage: ${error.message}`);
    }

    // pobierz url do pliku (storage prywatny, więc signed url)
    const { data: urlData } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 rok

    if (!urlData) {
      throw new Error("nie udało się wygenerować url do pliku");
    }

    return urlData.signedUrl;
  }

  /**
   * usuwa plik (soft delete w bazie + usunięcie z storage)
   * @param fileId id pliku do usunięcia
   * @param investmentId id inwestycji (dla weryfikacji)
   * @returns true jeśli usunięto pomyślnie
   */
  async deleteFile(fileId: string, investmentId: string): Promise<boolean> {
    // 1. pobierz file_path przed usunięciem
    const { data: fileData, error: fetchError } = await this.supabase
      .from("investment_files")
      .select("file_path, investment_id")
      .eq("id", fileId)
      .eq("investment_id", investmentId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !fileData) {
      throw new Error("nie znaleziono pliku");
    }

    // 2. NAJPIERW usuń z storage (kiedy rekord jeszcze nie ma deleted_at)
    const { error: deleteStorageError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .remove([fileData.file_path]);

    if (deleteStorageError) {
      throw new Error(`nie udało się usunąć pliku ze storage: ${deleteStorageError.message}`);
    }

    // 3. POTEM soft delete w bazie
    const { error: deleteDbError } = await this.supabase
      .from("investment_files")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", fileId);

    if (deleteDbError) {
      throw new Error(`nie udało się usunąć pliku z bazy: ${deleteDbError.message}`);
    }

    return true;
  }

  /**
   * generuje signed url dla pliku
   * @param filePath ścieżka do pliku w storage
   * @param expiresIn czas ważności urla w sekundach (domyślnie 1 godzina)
   * @returns signed url
   */
  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage.from(this.BUCKET_NAME).createSignedUrl(filePath, expiresIn);

    if (error || !data) {
      throw new Error(`nie udało się wygenerować url do pliku: ${error?.message || "unknown error"}`);
    }

    return data.signedUrl;
  }

  /**
   * pobiera plik z storage jako blob
   * @param filePath ścieżka do pliku w storage
   * @returns blob z plikiem
   */
  async downloadFile(filePath: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage.from(this.BUCKET_NAME).download(filePath);

    if (error || !data) {
      throw new Error(`nie udało się pobrać pliku: ${error?.message || "unknown error"}`);
    }

    return data;
  }
}
