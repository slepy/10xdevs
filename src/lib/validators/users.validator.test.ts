import { describe, it, expect } from "vitest";
import { listUsersQuerySchema } from "./users.validator";

describe("Users Validators", () => {
  describe("listUsersQuerySchema", () => {
    it("should validate with default values when no params provided", () => {
      const result = listUsersQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sort).toBeUndefined();
        expect(result.data.filter).toBeUndefined();
      }
    });

    it("should validate correct page and limit", () => {
      const validData = {
        page: "2",
        limit: "20",
      };

      const result = listUsersQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should validate correct sort parameter (created_at:desc)", () => {
      const validData = {
        sort: "created_at:desc",
      };

      const result = listUsersQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at:desc");
      }
    });

    it("should validate correct sort parameter (email:asc)", () => {
      const validData = {
        sort: "email:asc",
      };

      const result = listUsersQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("email:asc");
      }
    });

    it("should validate sort parameter without order (defaults to asc)", () => {
      const validData = {
        sort: "updated_at",
      };

      const result = listUsersQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("updated_at");
      }
    });

    it("should validate filter parameter", () => {
      const validData = {
        filter: "john@example.com",
      };

      const result = listUsersQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filter).toBe("john@example.com");
      }
    });

    it("should reject invalid page (zero)", () => {
      const invalidData = {
        page: "0",
      };

      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("dodatnią");
      }
    });

    it("should reject invalid page (negative)", () => {
      const invalidData = {
        page: "-1",
      };

      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid limit (zero)", () => {
      const invalidData = {
        limit: "0",
      };

      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject limit exceeding maximum (101)", () => {
      const invalidData = {
        limit: "101",
      };

      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100");
      }
    });

    it("should reject invalid sort field", () => {
      const invalidData = {
        sort: "invalid_field:desc",
      };

      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("field:order");
      }
    });

    it("should reject invalid sort order", () => {
      const invalidData = {
        sort: "created_at:invalid",
      };

      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject filter exceeding max length", () => {
      const invalidData = {
        filter: "a".repeat(101),
      };

      const result = listUsersQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100");
      }
    });

    it("should trim filter value", () => {
      const validData = {
        filter: "  test@example.com  ",
      };

      const result = listUsersQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filter).toBe("test@example.com");
      }
    });

    it("should handle all parameters together", () => {
      const validData = {
        page: "3",
        limit: "25",
        sort: "email:desc",
        filter: "admin",
      };

      const result = listUsersQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
        expect(result.data.sort).toBe("email:desc");
        expect(result.data.filter).toBe("admin");
      }
    });
  });
});
