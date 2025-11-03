import React, { useCallback, useState } from "react";
import { BaseAlert } from "../base";

interface ImageFile {
  file: File;
  preview: string;
  url?: string;
  uploadProgress: number;
  uploading: boolean;
  error?: string;
}

interface MultiImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
}

export default function MultiImageUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024,
  acceptedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  disabled = false,
}: MultiImageUploadProps) {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedFormats.includes(file.type)) {
        return `Nieprawidłowy format pliku ${file.name}. Dozwolone formaty: jpg, jpeg, png, webp.`;
      }
      if (file.size > maxFileSize) {
        return `Plik ${file.name} jest za duży. Maksymalny rozmiar to 5MB.`;
      }
      return null;
    },
    [acceptedFormats, maxFileSize]
  );

  const uploadToSupabase = useCallback(async (file: File, index: number): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setImageFiles((prev) => prev.map((img, i) => (i === index ? { ...img, uploadProgress: progress } : img)));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.url);
            } catch (parseError) {
              // eslint-disable-next-line no-console
              console.error("Error parsing response:", parseError);
              reject(new Error("Błąd parsowania odpowiedzi serwera"));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              // eslint-disable-next-line no-console
              console.error("Upload error response:", errorResponse);
              reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          // eslint-disable-next-line no-console
          console.error("Network error during upload");
          reject(new Error("Błąd sieci podczas uploadu"));
        });

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Upload error:", error);
      return null;
    }
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setGeneralError(null);

      const filesArray = Array.from(files);
      const currentCount = value.length + imageFiles.length;

      if (currentCount + filesArray.length > maxFiles) {
        setGeneralError(`Możesz dodać maksymalnie ${maxFiles} obrazów.`);
        return;
      }

      const validationErrors: string[] = [];
      filesArray.forEach((file) => {
        const error = validateFile(file);
        if (error) validationErrors.push(error);
      });

      if (validationErrors.length > 0) {
        setGeneralError(validationErrors.join(" "));
        return;
      }

      const newImageFiles: ImageFile[] = filesArray.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploadProgress: 0,
        uploading: true,
      }));

      setImageFiles((prev) => [...prev, ...newImageFiles]);

      const uploadPromises = newImageFiles.map(async (imageFile, index) => {
        const actualIndex = imageFiles.length + index;
        try {
          const url = await uploadToSupabase(imageFile.file, actualIndex);

          if (url) {
            setImageFiles((prev) =>
              prev.map((img, i) => (i === actualIndex ? { ...img, url, uploading: false, uploadProgress: 100 } : img))
            );
            return url;
          }
          setImageFiles((prev) =>
            prev.map((img, i) =>
              i === actualIndex ? { ...img, uploading: false, error: "Błąd podczas uploadu. Spróbuj ponownie." } : img
            )
          );
          return null;
        } catch (uploadError) {
          // eslint-disable-next-line no-console
          console.error("Upload error for file:", imageFile.file.name, uploadError);
          const errorMessage =
            uploadError instanceof Error ? uploadError.message : "Błąd podczas uploadu. Spróbuj ponownie.";
          setImageFiles((prev) =>
            prev.map((img, i) => (i === actualIndex ? { ...img, uploading: false, error: errorMessage } : img))
          );
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const successfulUrls = uploadedUrls.filter((url): url is string => url !== null);

      if (successfulUrls.length > 0) {
        onChange([...value, ...successfulUrls]);
      }
    },
    [value, imageFiles, maxFiles, onChange, validateFile, uploadToSupabase]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const { files } = e.dataTransfer;
      handleFiles(files);
    },
    [disabled, handleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;

      const { files } = e.target;
      handleFiles(files);
    },
    [disabled, handleFiles]
  );

  const removeImage = async (index: number) => {
    const urlToRemove = value[index];

    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToRemove }),
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting image:", error);
      setGeneralError("Błąd podczas usuwania obrazu. Spróbuj ponownie.");
      return;
    }

    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const totalImages = value.length + imageFiles.filter((img) => img.uploading).length;
  const isUploading = imageFiles.some((img) => img.uploading);

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="image-upload"
          type="file"
          multiple
          accept={acceptedFormats.join(",")}
          onChange={handleChange}
          disabled={disabled || totalImages >= maxFiles}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-blue-600">Kliknij aby wybrać pliki</span> lub przeciągnij i upuść
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, JPEG, WEBP do 5MB (maks. {maxFiles} obrazów)</p>
          <p className="text-sm font-medium text-gray-700">
            {totalImages}/{maxFiles} obrazów
          </p>
        </div>
      </div>

      {generalError && <BaseAlert variant="error">{generalError}</BaseAlert>}

      {(value.length > 0 || imageFiles.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div key={url} className="relative group">
              <img src={url} alt={`Obraz ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                {index === 0 ? "Główny" : index + 1}
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={disabled}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                aria-label="Usuń obraz"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="text-sm text-gray-600 text-center">Trwa przesyłanie obrazów, proszę czekać...</div>
      )}
    </div>
  );
}
