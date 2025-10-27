import { supabaseAdminClient } from "../../db/supabase.client";
import { USER_ROLES, type UserDTO, type UserListResponse, type ListQueryParams, type UserRole } from "../../types";
import type { User } from "@supabase/supabase-js";

/**
 * Service for managing users (admin operations).
 */
export class UsersService {
  /**
   * Maps a Supabase user object to our UserDTO format.
   * @param user The user object from Supabase.
   * @returns A UserDTO object.
   */
  private mapUserToDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email || "",
      firstName: (user.user_metadata?.firstName as string) || (user.user_metadata?.first_name as string) || "",
      lastName: (user.user_metadata?.lastName as string) || (user.user_metadata?.last_name as string) || "",
      role: ((user.user_metadata?.role as string) ||
        (user.app_metadata?.role as string) ||
        USER_ROLES.SIGNER) as UserRole,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Retrieves a paginated list of all users (admin only).
   * @param params Query parameters (page, limit, sort, filter).
   * @returns A list of users with pagination metadata.
   */
  async listUsers(params: ListQueryParams): Promise<UserListResponse> {
    const { page = 1, limit = 100, filter, sort } = params;

    try {
      const { data, error } = await supabaseAdminClient.auth.admin.listUsers({
        page,
        perPage: limit,
      });

      if (error) {
        throw new Error(`Error fetching users: ${error.message}`);
      }

      let users = data.users.map(this.mapUserToDTO);

      // Apply filtering
      if (filter) {
        const lowercasedFilter = filter.toLowerCase();
        users = users.filter(
          (user) =>
            user.email.toLowerCase().includes(lowercasedFilter) ||
            user.firstName.toLowerCase().includes(lowercasedFilter) ||
            user.lastName.toLowerCase().includes(lowercasedFilter) ||
            user.role.toLowerCase().includes(lowercasedFilter)
        );
      }

      // Apply sorting
      if (sort) {
        const [field, order] = sort.split(":") as [keyof UserDTO, "asc" | "desc"];
        const sortOrder = order === "desc" ? -1 : 1;

        users.sort((a, b) => {
          const valA = a[field] || "";
          const valB = b[field] || "";
          if (valA < valB) return -1 * sortOrder;
          if (valA > valB) return 1 * sortOrder;
          return 0;
        });
      }

      const total = users.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      // eslint-disable-next-line no-console
      console.error(`[UsersService] listUsers failed: ${errorMessage}`);
      throw new Error(`Failed to retrieve users: ${errorMessage}`);
    }
  }

  /**
   * Checks if a user has the admin role.
   * @param userId The ID of the user to check.
   * @returns true if the user is an admin, false otherwise.
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const {
        data: { user },
        error,
      } = await supabaseAdminClient.auth.admin.getUserById(userId);

      if (error || !user) {
        return false;
      }

      const role = user.user_metadata?.role || user.app_metadata?.role;
      return role === USER_ROLES.ADMIN;
    } catch {
      return false;
    }
  }
}
