import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvestmentActions } from "./InvestmentActions";
import type { InvestmentDetailsViewModel } from "@/types";

describe("InvestmentActions", () => {
  const mockOnCancel = vi.fn();
  const mockOnStatusChange = vi.fn();

  const baseInvestment: InvestmentDetailsViewModel = {
    id: "test-id",
    amount: 10000,
    status: "pending",
    created_at: "2024-01-01T00:00:00Z",
    offer: {
      id: "offer-id",
      name: "Test Offer",
      description: "Test Description",
      target_amount: 100000,
      minimum_investment: 1000,
      status: "active",
      end_at: "2024-12-31T00:00:00Z",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("for Signer role", () => {
    it("should show cancel button when status is pending", () => {
      render(
        <InvestmentActions
          investment={baseInvestment}
          userRole="signer"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByRole("button", { name: /anuluj/i })).toBeInTheDocument();
    });

    it("should not show any buttons when status is accepted", () => {
      const acceptedInvestment = { ...baseInvestment, status: "accepted" as const };
      const { container } = render(
        <InvestmentActions
          investment={acceptedInvestment}
          userRole="signer"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <InvestmentActions
          investment={baseInvestment}
          userRole="signer"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("for Admin role", () => {
    it("should show accept and reject buttons when status is pending", () => {
      render(
        <InvestmentActions
          investment={baseInvestment}
          userRole="admin"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByRole("button", { name: /akceptuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /odrzuć/i })).toBeInTheDocument();
    });

    it("should show complete button when status is accepted", () => {
      const acceptedInvestment = { ...baseInvestment, status: "accepted" as const };
      render(
        <InvestmentActions
          investment={acceptedInvestment}
          userRole="admin"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByRole("button", { name: /zakończ inwestycję/i })).toBeInTheDocument();
    });

    it("should not show any buttons when status is completed", () => {
      const completedInvestment = { ...baseInvestment, status: "completed" as const };
      const { container } = render(
        <InvestmentActions
          investment={completedInvestment}
          userRole="admin"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should call onStatusChange with 'accepted' when accept button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <InvestmentActions
          investment={baseInvestment}
          userRole="admin"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      const acceptButton = screen.getByRole("button", { name: /akceptuj/i });
      await user.click(acceptButton);

      expect(mockOnStatusChange).toHaveBeenCalledWith("accepted");
    });

    it("should call onStatusChange with 'rejected' when reject button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <InvestmentActions
          investment={baseInvestment}
          userRole="admin"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      const rejectButton = screen.getByRole("button", { name: /odrzuć/i });
      await user.click(rejectButton);

      expect(mockOnStatusChange).toHaveBeenCalledWith("rejected");
    });

    it("should call onStatusChange with 'completed' when complete button is clicked", async () => {
      const user = userEvent.setup();
      const acceptedInvestment = { ...baseInvestment, status: "accepted" as const };
      render(
        <InvestmentActions
          investment={acceptedInvestment}
          userRole="admin"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
        />
      );

      const completeButton = screen.getByRole("button", { name: /zakończ inwestycję/i });
      await user.click(completeButton);

      expect(mockOnStatusChange).toHaveBeenCalledWith("completed");
    });

    it("should disable buttons when isLoading is true", () => {
      render(
        <InvestmentActions
          investment={baseInvestment}
          userRole="admin"
          onCancel={mockOnCancel}
          onStatusChange={mockOnStatusChange}
          isLoading={true}
        />
      );

      const acceptButton = screen.getByRole("button", { name: /akceptowanie.../i });
      const rejectButton = screen.getByRole("button", { name: /odrzucanie.../i });

      expect(acceptButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });
  });
});
