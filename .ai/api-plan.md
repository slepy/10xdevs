# REST API Plan

## 1. Resources

- **Users**: Represents application users managed through Supabase authentication. Schema fields: `id`, `email`, etc.
- **Offers**: Investment offers available for viewing and management. Schema fields: `id`, `name`, `description`, `target_amount`, `minimum_investment`, `end_at`, `status`.
- **Investments**: User-submitted investment declarations. Schema fields: `id`, `user_id`, `offer_id`, `amount`, `created_at`, `status`, `completed_at`.
- **Notifications**: Alerts for users related to investment activities. Schema fields: `id`, `user_id`, `created_at`, `is_read`, `content`.

## 2. Endpoints

### Users

- **User List (Admin only)**
  - **Method:** GET
  - **URL:** `/api/users`
  - **Description:** Retrieves a list of all registered users.
  - **Response:**
    - 200 OK: `[{ "id": "uuid", "email": "string" }, ...]`
    - 403 Forbidden if not admin.

### Offers

- **Create Offer (Admin only)**
  - **Method:** POST
  - **URL:** `/api/offers`
  - **Description:** Create a new investment offer. Validates required fields such as `name`, `target_amount`, etc.
  - **Request Payload:**

    ```json
    {
      "name": "string",
      "description": "string",
      "target_amount": number,
      "minimum_investment": number,
      "end_at": "ISO8601 datetime",
      "status": "active"
    }
    ```

  - **Response:**
    - 201 Created: Newly created offer data
    - 400 Bad Request for missing or invalid data.

- **List Offers**
  - **Method:** GET
  - **URL:** `/api/offers`
  - **Description:** Retrieves a paginated list of active offers. Supports filtering (e.g., status), sorting, and pagination.
  - **Query Parameters:** `page`, `limit`, `sort`, `filter`
  - **Response:**
    - 200 OK: `{ "offers": [...], "pagination": { "page": number, "limit": number, "total": number } }`

- **List Available Offers for Investment**
  - **Method:** GET
  - **URL:** `/api/offers/available`
  - **Description:** Retrieves a paginated list of offers available for investment. Returns only offers with status `active` and where `end_at` date is in the future (later than current time).
  - **Query Parameters:** `page`, `limit`, `sort`
  - **Response:**
    - 200 OK: `{ "offers": [...], "pagination": { "page": number, "limit": number, "total": number } }`
  - **Note:** Public endpoint - no authentication required. Automatically filters out expired or non-active offers.

- **Get Offer Details**
  - **Method:** GET
  - **URL:** `/api/offers/:offerId`
  - **Description:** Retrieves detailed information of a specific offer.
  - **Response:**
    - 200 OK: Offer details
    - 404 Not Found if not exists.

- **Update Offer (Admin only)**
  - **Method:** PUT
  - **URL:** `/api/offers/:offerId`
  - **Description:** Update existing offer details. Triggers validation on required fields.
  - **Request Payload:** Partial or full offer data.
  - **Response:**
    - 200 OK: Updated offer data.
    - 400/404 on error.

- **Delete Offer (Admin only)**
  - **Method:** DELETE
  - **URL:** `/api/offers/:offerId`
  - **Description:** Remove an offer from the system.
  - **Response:**
    - 204 No Content on success.
    - 404 if not found.

### Investments

- **Submit Investment (Signer)**
  - **Method:** POST
  - **URL:** `/api/investments`
  - **Description:** Allows a signed-in user (Signer) to submit an investment declaration for an offer. Must validate that the amount meets minimum criteria.
  - **Request Payload:**

    ```json
    {
      "offer_id": "uuid",
      "amount": number
    }
    ```

  - **Response:**
    - 201 Created: Investment record with status `pending`.
    - 400 Bad Request if validations fail (e.g., below minimum investment).

- **List Investments (User-specific)**
  - **Method:** GET
  - **URL:** `/api/investments`
  - **Description:** Retrieves investments for the authenticated user with options for pagination.
  - **Query Parameters:** `page`, `limit`, `status`
  - **Response:**
    - 200 OK: Investment records list.

- **Update Investment Status (Admin only)**
  - **Method:** PUT
  - **URL:** `/api/investments/:investmentId`
  - **Description:** Admin can update investment status (e.g., accept, reject, close) based on business logic.
  - **Request Payload:**

    ```json
    { "status": "accepted" | "rejected" | "closed" }
    ```

  - **Response:**
    - 200 OK: Updated investment data.
    - 400 Bad Request if transition is invalid.

- **Cancel Investment (Signer)**
  - **Method:** PUT
  - **URL:** `/api/investments/:investmentId/cancel`
  - **Description:** Allows a Signer to cancel a pending investment. Only allowed if status is `pending`.
  - **Response:**
    - 200 OK: Investment status updated to cancelled.
    - 400 Bad Request if investment cannot be cancelled.

### Notifications

- **List Notifications (User-specific)**
  - **Method:** GET
  - **URL:** `/api/notifications`
  - **Description:** Retrieves notifications for the authenticated user, with pagination support.
  - **Query Parameters:** `page`, `limit`, `is_read`
  - **Response:**
    - 200 OK: List of notifications.

- **Mark Notification as Read**
  - **Method:** PUT
  - **URL:** `/api/notifications/:notificationId/read`
  - **Description:** Marks a specific notification as read.
  - **Response:**
    - 200 OK: Updated notification object.

## 3. Authentication and Authorization

- **Mechanism:** JWT-based authentication integrated with Supabase Auth.
- **Implementation:**
  - Endpoints for registration and login will generate and validate JWT tokens.
  - Role-based access control ensures that endpoints marked for Admin (such as user management, offer management, and investment status updates) are accessible only to users with admin privileges.
  - Secure endpoints using middleware to validate tokens and verify user roles.

## 4. Validation and Business Logic

- **Validation:**
  - **Users:** Ensure unique email addresses on registration.
  - **Offers:** All required fields (`name`, `target_amount`, `minimum_investment`, `end_at`, and `status`) must be provided and validated according to type. Database schema enforces data integrity.
  - **Investments:** Validate that investment `amount` meets the minimum investment criteria of the corresponding offer. Only allow cancellation if the investment status is `pending`.
  - **Notifications:** Only the notification owner may modify or view notifications.

- **Business Logic Mapping from PRD:**
  - **User Authentication & Registration (FU-01 & US-002):** Handled via `/api/users/register` and `/api/users/login` endpoints.
  - **User Management (FU-02 & US-012):** Admin-only endpoint for listing users.
  - **Offer Management (US-003, US-004, US-005):** CRUD operations on offers with create, update, delete restricted to Admin.
  - **Preview Offers (US-003):** Public access GET endpoint `/api/offers` for browsing active offers.
  - **Investment Submission (US-006):** Endpoint `/api/investments` for Signers to invest, with checks for minimum investment.
  - **Investment Tracking (US-007):** User-specific GET endpoint `/api/investments` enabling Signers to view their investments.
  - **Investment Cancellation (US-008):** Endpoint `/api/investments/:investmentId/cancel` to cancel pending investments.
  - **Investment Management (US-009, US-011):** Admin endpoint to update investment status (accept, reject, close).
  - **Document Handling (US-010):** Although adding documents is mentioned, it can be implemented as an additional endpoint (e.g., `/api/investments/:investmentId/documents`) with file upload capability.

- **Performance and Security Considerations:**
  - **Pagination, Filtering, and Sorting:** Implemented for list endpoints to efficiently handle large datasets.
  - **Rate Limiting and Input Sanitization:** Ensure endpoints are secured against abuse and injection attacks.
  - **Database Indexes:** Utilize schema indexes on `user_id` and `offer_id` for efficient querying.
