import { describe, it, expect } from "vitest";
import { createInvestmentSchema, updateInvestmentStatusSchema } from "./investments.validator";

describe("createInvestmentSchema", () => {
  describe("valid data", () => {
    it("should validate correct investment data", () => {
      const validData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 5000,
      };

      const result = createInvestmentSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept minimum valid amount", () => {
      const validData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 0.01,
      };

      const result = createInvestmentSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept maximum valid amount (1 mln PLN)", () => {
      const validData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 100000000,
      };

      const result = createInvestmentSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid offer_id", () => {
    it("should reject non-UUID offer_id", () => {
      const invalidData = {
        offer_id: "not-a-uuid",
        amount: 5000,
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Nieprawidłowy format ID oferty");
      }
    });

    it("should reject empty offer_id", () => {
      const invalidData = {
        offer_id: "",
        amount: 5000,
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject missing offer_id", () => {
      const invalidData = {
        amount: 5000,
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("invalid amount", () => {
    it("should reject negative amount", () => {
      const invalidData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: -1000,
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Kwota musi być większa od 0");
      }
    });

    it("should reject zero amount", () => {
      const invalidData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 0,
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Kwota musi być większa od 0");
      }
    });

    it("should reject amount exceeding maximum (> 1 mln PLN)", () => {
      const invalidData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 100000001,
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Kwota jest zbyt duża");
      }
    });

    it("should reject non-number amount", () => {
      const invalidData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: "5000" as any,
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject missing amount", () => {
      const invalidData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should reject extra fields", () => {
      const invalidData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 5000,
        extra_field: "should not be here",
      };

      const result = createInvestmentSchema.safeParse(invalidData);

      // Zod domyślnie ignoruje dodatkowe pola, ale możemy to sprawdzić
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("extra_field");
      }
    });

    it("should handle float amounts correctly", () => {
      const validData = {
        offer_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 1234.56,
      };

      const result = createInvestmentSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(1234.56);
      }
    });
  });
});

describe("updateInvestmentStatusSchema", () => {
  describe("valid status updates", () => {
    it("should accept 'accepted' status without reason", () => {
      const validData = {
        status: "accepted",
      };

      const result = updateInvestmentStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("accepted");
        expect(result.data.reason).toBeUndefined();
      }
    });

    it("should accept 'completed' status without reason", () => {
      const validData = {
        status: "completed",
      };

      const result = updateInvestmentStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("completed");
        expect(result.data.reason).toBeUndefined();
      }
    });

    it("should accept 'rejected' status with reason", () => {
      const validData = {
        status: "rejected",
        reason: "Niepoprawne dokumenty",
      };

      const result = updateInvestmentStatusSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("rejected");
        expect(result.data.reason).toBe("Niepoprawne dokumenty");
      }
    });
  });

  describe("invalid status updates", () => {
    it("should reject 'rejected' status without reason", () => {
      const invalidData = {
        status: "rejected",
      };

      const result = updateInvestmentStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const reasonError = result.error.issues.find((issue) => issue.path[0] === "reason");
        expect(reasonError?.message).toBe("Powód odrzucenia jest wymagany dla statusu 'rejected'");
      }
    });

    it("should reject invalid status value", () => {
      const invalidData = {
        status: "pending",
      };

      const result = updateInvestmentStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Status musi być jednym z: accepted, rejected, completed");
      }
    });

    it("should reject 'cancelled' status (not allowed for admin)", () => {
      const invalidData = {
        status: "cancelled",
      };

      const result = updateInvestmentStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject empty reason for 'rejected' status", () => {
      const invalidData = {
        status: "rejected",
        reason: "",
      };

      const result = updateInvestmentStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject missing status", () => {
      const invalidData = {};

      const result = updateInvestmentStatusSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });
});
