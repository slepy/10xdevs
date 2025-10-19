import React, { useState, useRef, useEffect } from "react";
import { BaseButton } from "../base";
import type { UserDTO } from "../../types";

interface AuthButtonProps {
  user?: UserDTO | null;
  className?: string;
}

export function AuthButton({ user, className = "" }: AuthButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsDropdownOpen(false);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Clear client-side tokens
        localStorage.removeItem("supabase-token");

        // Clear cookies
        document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        // Redirect to home page
        window.location.href = "/";
      } else {
        // Logout failed but we'll still redirect
        // Still redirect even if logout API fails
        window.location.href = "/";
      }
    } catch {
      // Logout error but we'll still redirect
      // Still redirect even if there's an error
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0]?.toUpperCase() || "";
    const last = lastName?.[0]?.toUpperCase() || "";
    return first + last || user?.email?.[0]?.toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || "";
  };

  // If user is not logged in, show login button
  if (!user) {
    return (
      <div className={className}>
        <BaseButton href="/login">Zaloguj się</BaseButton>
      </div>
    );
  }

  // If user is logged in, show user menu
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <BaseButton
        variant="ghost"
        size="sm"
        onClick={toggleDropdown}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        className="!flex !flex-row !items-center !gap-2"
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
          {getInitials(user.firstName, user.lastName)}
        </div>
        <span className="hidden sm:inline-block text-sm font-medium text-gray-700 max-w-32 truncate whitespace-nowrap">
          {getDisplayName()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </BaseButton>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName()}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            <a
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
              role="menuitem"
            >
              Mój profil
            </a>

            <div className="border-t border-gray-100">
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left text-red-600 hover:bg-red-50 focus:bg-red-50"
                role="menuitem"
              >
                {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
              </BaseButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
