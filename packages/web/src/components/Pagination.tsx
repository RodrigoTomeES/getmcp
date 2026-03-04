type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (page > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (page < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center gap-1.5 mt-8">
      <button
        type="button"
        onClick={() => {
          if (!isPrevDisabled) onPageChange(page - 1);
        }}
        aria-disabled={isPrevDisabled}
        aria-label="Previous page"
        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
          isPrevDisabled
            ? "border-border text-text-secondary opacity-40 cursor-not-allowed"
            : "border-border text-text-secondary hover:border-text-secondary hover:text-text"
        }`}
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i < pages.length / 2 ? "start" : "end"}`}
            className="text-xs px-1.5 text-text-secondary select-none"
          >
            <span aria-hidden="true">&hellip;</span>
            <span className="sr-only">Pages skipped</span>
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              p === page
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-secondary hover:border-text-secondary hover:text-text"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => {
          if (!isNextDisabled) onPageChange(page + 1);
        }}
        aria-disabled={isNextDisabled}
        aria-label="Next page"
        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
          isNextDisabled
            ? "border-border text-text-secondary opacity-40 cursor-not-allowed"
            : "border-border text-text-secondary hover:border-text-secondary hover:text-text"
        }`}
      >
        Next
      </button>
    </nav>
  );
}
