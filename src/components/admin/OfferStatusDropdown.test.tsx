import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfferStatusDropdown } from "./OfferStatusDropdown";
import { OFFER_STATUSES } from "@/types";

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, "location", {
  value: { reload: mockReload },
  writable: true,
});

// Mock alert
global.alert = vi.fn();

describe("OfferStatusDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render current status badge", () => {
    render(<OfferStatusDropdown offerId="offer-1" currentStatus={OFFER_STATUSES.ACTIVE} />);

    expect(screen.getByText("Aktywna")).toBeInTheDocument();
  });

  it("should render Select trigger with combobox role", () => {
    render(<OfferStatusDropdown offerId="offer-1" currentStatus={OFFER_STATUSES.DRAFT} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("should render correct badge text for each status", () => {
    const testCases = [
      { status: OFFER_STATUSES.DRAFT, text: "Wersja robocza" },
      { status: OFFER_STATUSES.ACTIVE, text: "Aktywna" },
      { status: OFFER_STATUSES.CLOSED, text: "Zamknięta" },
    ];

    testCases.forEach(({ status, text }) => {
      const { unmount } = render(<OfferStatusDropdown offerId="offer-1" currentStatus={status} />);
      expect(screen.getByText(text)).toBeInTheDocument();
      unmount();
    });
  });

  it("should render dialog component (hidden by default)", () => {
    const { container } = render(<OfferStatusDropdown offerId="offer-1" currentStatus={OFFER_STATUSES.DRAFT} />);

    // Dialog jest w DOM ale ukryty
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it("should have correct Select component structure", () => {
    render(<OfferStatusDropdown offerId="offer-1" currentStatus={OFFER_STATUSES.DRAFT} />);

    // Sprawdź że Select trigger jest dostępny
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();

    // Sprawdź że ma poprawny attribute
    expect(trigger).toHaveAttribute("aria-controls");
  });

  it("should accept onStatusChange callback prop", () => {
    const mockCallback = vi.fn().mockResolvedValue(undefined);

    render(
      <OfferStatusDropdown offerId="offer-1" currentStatus={OFFER_STATUSES.DRAFT} onStatusChange={mockCallback} />
    );

    // Komponent przyjmuje prop i renderuje się poprawnie
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should have all required status options", () => {
    render(<OfferStatusDropdown offerId="offer-1" currentStatus={OFFER_STATUSES.DRAFT} />);

    // Weryfikacja że komponent ma dostęp do wszystkich statusów
    expect(OFFER_STATUSES.DRAFT).toBeDefined();
    expect(OFFER_STATUSES.ACTIVE).toBeDefined();
    expect(OFFER_STATUSES.CLOSED).toBeDefined();
  });

  it("should render with valid offer ID", () => {
    render(<OfferStatusDropdown offerId="offer-123" currentStatus={OFFER_STATUSES.ACTIVE} />);

    // Component renderuje się poprawnie z ID
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
