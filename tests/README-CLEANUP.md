# E2E Tests Database Cleanup

## Overview

This project implements automatic database cleanup after E2E tests using Playwright's teardown functionality. The cleanup ensures that test data doesn't accumulate in the Supabase database.

## Configuration

### Environment Variables

To enable database cleanup, ensure your `.env` file contains the following variables:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key  # Optional: for user cleanup
```

### What Gets Cleaned Up

The teardown process removes:

1. **All records from `investments` table**
2. **All records from `offers` table**
3. **All records from `notifications` table**
4. **Test users** (if `SUPABASE_SERVICE_ROLE_KEY` is provided)
   - Users with emails containing "test", "playwright", or "e2e"

## How It Works

The cleanup is configured using Playwright's project dependencies pattern:

- **cleanup db**: Project that runs the teardown script
- **chromium**: Main test project that depends on teardown

After all tests in the `chromium` project complete, the `cleanup db` project automatically runs to clean the database.

## Configuration Files

### playwright.config.ts

```typescript
projects: [
  {
    name: "cleanup db",
    testMatch: /global\.teardown\.ts/,
  },
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
    teardown: "cleanup db",
  },
];
```

### global.teardown.ts

Contains the cleanup logic that:

- Connects to Supabase using environment credentials
- Deletes all test data from tables
- Optionally removes test users (if service role key provided)
- Logs cleanup progress and handles errors gracefully

## Usage

### Running Tests with Cleanup

```bash
# Run all tests (cleanup runs automatically after)
npm run test:e2e

# Run specific test file (cleanup still runs after all project tests)
npx playwright test auth.spec.ts

# Run tests without cleanup (skip teardown)
npx playwright test --no-deps
```

### Manual Cleanup

To run just the cleanup without tests:

```bash
npx playwright test --project="cleanup db"
```

## Error Handling

- If Supabase credentials are missing, cleanup is skipped with a warning
- Cleanup errors don't fail the test run - they're logged and execution continues
- Individual table cleanup failures are logged separately

## Security Considerations

1. **Service Role Key**: Only required for user cleanup. Keep this secure and use in test environments only.

2. **Test Data Identification**: Users are identified as "test users" by email patterns. Adjust the filter logic in `global.teardown.ts` if needed:

```typescript
const testUsers = users.users.filter(
  (user: User) => user.email?.includes("test") || user.email?.includes("playwright") || user.email?.includes("e2e")
);
```

3. **Production Safety**: Ensure this cleanup only runs in test environments by checking environment variables or using separate Supabase projects.

## Troubleshooting

### Common Issues

1. **"Supabase credentials not found"**
   - Ensure `.env` file exists and contains required variables
   - Check variable names match exactly

2. **"Error deleting [table]"**
   - Verify database permissions for the API key
   - Check if tables exist in your Supabase project

3. **Users not being deleted**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
   - Verify the service role has user management permissions

### Debug Logging

The cleanup process logs detailed information:

- ✅ Success messages for each table cleaned
- ❌ Error messages with details
- ⚠️ Warnings for missing configuration

## Customization

### Adding New Tables

To clean additional tables, add them to `global.teardown.ts`:

```typescript
console.log("🗑️  Deleting test data from new_table...");
const { error: newTableError } = await supabase.from("new_table").delete().neq("id", "");

if (newTableError) {
  console.error("❌ Error deleting new_table:", newTableError);
} else {
  console.log("✅ Successfully cleaned new_table");
}
```

### Selective Data Cleanup

Instead of deleting all records, you can filter by specific criteria:

```typescript
// Only delete records created in the last hour (test data)
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const { error } = await supabase.from("offers").delete().gte("created_at", oneHourAgo);
```
