import { describe, it, expect } from "vitest";
import { z } from "zod";

// Example validator schema
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

describe("Auth Validators", () => {
  describe("registerSchema", () => {
    it("should validate correct registration data", () => {
      const validData = {
        email: "test@example.com",
        password: "SecurePass123",
        fullName: "John Doe",
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "SecurePass123",
        fullName: "John Doe",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("should reject short password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "short",
        fullName: "John Doe",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
      }
    });

    it("should reject short full name", () => {
      const invalidData = {
        email: "test@example.com",
        password: "SecurePass123",
        fullName: "J",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Full name must be at least 2 characters");
      }
    });

    it("should reject missing fields", () => {
      const invalidData = {
        email: "test@example.com",
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should validate correct login data", () => {
      const validData = {
        email: "test@example.com",
        password: "password",
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "test@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password is required");
      }
    });
  });
});
