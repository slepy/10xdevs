import React from "react";
import OfferForm from "./OfferForm";
import type { OfferWithImagesDTO } from "../../types";

interface EditOfferFormProps {
  offerId: string;
  initialData: OfferWithImagesDTO;
}

export default function EditOfferForm({ offerId, initialData }: EditOfferFormProps) {
  return <OfferForm mode="edit" offerId={offerId} initialData={initialData} />;
}
