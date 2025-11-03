import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY } from "astro:env/server";

import type { Database } from "./database.types.ts";

// Server-side environment variables (from Astro's virtual module)
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_KEY;
const supabaseServiceRoleKey = SUPABASE_SERVICE_ROLE_KEY;

// Regular (client-side) Supabase client for non-request-specific usage.
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client with service_role key for admin operations (e.g., listing all users)
// IMPORTANT: This should only be used in server-side code, never exposed to the client
export const supabaseAdminClient = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabaseClient;

/**
 * Create a server-side Supabase client wired to the current request's cookies.
 *
 * Pass the Astro `context`/`request` object (anything exposing `.cookies.get/set/delete`) to
 * enable Supabase auth cookie handling on the server. This keeps cookie logic per-request.
 */
interface CookieLike {
  get(name: string): { value?: string } | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  delete(name: string, options?: Record<string, unknown>): void;
}

export function createSupabaseServerClient(context: { cookies?: CookieLike } | undefined) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return context?.cookies?.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        return context?.cookies?.set(name, value, options);
      },
      remove(name: string, options: Record<string, unknown>) {
        return context?.cookies?.delete(name, options);
      },
    },
  });
}

export type SupabaseClient = typeof supabaseClient;
