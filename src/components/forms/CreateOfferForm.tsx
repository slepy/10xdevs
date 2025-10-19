import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseButton, BaseFormField, BaseAlert } from "../base";
import { createOfferSchema, type CreateOfferViewModel } from "../../lib/validators/offers.validator";
import type { CreateOfferDTO, ApiResponse, OfferDTO } from "../../types";

export default function CreateOfferForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [redirectToList, setRedirectToList] = useState(false);

  useEffect(() => {
    if (redirectToList) {
      window.location.href = "/admin/offers";
    }
  }, [redirectToList]);

  const form = useForm<CreateOfferViewModel>({
    resolver: zodResolver(createOfferSchema),
    defaultValues: {
      name: "",
      description: "",
      target_amount: 0,
      minimum_investment: 0,
    },
  });

  const onSubmit = async (data: CreateOfferViewModel) => {
    try {
      setServerError(null);

      // Transform data from ViewModel to DTO
      const createOfferData: CreateOfferDTO = {
        name: data.name,
        description: data.description || null,
        target_amount: data.target_amount,
        minimum_investment: data.minimum_investment,
        end_at: data.end_at.toISOString(),
      };

      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createOfferData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setServerError(errorData.message || "Wystąpił błąd podczas tworzenia oferty.");
        return;
      }

      const result: ApiResponse<OfferDTO> = await response.json();

      // Success: redirect to offers list
      if (result) {
        setRedirectToList(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating offer:", error);
      setServerError("Błąd połączenia z serwerem. Spróbuj ponownie później.");
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
          ...form.register("end_at", {
            setValueAs: (value: string) => (value ? new Date(value) : undefined),
          }),
        }}
      />

      {/* Submit button */}
      <div className="flex justify-end">
        <BaseButton type="submit" disabled={isSubmitting} loading={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? "Tworzenie..." : "Utwórz ofertę"}
        </BaseButton>
      </div>
    </form>
  );
}
