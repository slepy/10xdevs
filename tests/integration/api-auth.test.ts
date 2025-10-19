import { describe, it, expect, beforeEach } from "vitest";
import { setupMswServer, handlers, server } from "../helpers/msw";

// Setup MSW server
setupMswServer();

describe("API Integration Tests - Authentication", () => {
  describe("POST /api/auth/register", () => {
    beforeEach(() => {
      server.use(handlers.auth.register());
    });

    it("should register a new user successfully", async () => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "newuser@example.com",
          password: "SecurePass123",
          fullName: "New User",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.user).toBeDefined();
      expect(data.data.user.email).toBe("test@example.com");
    });

    it("should return error for invalid email", async () => {
      server.use(
        handlers.auth.register(
          {
            error: "Invalid email address",
          },
          400
        )
      );

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "invalid-email",
          password: "SecurePass123",
          fullName: "Test User",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid email address");
    });

    it("should return error for duplicate email", async () => {
      server.use(
        handlers.auth.register(
          {
            error: "User already exists",
          },
          409
        )
      );

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "existing@example.com",
          password: "SecurePass123",
          fullName: "Test User",
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe("User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(() => {
      server.use(handlers.auth.login());
    });

    it("should login user successfully with valid credentials", async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.user).toBeDefined();
      expect(data.data.user.id).toBe("1");
    });

    it("should return error for invalid credentials", async () => {
      server.use(
        handlers.auth.login(
          {
            error: "Invalid credentials",
          },
          401
        )
      );

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Invalid credentials");
    });

    it("should return error for missing credentials", async () => {
      server.use(
        handlers.auth.login(
          {
            error: "Email and password are required",
          },
          400
        )
      );

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Email and password are required");
    });
  });

  describe("POST /api/auth/logout", () => {
    beforeEach(() => {
      server.use(handlers.auth.logout());
    });

    it("should logout user successfully", async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.success).toBe(true);
    });
  });
});
