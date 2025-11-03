import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OffersTable } from "./OffersTable";
import { OFFER_STATUSES, type OfferDTO } from "@/types";

describe("OffersTable", () => {
  const mockOffers: OfferDTO[] = [
    {
      id: "1",
      name: "Startup ABC",
      description: "Opis oferty ABC",
      target_amount: 100000, // Backend zwraca PLN
      minimum_investment: 1000, // Backend zwraca PLN
      status: OFFER_STATUSES.ACTIVE,
      end_at: "2025-12-31T23:59:59Z",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Firma XYZ",
      description: "Opis oferty XYZ",
      target_amount: 50000, // Backend zwraca PLN
      minimum_investment: 500, // Backend zwraca PLN
      status: OFFER_STATUSES.DRAFT,
      end_at: "2025-11-30T23:59:59Z",
      created_at: "2025-01-02T00:00:00Z",
      updated_at: "2025-01-02T00:00:00Z",
    },
  ];

  it("should render empty state when no offers", () => {
    render(<OffersTable offers={[]} />);

    expect(screen.getByText("Brak dostępnych ofert")).toBeInTheDocument();
    expect(screen.getByText("Dodaj pierwszą ofertę, aby rozpocząć zarządzanie inwestycjami.")).toBeInTheDocument();
  });

  it("should render table with offers", () => {
    render(<OffersTable offers={mockOffers} />);

    // Sprawdź czy nagłówki są widoczne
    expect(screen.getByText("Nazwa")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Data zakończenia")).toBeInTheDocument();
    expect(screen.getByText("Akcje")).toBeInTheDocument();

    // Sprawdź czy oferty są widoczne
    expect(screen.getByText("Startup ABC")).toBeInTheDocument();
    expect(screen.getByText("Firma XYZ")).toBeInTheDocument();
  });

  it("should display status badges correctly", () => {
    render(<OffersTable offers={mockOffers} />);

    expect(screen.getByText("Aktywna")).toBeInTheDocument();
    expect(screen.getByText("Wersja robocza")).toBeInTheDocument();
  });

  it("should display formatted dates", () => {
    render(<OffersTable offers={mockOffers} />);

    // Sprawdź czy daty są sformatowane (nie sprawdzamy dokładnej wartości ze względu na strefy czasowe)
    const formattedDates = screen.getAllByText(/\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/);
    expect(formattedDates).toHaveLength(2);
  });

  it("should render edit buttons for each offer", () => {
    render(<OffersTable offers={mockOffers} />);

    const editButtons = screen.getAllByText("Edytuj");
    expect(editButtons).toHaveLength(2);
  });

  it("should have correct edit links", () => {
    render(<OffersTable offers={mockOffers} />);

    const editLinks = screen.getAllByRole("link");
    expect(editLinks[0]).toHaveAttribute("href", "/admin/offers/1/edit");
    expect(editLinks[1]).toHaveAttribute("href", "/admin/offers/2/edit");
  });

  it("should display placeholder for missing date", () => {
    const offerWithoutDate: OfferDTO = {
      ...mockOffers[0],
      end_at: "",
    };

    render(<OffersTable offers={[offerWithoutDate]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
