import { describe, it, expect } from "vitest";
import { getInvestmentStatusBadge } from "./investment-status";
import { INVESTMENT_STATUSES } from "@/types";

describe("getInvestmentStatusBadge", () => {
  it("should return correct config for pending status", () => {
    const config = getInvestmentStatusBadge(INVESTMENT_STATUSES.PENDING);

    expect(config).toEqual({
      variant: "secondary",
      label: "W oczekiwaniu",
    });
  });

  it("should return correct config for accepted status", () => {
    const config = getInvestmentStatusBadge(INVESTMENT_STATUSES.ACCEPTED);

    expect(config).toEqual({
      variant: "default",
      label: "Zaakceptowana",
    });
  });

  it("should return correct config for rejected status", () => {
    const config = getInvestmentStatusBadge(INVESTMENT_STATUSES.REJECTED);

    expect(config).toEqual({
      variant: "destructive",
      label: "Odrzucona",
    });
  });

  it("should return correct config for cancelled status", () => {
    const config = getInvestmentStatusBadge(INVESTMENT_STATUSES.CANCELLED);

    expect(config).toEqual({
      variant: "outline",
      label: "Anulowana",
    });
  });

  it("should return correct config for completed status", () => {
    const config = getInvestmentStatusBadge(INVESTMENT_STATUSES.COMPLETED);

    expect(config).toEqual({
      variant: "default",
      label: "Zakończona",
    });
  });

  it("should return fallback config for unknown status", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unknownStatus = "unknown_status" as any;
    const config = getInvestmentStatusBadge(unknownStatus);

    expect(config).toEqual({
      variant: "secondary",
      label: unknownStatus,
    });
  });
});
