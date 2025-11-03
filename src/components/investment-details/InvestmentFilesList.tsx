import { useState, useEffect, useCallback } from "react";
import { BaseButton } from "@/components/base/BaseButton";
import { BaseAlert } from "@/components/base/BaseAlert";
import { ConfirmationModal } from "./ConfirmationModal";
import type { InvestmentFileDTO, UserRole } from "@/types";
import { USER_ROLES } from "@/types";

interface InvestmentFilesListProps {
  investmentId: string;
  userRole: UserRole;
  refreshTrigger?: number;
}

/**
 * komponent wyświetlający listę plików inwestycji
 * admin: może usuwać pliki
 * signer: tylko podgląd
 */
export function InvestmentFilesList({ investmentId, userRole, refreshTrigger }: InvestmentFilesListProps) {
  const [files, setFiles] = useState<InvestmentFileDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);

  const isAdmin = userRole === USER_ROLES.ADMIN;

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/investments/${investmentId}/files`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "nie udało się pobrać plików");
      }

      setFiles(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "nie udało się pobrać plików");
    } finally {
      setIsLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles, refreshTrigger]);

  const handleDeleteClick = (fileId: string, fileName: string) => {
    setFileToDelete({ id: fileId, name: fileName });
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeletingFileId(fileToDelete.id);
    setFileToDelete(null);

    try {
      const response = await fetch(`/api/investments/${investmentId}/files/${fileToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "nie udało się usunąć pliku");
      }

      // odśwież listę po usunięciu
      await fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "nie udało się usunąć pliku");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDeleteCancel = () => {
    setFileToDelete(null);
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/investments/${investmentId}/files/${fileId}`);

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "nie udało się pobrać pliku");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "nie udało się pobrać pliku");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} b`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kb`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} mb`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-pl", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">ładowanie plików...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <BaseAlert variant="error" title="błąd" onClose={() => setError(null)}>
          {error}
        </BaseAlert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">brak plików</p>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.file_name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{formatFileSize(file.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(file.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <BaseButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file.id, file.file_name)}
                  disabled={deletingFileId === file.id}
                >
                  pobierz
                </BaseButton>

                {isAdmin && (
                  <BaseButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(file.id, file.file_name)}
                    disabled={deletingFileId === file.id}
                  >
                    {deletingFileId === file.id ? "usuwanie..." : "usuń"}
                  </BaseButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={fileToDelete !== null}
        title="usuń plik"
        description={`czy na pewno chcesz usunąć plik "${fileToDelete?.name}"? tej operacji nie można cofnąć.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
