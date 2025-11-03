import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseButton, BaseFormField, BaseAlert } from "../base";
import { createOfferSchema, type CreateOfferInput } from "../../lib/validators/offers.validator";
import type { CreateOfferWithImagesDTO, ApiResponse, OfferDTO, OfferWithImagesDTO } from "../../types";
import MultiImageUpload from "../ui/MultiImageUpload";

interface OfferFormProps {
  mode: "create" | "edit";
  offerId?: string;
  initialData?: OfferWithImagesDTO;
}

export default function OfferForm({ mode, offerId, initialData }: OfferFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [redirectToList, setRedirectToList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (redirectToList) {
      window.location.href = "/admin/offers";
    }
  }, [redirectToList]);

  // Convert initial data to form format if in edit mode
  const getDefaultValues = (): CreateOfferInput => {
    if (mode === "edit" && initialData) {
      // Convert end_at to datetime-local format (YYYY-MM-DDTHH:mm)
      const endAtDate = new Date(initialData.end_at);
      const formattedEndAt = endAtDate.toISOString().slice(0, 16);

      return {
        name: initialData.name,
        description: initialData.description || "",
        target_amount: initialData.target_amount, // Already in PLN from backend
        minimum_investment: initialData.minimum_investment, // Already in PLN from backend
        end_at: formattedEndAt,
        images: initialData.images || undefined,
      };
    }

    return {
      name: "",
      description: "",
      target_amount: 0,
      minimum_investment: 0,
      end_at: "",
      images: undefined,
    };
  };

  const form = useForm<CreateOfferInput>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: getDefaultValues(),
  });

  const onSubmit = async (data: CreateOfferInput) => {
    try {
      setServerError(null);
      setIsLoading(true);

      // Transform data from ViewModel to DTO
      const offerData: CreateOfferWithImagesDTO = {
        name: data.name,
        description: data.description || null,
        target_amount: data.target_amount,
        minimum_investment: data.minimum_investment,
        end_at: data.end_at,
        images: data.images && data.images.length > 0 ? data.images : undefined,
      };

      const url = mode === "create" ? "/api/offers" : `/api/offers/${offerId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setServerError(
          errorData.message || `Wystąpił błąd podczas ${mode === "create" ? "tworzenia" : "aktualizacji"} oferty.`
        );
        return;
      }

      const result: ApiResponse<OfferDTO> = await response.json();

      // Success: redirect to offers list
      if (result) {
        setRedirectToList(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error ${mode === "create" ? "creating" : "updating"} offer:`, error);
      setServerError("Błąd połączenia z serwerem. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  const { isSubmitting, errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && <BaseAlert variant="error">{serverError}</BaseAlert>}

      <BaseFormField
        label="Nazwa oferty"
        labelProps={{ required: true }}
        error={errors.name?.message}
        inputProps={{
          id: "name",
          type: "text",
          placeholder: "Wprowadź nazwę oferty",
          ...form.register("name"),
        }}
      />

      {/* Images upload */}
      <div className="space-y-2">
        <label htmlFor="images" className="block text-sm font-medium text-gray-700">
          Obrazy oferty <span className="text-gray-500 text-xs">(opcjonalne, max 5 obrazów)</span>
        </label>
        <Controller
          name="images"
          control={form.control}
          render={({ field }) => (
            <MultiImageUpload
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              maxFiles={5}
              maxFileSize={5 * 1024 * 1024}
            />
          )}
        />
        {errors.images?.message && <p className="text-sm text-red-600">{errors.images.message}</p>}
      </div>

      <BaseFormField
        label="Opis oferty"
        labelProps={{ optional: true }}
        error={errors.description?.message}
        fieldType="textarea"
        textareaProps={{
          id: "description",
          rows: 4,
          placeholder: "Wprowadź opis oferty (opcjonalne)",
          ...form.register("description"),
        }}
      />

      <BaseFormField
        label="Docelowa kwota (PLN)"
        labelProps={{ required: true }}
        error={errors.target_amount?.message}
        inputProps={{
          id: "target_amount",
          type: "number",
          step: "0.01",
          min: "0",
          placeholder: "0.00",
          ...form.register("target_amount", { valueAsNumber: true }),
        }}
      />

      <BaseFormField
        label="Minimalna inwestycja (PLN)"
        labelProps={{ required: true }}
        error={errors.minimum_investment?.message}
        inputProps={{
          id: "minimum_investment",
          type: "number",
          step: "0.01",
          min: "0",
          placeholder: "0.00",
          ...form.register("minimum_investment", { valueAsNumber: true }),
        }}
      />

      <BaseFormField
        label="Data zakończenia"
        labelProps={{ required: true }}
        error={errors.end_at?.message}
        inputProps={{
          id: "end_at",
          type: "datetime-local",
          ...form.register("end_at"),
        }}
      />

      {/* Submit button */}
      <div className="flex justify-end gap-3">
        <BaseButton
          type="button"
          variant="outline"
          onClick={() => {
            window.location.href = "/admin/offers";
          }}
          disabled={isSubmitting}
        >
          Anuluj
        </BaseButton>
        <BaseButton
          type="submit"
          disabled={isSubmitting || isLoading}
          loading={isSubmitting || isLoading}
          className="min-w-[140px]"
        >
          {isSubmitting || isLoading
            ? mode === "create"
              ? "Tworzenie..."
              : "Aktualizacja..."
            : mode === "create"
              ? "Utwórz ofertę"
              : "Zaktualizuj ofertę"}
        </BaseButton>
      </div>
    </form>
  );
}
