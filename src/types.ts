import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: string;
}

// ============================================================================
// OFFERS - DTO & COMMAND MODELS
// ============================================================================

/**
 * DTO for creating a new offer (POST /api/offers)
 * Derived from offers table, excluding auto-generated fields
 */
export type CreateOfferDTO = Omit<TablesInsert<"offers">, "id" | "created_at" | "updated_at" | "status">;

/**
 * Request body for creating a new offer with images
 * Extends CreateOfferDTO with images array
 */
export interface CreateOfferWithImagesDTO extends CreateOfferDTO {
  images?: string[];
}

/**
 * DTO for updating an existing offer (PUT /api/offers/:offerId)
 * All fields are optional for partial updates, excluding status which has dedicated endpoint
 */
export type UpdateOfferDTO = Partial<Omit<TablesUpdate<"offers">, "id" | "created_at" | "updated_at" | "status">>;

/**
 * DTO for updating offer status only (PUT /api/offers/:offerId/status)
 * Dedicated endpoint for status changes only
 */
export interface UpdateOfferStatusDTO {
  status: OfferStatus;
}

/**
 * Full offer data as returned by API
 */
export type OfferDTO = Tables<"offers">;

/**
 * Offer data with images array
 * Used when fetching offers with their associated images
 */
export interface OfferWithImagesDTO extends OfferDTO {
  images?: string[];
}

/**
 * Response for offers list endpoint (GET /api/offers)
 */
export type OfferListResponse = PaginatedResponse<OfferDTO>;

/**
 * Response for available offers endpoint (GET /api/offers/available)
 * Includes images array for each offer
 */
export type AvailableOffersResponse = PaginatedResponse<OfferWithImagesDTO>;

/**
 * Query parameters for offers list endpoint
 */
export interface OfferQueryParams extends ListQueryParams {
  status?: string;
}

// ============================================================================
// INVESTMENTS - DTO & COMMAND MODELS
// ============================================================================

/**
 * DTO for submitting a new investment (POST /api/investments)
 * Only requires offer_id and amount, user_id comes from auth context
 */
export type CreateInvestmentDTO = Pick<TablesInsert<"investments">, "offer_id" | "amount">;

/**
 * DTO for updating investment status (PUT /api/investments/:investmentId)
 * Used for all status changes including acceptance, rejection, cancellation, and completion
 * Admin can update any status, Users can only cancel their own pending investments
 */
export type UpdateInvestmentStatusDTO = Pick<TablesUpdate<"investments">, "status"> & {
  completed_at?: string | null;
  reason?: string | null;
  deleted_at?: string | null;
};

/**
 * DTO for cancelling an investment by user (PUT /api/investments/:investmentId/cancel)
 * Used when a Signer wants to cancel their own pending investment
 */
export interface CancelInvestmentDTO {
  reason: string;
}

/**
 * Full investment data as returned by API
 */
export type InvestmentDTO = Tables<"investments">;

/**
 * Response for investments list endpoint (GET /api/investments)
 */
export type InvestmentListResponse = PaginatedResponse<InvestmentDTO>;

/**
 * Response for user investments list endpoint (GET /api/investments/user)
 * Includes simplified offer details (name only)
 */
export type UserInvestmentListResponse = PaginatedResponse<InvestmentWithOfferNameDTO>;

/**
 * Query parameters for investments list endpoint
 */
export interface InvestmentQueryParams extends ListQueryParams {
  status?: string;
  offer_id?: string;
}

// ============================================================================
// NOTIFICATIONS - DTO & COMMAND MODELS
// ============================================================================

/**
 * DTO for creating a new notification
 * Used internally by the system to notify users
 */
export type CreateNotificationDTO = Omit<TablesInsert<"notifications">, "id" | "created_at" | "updated_at">;

/**
 * DTO for marking notification as read (PUT /api/notifications/:notificationId/read)
 */
export type MarkNotificationReadDTO = Pick<TablesUpdate<"notifications">, "is_read">;

/**
 * Full notification data as returned by API
 */
export type NotificationDTO = Tables<"notifications">;

/**
 * Response for notifications list endpoint (GET /api/notifications)
 */
export type NotificationListResponse = PaginatedResponse<NotificationDTO>;

/**
 * Query parameters for notifications list endpoint
 */
export interface NotificationQueryParams extends ListQueryParams {
  is_read?: boolean;
}

// ============================================================================
// USER MANAGEMENT - DTO & COMMAND MODELS
// ============================================================================

/**
 * User data structure (from Supabase Auth)
 * Represents minimal user info returned by API
 */
export interface UserDTO {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response for users list endpoint (GET /api/users)
 * Admin-only endpoint
 */
export type UserListResponse = PaginatedResponse<UserDTO>;

/**
 * User authentication DTO for login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * User registration DTO
 */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string; // For client-side validation only
}

/**
 * Update user profile DTO
 */
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
}

/**
 * Response after successful authentication
 */
export interface AuthResponseDTO {
  user: UserDTO;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

/**
 * Standard auth API responses
 */
export interface LoginResponse extends ApiResponse {
  data?: AuthResponseDTO;
}

export interface RegisterResponse extends ApiResponse {
  data?: AuthResponseDTO;
}

export interface LogoutResponse extends ApiResponse {
  message: string;
}

export interface UserProfileResponse extends ApiResponse {
  data?: UserDTO;
}

export interface UpdateUserResponse extends ApiResponse {
  data?: UserDTO;
}

// ============================================================================
// VALIDATION & ERROR TYPES
// ============================================================================

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: ValidationError[];
  statusCode: number;
}

// ============================================================================
// BUSINESS LOGIC TYPES
// ============================================================================

/**
 * Investment status constants
 */
export const INVESTMENT_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

/**
 * Investment status enumeration
 * Defines possible states of an investment
 * Automatically derived from INVESTMENT_STATUSES constants
 */
export type InvestmentStatus = (typeof INVESTMENT_STATUSES)[keyof typeof INVESTMENT_STATUSES];

/**
 * Offer status constants
 */
export const OFFER_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  CLOSED: "closed",
} as const;

/**
 * Offer status enumeration
 * Defines possible states of an offer
 * Automatically derived from OFFER_STATUSES constants
 */
export type OfferStatus = (typeof OFFER_STATUSES)[keyof typeof OFFER_STATUSES];

/**
 * User role constants
 */
export const USER_ROLES = {
  ADMIN: "admin",
  SIGNER: "signer",
} as const;

/**
 * User role enumeration for authorization
 * Automatically derived from USER_ROLES constants
 */
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Extended investment data with offer details
 * Used for detailed investment views
 */
export interface InvestmentWithOfferDTO extends InvestmentDTO {
  offer: OfferDTO;
}

/**
 * Extended investment data with simplified offer details
 * Used for investment list views (e.g., "My Investments")
 */
export interface InvestmentWithOfferNameDTO extends InvestmentDTO {
  offers: {
    name: string;
  } | null;
}

/**
 * Extended investment data with offer and user details
 * Used for admin investment list views
 */
export interface InvestmentWithRelationsDTO extends InvestmentDTO {
  offers: {
    name: string;
  } | null;
  users_view: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
  } | null;
}

/**
 * Extended investment data with full offer and user details
 * Used for GET /api/investments/:investmentId endpoint
 * Returns complete investment information including related offer and user data
 */
export interface InvestmentDetailsDTO extends InvestmentDTO {
  offer: OfferDTO;
  user: UserDTO;
}

/**
 * Response for admin investments list endpoint (GET /api/investments/admin)
 * Includes offer and user data for each investment
 */
export type AdminInvestmentListResponse = PaginatedResponse<InvestmentWithRelationsDTO>;

/**
 * Investment summary for dashboard views
 */
export interface InvestmentSummaryDTO {
  total_investments: number;
  total_amount: number;
  pending_investments: number;
  completed_investments: number;
}

/**
 * Simplified view model for offer card display
 * Contains formatted data for UI presentation
 */
export interface OfferViewModel {
  id: string;
  name: string;
  target_amount: string;
  min_investment: string;
  main_image_url?: string;
}

/**
 * View model for offer details page
 * Contains formatted data ready for display in components
 */
export interface OfferDetailsViewModel {
  id: string;
  name: string;
  status: OfferStatus;
  description: string;
  images: string[];
  // Formatted financial values (converted from cents)
  target_amount: string; // e.g., "500 000,00 zł"
  minimum_investment: string; // e.g., "1 000,00 zł"
  // Raw numeric values for form validation and business logic
  minimum_investment_raw: number; // Raw value in PLN (already converted from cents by backend)
}

/**
 * View model for investment display in "My Investments" view
 * Contains formatted data ready for display in components
 */
export interface InvestmentViewModel {
  id: string;
  offerName: string;
  amount: string;
  status: InvestmentStatus;
  submissionDate: string;
}
