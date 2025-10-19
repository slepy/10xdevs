import React from "react";
import type { UserDTO, UserRole } from "../../types";
import { USER_ROLES } from "../../types";

interface ProtectedContentProps {
  user?: UserDTO | null;
  requireRole?: UserRole;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ProtectedContent({ user, requireRole, fallback, children }: ProtectedContentProps) {
  // Check if user is authenticated
  if (!user) {
    return (
      fallback || (
        <div className="text-center py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Wymagane logowanie</h3>
            <p className="text-sm text-yellow-700 mb-4">Aby wyświetlić tę zawartość, musisz się zalogować.</p>
            <a
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Zaloguj się
            </a>
          </div>
        </div>
      )
    );
  }

  // Check if specific role is required
  if (requireRole && user.role !== requireRole) {
    return (
      fallback || (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Brak uprawnień</h3>
            <p className="text-sm text-red-700 mb-4">
              Nie masz wystarczających uprawnień, aby wyświetlić tę zawartość.
              {requireRole === USER_ROLES.ADMIN && " Wymagane są uprawnienia administratora."}
            </p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Powrót do strony głównej
            </a>
          </div>
        </div>
      )
    );
  }

  // User is authenticated and has required role - show content
  return <>{children}</>;
}
