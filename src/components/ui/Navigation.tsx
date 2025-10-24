import { useState, useEffect } from "react";
import UserMenu from "../UserMenu";
import type { UserDTO } from "../../types";
import { USER_ROLES } from "../../types";

interface NavigationProps {
  user?: UserDTO | null;
  currentPath?: string;
  variant?: "public" | "authenticated" | "admin";
}

interface NavItem {
  name: string;
  href: string;
  testId: string;
  requiredRole?: typeof USER_ROLES.ADMIN | typeof USER_ROLES.SIGNER;
}

export function Navigation({ user, currentPath = "", variant }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-detect variant based on user if not explicitly provided
  const detectedVariant = variant || (user ? (user.role === USER_ROLES.ADMIN ? "admin" : "authenticated") : "public");

  // Generate navigation items based on variant and user role
  const getNavItems = (): NavItem[] => {
    const allNavItems: NavItem[] = [
      { name: "Strona główna", href: "/", testId: "nav-home" },
      { name: "O nas", href: "/about", testId: "nav-about" },
      { name: "Oferty", href: "/offers", testId: "nav-offers" },
      {
        name: "Moje Inwestycje",
        href: "/investments",
        testId: "nav-investments",
        requiredRole: USER_ROLES.SIGNER,
      },
      { name: "Panel Admin", href: "/admin", testId: "nav-admin", requiredRole: USER_ROLES.ADMIN },
    ];

    // Filter based on variant
    if (detectedVariant === "public") {
      return allNavItems.filter((item) => ["/", "/about"].includes(item.href));
    }

    if (detectedVariant === "authenticated" || detectedVariant === "admin") {
      // Show authenticated items (offers, investments for signers, admin panel for admins)
      return allNavItems.filter((item) => {
        // Exclude public-only items
        if (["/", "/about"].includes(item.href)) return false;

        // Check role requirements
        if (item.requiredRole) {
          return user?.role === item.requiredRole;
        }

        return true;
      });
    }

    return [];
  };

  // Check if current path matches navigation item
  const isActive = (href: string): boolean => {
    if (href === "/") {
      return currentPath === "/" || currentPath === "";
    }
    if (href === "/admin") {
      return currentPath === href || currentPath.startsWith("/admin");
    }
    return currentPath.startsWith(href);
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

  // Determine navigation styles based on variant
  const isAdminVariant = detectedVariant === "admin";
  const bgColor = isAdminVariant ? "bg-gray-900" : "bg-white";
  const textColor = isAdminVariant ? "text-white" : "text-gray-900";
  const borderColor = isAdminVariant ? "border-gray-800" : "border-gray-200";
  const logoHref = user ? (user.role === USER_ROLES.ADMIN ? "/admin" : "/offers") : "/";

  // Determine link styles
  const getLinkClasses = (href: string) => {
    const baseClasses = "px-4 py-2 rounded-lg text-sm font-medium transition-colors";
    if (isActive(href)) {
      return isAdminVariant
        ? `${baseClasses} bg-gray-800 text-white`
        : `${baseClasses} bg-blue-50 text-blue-600`;
    }
    return isAdminVariant
      ? `${baseClasses} text-gray-300 hover:bg-gray-800 hover:text-white`
      : `${baseClasses} text-gray-700 hover:bg-gray-50 hover:text-gray-900`;
  };

  const testId =
    detectedVariant === "admin"
      ? "admin-navigation"
      : detectedVariant === "authenticated"
        ? "authenticated-navigation"
        : "public-navigation";

  return (
    <nav className={`${bgColor} shadow-sm border-b ${borderColor}`} data-testid={testId}>
      <div className={isAdminVariant ? "px-6" : "container mx-auto px-4"}>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <a href={logoHref} className="flex items-center space-x-2" data-testid="logo">
              <span
                className={`text-xl font-bold ${isAdminVariant ? "text-white" : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"}`}
              >
                BlindInvest
              </span>
              {isAdminVariant && (
                <span className="px-2 py-1 bg-purple-600 text-xs font-semibold rounded text-white">ADMIN</span>
              )}
            </a>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className={getLinkClasses(item.href)} data-testid={item.testId}>
                {item.name}
              </a>
            ))}
          </div>

          {/* Right section - User Menu or Auth buttons */}
          <div className="flex items-center">
            {user ? (
              <UserMenu user={user} isDark={isAdminVariant} />
            ) : (
              <div className="flex items-center space-x-4">
                <a
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                  data-testid="nav-login"
                >
                  Zaloguj się
                </a>
                <a
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  data-testid="nav-register"
                >
                  Zarejestruj się
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className={`md:hidden p-2 rounded-md ${isAdminVariant ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            data-testid="mobile-menu-button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" data-testid="mobile-menu">
          <div className={`px-2 pt-2 pb-3 space-y-1 ${bgColor} border-t ${borderColor}`}>
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={getLinkClasses(item.href)}
                data-testid={item.testId}
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
