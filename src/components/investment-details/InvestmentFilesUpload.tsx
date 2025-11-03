import { useState, useRef } from "react";
import { BaseButton } from "@/components/base/BaseButton";
import { BaseAlert } from "@/components/base/BaseAlert";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/validators/investment-files.validator";

interface InvestmentFilesUploadProps {
  investmentId: string;
  onUploadSuccess: () => void;
}

/**
 * komponent do uploadowania plików do inwestycji
 * dostępny tylko dla adminów
 */
export function InvestmentFilesUpload({ investmentId, onUploadSuccess }: InvestmentFilesUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // walidacja po stronie klienta
    if (file.size > MAX_FILE_SIZE) {
      setError(`plik jest zbyt duży. maksymalna wielkość: ${MAX_FILE_SIZE / 1024 / 1024} mb`);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
      setError("nieobsługiwany typ pliku");
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/investments/${investmentId}/files`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "nie udało się uploadować pliku");
      }

      setSuccess("plik został dodany pomyślnie");
      onUploadSuccess();

      // zresetuj input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // ukryj komunikat po 3 sekundach
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "nie udało się uploadować pliku");
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* komunikaty */}
      {success && (
        <BaseAlert variant="success" title="sukces" onClose={() => setSuccess(null)}>
          {success}
        </BaseAlert>
      )}
      {error && (
        <BaseAlert variant="error" title="błąd" onClose={() => setError(null)}>
          {error}
        </BaseAlert>
      )}

      {/* przycisk upload */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={ALLOWED_FILE_TYPES.join(",")}
          className="hidden"
          disabled={isUploading}
        />
        <BaseButton onClick={handleButtonClick} disabled={isUploading} variant="primary">
          {isUploading ? "uploadowanie..." : "dodaj plik"}
        </BaseButton>
        <p className="text-sm text-muted-foreground">maksymalny rozmiar: {MAX_FILE_SIZE / 1024 / 1024} mb</p>
      </div>

      {/* dozwolone typy plików */}
      <p className="text-xs text-muted-foreground">dozwolone typy: pdf, doc, docx, xls, xlsx, jpg, jpeg, png, txt</p>
    </div>
  );
}
