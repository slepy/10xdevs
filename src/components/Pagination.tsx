import type { PaginationMeta } from "../types";

export interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages = 1 } = pagination;

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handlePageClick = (pageNumber: number) => {
    onPageChange(pageNumber);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // Number of page buttons to show

    if (totalPages <= showPages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(totalPages - 1, page + 1);

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push("...");
      }

      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center gap-2" aria-label="Nawigacja paginacji">
      {/* Previous button */}
      <button
        onClick={handlePrevious}
        disabled={page === 1}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
        aria-label="Poprzednia strona"
      >
        Poprzednia
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === "...") {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                ...
              </span>
            );
          }

          const isCurrentPage = pageNum === page;

          return (
            <button
              key={pageNum}
              onClick={() => handlePageClick(pageNum as number)}
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                isCurrentPage
                  ? "text-white bg-blue-600 hover:bg-blue-700"
                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              }`}
              aria-label={`Strona ${pageNum}`}
              aria-current={isCurrentPage ? "page" : undefined}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={page === totalPages}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
        aria-label="Następna strona"
      >
        Następna
      </button>
    </nav>
  );
}
