import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeAll, afterEach, afterAll } from "vitest";

/**
 * MSW server for mocking API requests in tests
 */
export const server = setupServer();

/**
 * Setup MSW server lifecycle hooks
 */
export function setupMswServer() {
  beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

/**
 * Helper to create mock API handlers
 */
export const handlers = {
  auth: {
    register: (response?: unknown, status = 200) =>
      http.post("/api/auth/register", () => {
        return HttpResponse.json(response || { data: { user: { id: "1", email: "test@example.com" } } }, { status });
      }),

    login: (response?: unknown, status = 200) =>
      http.post("/api/auth/login", () => {
        return HttpResponse.json(response || { data: { user: { id: "1", email: "test@example.com" } } }, { status });
      }),

    logout: (response?: unknown, status = 200) =>
      http.post("/api/auth/logout", () => {
        return HttpResponse.json(response || { data: { success: true } }, { status });
      }),
  },

  offers: {
    list: (response?: unknown, status = 200) =>
      http.get("/api/offers", () => {
        return HttpResponse.json(
          response || {
            data: [
              {
                id: "1",
                title: "Test Offer",
                description: "Test description",
                status: "active",
              },
            ],
          },
          { status }
        );
      }),

    get: (response?: unknown, status = 200) =>
      http.get("/api/offers/:id", () => {
        return HttpResponse.json(
          response || {
            data: {
              id: "1",
              title: "Test Offer",
              description: "Test description",
              status: "active",
            },
          },
          { status }
        );
      }),

    create: (response?: unknown, status = 201) =>
      http.post("/api/offers", () => {
        return HttpResponse.json(
          response || {
            data: {
              id: "1",
              title: "New Offer",
              description: "Test description",
              status: "draft",
            },
          },
          { status }
        );
      }),

    update: (response?: unknown, status = 200) =>
      http.put("/api/offers/:id", () => {
        return HttpResponse.json(
          response || {
            data: {
              id: "1",
              title: "Updated Offer",
              description: "Updated description",
              status: "active",
            },
          },
          { status }
        );
      }),

    delete: (response?: unknown, status = 200) =>
      http.delete("/api/offers/:id", () => {
        return HttpResponse.json(response || { data: { success: true } }, { status });
      }),
  },

  investments: {
    list: (response?: unknown, status = 200) =>
      http.get("/api/investments", () => {
        return HttpResponse.json(
          response || {
            data: [
              {
                id: "1",
                offer_id: "1",
                user_id: "1",
                amount: 10000,
                status: "pending",
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
            },
          },
          { status }
        );
      }),

    listInvestor: (response?: unknown, status = 200) =>
      http.get("/api/investments/investor", () => {
        return HttpResponse.json(
          response || {
            data: [
              {
                id: "1",
                offer_id: "1",
                user_id: "1",
                amount: 10000,
                status: "pending",
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              totalPages: 1,
            },
          },
          { status }
        );
      }),

    create: (response?: unknown, status = 201) =>
      http.post("/api/investments", () => {
        return HttpResponse.json(
          response || {
            data: {
              id: "1",
              offer_id: "1",
              user_id: "1",
              amount: 10000,
              status: "pending",
            },
          },
          { status }
        );
      }),

    update: (response?: unknown, status = 200) =>
      http.put("/api/investments/:id", () => {
        return HttpResponse.json(
          response || {
            data: {
              id: "1",
              offer_id: "1",
              user_id: "1",
              amount: 10000,
              status: "accepted",
            },
          },
          { status }
        );
      }),
  },
};
