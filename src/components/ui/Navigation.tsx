import React, { useState, useEffect } from "react";
import { AuthButton } from "./AuthButton";
import { BaseButton } from "../base";
import type { UserDTO } from "../../types";
import { USER_ROLES } from "../../types";

interface NavigationProps {
  user?: UserDTO | null;
  currentPath?: string;
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
}

export function Navigation({ user, currentPath, className = "" }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Generate navigation items based on user status
  const getNavItems = (): NavItem[] => {
    // Navigation items available to all users
    const publicNavItems: NavItem[] = [
      { name: "Strona główna", href: "/" },
      { name: "O nas", href: "/about" },
    ];

    // Navigation items for authenticated users
    const authenticatedNavItems: NavItem[] = [
      { name: "Oferty", href: "/offers" },
      { name: "Inwestycje", href: "/investments" },
    ];

    // Admin-only navigation items
    const adminNavItems: NavItem[] = [{ name: "Panel admin", href: "/admin" }];

    // Return navigation items based on user status
    if (user) {
      // For authenticated users, show only authenticated navigation
      let navItems = authenticatedNavItems;
      if (user.role === USER_ROLES.ADMIN) {
        navItems = [...navItems, ...adminNavItems];
      }
      return navItems;
    }

    // For non-authenticated users, show only public navigation
    return publicNavItems;
  };

  // Check if current path matches navigation item
  const isActive = (href: string): boolean => {
    if (href === "/" && currentPath === "/") return true;
    if (href !== "/" && currentPath?.startsWith(href)) return true;
    return false;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking on nav links
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = getNavItems();

  return (
    <nav className={`bg-white shadow-sm border-b ${className}`} data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2" data-testid="logo-link">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">BlindInvest</span>
            </a>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* Auth button */}
          <div className="flex items-center" data-testid="auth-button-container">
            <AuthButton user={user} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <BaseButton
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label="Otwórz menu"
              className="text-gray-400 hover:text-gray-500"
              data-testid="mobile-menu-button"
            >
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </BaseButton>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" data-testid="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
