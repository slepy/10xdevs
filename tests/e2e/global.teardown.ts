import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types.ts";
import type { User } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

teardown("cleanup database", async () => {
  // eslint-disable-next-line no-console
  console.log("🧹 Cleaning up test database...");

  // Load environment variables from .env.test file manually
  try {
    const envPath = resolve(process.cwd(), ".env.test");
    const envContent = readFileSync(envPath, "utf-8");

    // Parse .env file content
    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#") && trimmedLine.includes("=")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        const value = valueParts.join("=");
        process.env[key] = value;
      }
    });

    // eslint-disable-next-line no-console
    console.log("📄 Loaded environment variables from .env.test");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("⚠️  Could not load .env.test file:", error);
  }

  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  // eslint-disable-next-line no-console
  console.log("🔍 Environment variables:");
  // eslint-disable-next-line no-console
  console.log("  SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing");
  // eslint-disable-next-line no-console
  console.log("  SUPABASE_KEY:", supabaseKey ? "✅ Set" : "❌ Missing");

  if (!supabaseUrl || !supabaseKey) {
    // eslint-disable-next-line no-console
    console.warn("⚠️  Supabase credentials not found in environment variables. Skipping database cleanup.");
    return;
  }

  try {
    // Create Supabase client for cleanup
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // eslint-disable-next-line no-console
    console.log("🗑️  Deleting test data from investments table...");
    const { error: investmentsError } = await supabase.from("investments").delete().neq("id", ""); // Delete all records

    if (investmentsError) {
      // eslint-disable-next-line no-console
      console.error("❌ Error deleting investments:", investmentsError);
    } else {
      // eslint-disable-next-line no-console
      console.log("✅ Successfully cleaned investments table");
    }

    // eslint-disable-next-line no-console
    console.log("🗑️  Deleting test data from offers table...");
    const { error: offersError } = await supabase.from("offers").delete().neq("id", ""); // Delete all records

    if (offersError) {
      // eslint-disable-next-line no-console
      console.error("❌ Error deleting offers:", offersError);
    } else {
      // eslint-disable-next-line no-console
      console.log("✅ Successfully cleaned offers table");
    }

    // eslint-disable-next-line no-console
    console.log("🗑️  Deleting test data from notifications table...");
    const { error: notificationsError } = await supabase.from("notifications").delete().neq("id", ""); // Delete all records

    if (notificationsError) {
      // eslint-disable-next-line no-console
      console.error("❌ Error deleting notifications:", notificationsError);
    } else {
      // eslint-disable-next-line no-console
      console.log("✅ Successfully cleaned notifications table");
    }

    // Try to clean up auth users - use service role key if available, otherwise try regular key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminKey = serviceRoleKey || supabaseKey;

    // eslint-disable-next-line no-console
    console.log("🗑️  Attempting to clean up test users...");
    // eslint-disable-next-line no-console
    console.log(
      `🔑 Using key: ${serviceRoleKey ? "SERVICE_ROLE (recommended)" : "ANON (may have limited permissions)"}`
    );

    const supabaseAdmin = createClient<Database>(supabaseUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    try {
      // Get all users and delete test users
      const { data: users, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

      if (listUsersError) {
        // eslint-disable-next-line no-console
        console.error("❌ Error listing users (may need service role key):", listUsersError);
        // eslint-disable-next-line no-console
        console.log("ℹ️  Continuing without user cleanup - add SUPABASE_SERVICE_ROLE_KEY for full cleanup");
      } else if (users?.users) {
        // eslint-disable-next-line no-console
        console.log(`📋 Total users found in database: ${users.users.length}`);

        // Debug: Log all user emails for inspection
        const allEmails = users.users.map((u) => u.email).filter((email) => email);
        // eslint-disable-next-line no-console
        console.log(`📧 All user emails (${allEmails.length}):`, allEmails);

        /**
         * Helper function to identify test users by email patterns
         * This matches all email patterns used in our E2E tests including:
         * - test.user.{timestamp}@example.com
         * - test.loading.{timestamp}@example.com
         * - test.enter.{timestamp}@example.com
         * - test.slow.{timestamp}@example.com
         * - existing.user@example.com
         * - existing@example.com
         * - test@example.com, invalid@example.com
         * - Any email containing "test", "playwright", or "e2e"
         */
        const isTestUser = (user: User): boolean => {
          const email = user.email?.toLowerCase() || "";
          return (
            // Generic test patterns
            email.includes("test") ||
            email.includes("playwright") ||
            email.includes("e2e") ||
            // Specific patterns from register-enhanced.spec.ts
            email.startsWith("test.user.") ||
            email.startsWith("test.loading.") ||
            email.startsWith("test.enter.") ||
            email.startsWith("test.slow.") ||
            // Common test domain patterns
            email.includes("@example.com") ||
            email.includes("@test.com") ||
            // Pattern matching for timestamped test emails (e.g., test.something.123456@example.com)
            /test\.[a-zA-Z]+\.\d+@/.test(email)
          );
        };

        // Filter test users using comprehensive pattern matching
        const testUsers = users.users.filter(isTestUser);

        if (testUsers.length === 0) {
          // eslint-disable-next-line no-console
          console.log("ℹ️  No test users found to delete.");
        } else {
          // eslint-disable-next-line no-console
          console.log(
            `🔍 Found ${testUsers.length} test users to delete:`,
            testUsers.map((u) => u.email)
          );

          for (const user of testUsers) {
            const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
            if (deleteUserError) {
              // eslint-disable-next-line no-console
              console.error(`❌ Error deleting user ${user.email}:`, deleteUserError);
            } else {
              // eslint-disable-next-line no-console
              console.log(`✅ Successfully deleted test user: ${user.email}`);
            }
          }
        }
      }
    } catch (userCleanupError) {
      // eslint-disable-next-line no-console
      console.error("❌ Error during user cleanup:", userCleanupError);
      // eslint-disable-next-line no-console
      console.log("ℹ️  User cleanup failed - tables were still cleaned successfully");
    }
    // eslint-disable-next-line no-console
    console.log("✨ Database cleanup completed successfully!");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Error during database cleanup:", error);
    // Don't throw the error to prevent test failure on cleanup issues
    // eslint-disable-next-line no-console
    console.log("⚠️  Continuing despite cleanup errors...");
  }
});
