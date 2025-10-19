import { vi } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Creates a mock Supabase client for testing
 */
export function createMockSupabaseClient(overrides?: Partial<SupabaseClient>): SupabaseClient {
  const mockClient = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      setSession: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      admin: {
        getUserById: vi.fn(),
      },
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    })),
    ...overrides,
  };

  return mockClient as unknown as SupabaseClient;
}

/**
 * Mock user objects for testing
 */
export const mockUsers = {
  admin: {
    id: "admin-user-id",
    email: "admin@example.com",
    user_metadata: {
      role: "ADMIN",
      full_name: "Admin User",
    },
    role: "authenticated",
  },
  signer: {
    id: "signer-user-id",
    email: "signer@example.com",
    user_metadata: {
      role: "SIGNER",
      full_name: "Signer User",
    },
    role: "authenticated",
  },
  anonymous: null,
};

/**
 * Mock session objects for testing
 */
export const mockSessions = {
  admin: {
    access_token: "mock-admin-token",
    refresh_token: "mock-admin-refresh",
    user: mockUsers.admin,
  },
  signer: {
    access_token: "mock-signer-token",
    refresh_token: "mock-signer-refresh",
    user: mockUsers.signer,
  },
};

/**
 * Helper to mock successful authentication
 */
export function mockAuthSuccess(client: SupabaseClient, userType: "admin" | "signer" = "signer") {
  const user = mockUsers[userType];
  const session = mockSessions[userType];

  vi.mocked(client.auth.getUser).mockResolvedValue({
    data: { user },
    error: null,
  } as never);

  vi.mocked(client.auth.getSession).mockResolvedValue({
    data: { session },
    error: null,
  } as never);

  return { user, session };
}

/**
 * Helper to mock authentication failure
 */
export function mockAuthFailure(client: SupabaseClient) {
  vi.mocked(client.auth.getUser).mockResolvedValue({
    data: { user: null },
    error: { message: "Unauthorized", name: "AuthError", status: 401 },
  } as never);

  vi.mocked(client.auth.getSession).mockResolvedValue({
    data: { session: null },
    error: { message: "No session", name: "AuthError", status: 401 },
  } as never);
}
