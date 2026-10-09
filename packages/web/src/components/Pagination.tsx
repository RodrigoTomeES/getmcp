import { getPageNumbers } from "@/lib/pagination";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Client-side navigation (the /servers island): renders buttons. */
  onPageChange?: (page: number) => void;
  /**
   * Link navigation (static pages rendered without a client directive):
   * renders `<a href>` links and ships no JS.
   */
  hrefFor?: (page: number) => string;
};

const PILL = "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors";
const PILL_IDLE = "border-border text-text-secondary hover:border-text-secondary hover:text-text";
const PILL_CURRENT = "border-accent bg-accent/10 text-accent";
const PILL_DISABLED = "border-border text-text-secondary opacity-40 cursor-not-allowed";

export function Pagination({ page, totalPages, onPageChange, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  function stepControl(target: number, disabled: boolean, label: string, text: string) {
    if (hrefFor) {
      return disabled ? (
        // A link without href: role="link" keeps aria-label and aria-disabled valid.
        <a
          role="link"
          aria-disabled="true"
          aria-label={label}
          className={`${PILL} ${PILL_DISABLED}`}
        >
          {text}
        </a>
      ) : (
        <a href={hrefFor(target)} aria-label={label} className={`${PILL} ${PILL_IDLE}`}>
          {text}
        </a>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          if (!disabled) onPageChange?.(target);
        }}
        aria-disabled={disabled}
        aria-label={label}
        className={`${PILL} ${disabled ? PILL_DISABLED : PILL_IDLE}`}
      >
        {text}
      </button>
    );
  }

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center gap-1.5 mt-8">
      {stepControl(page - 1, isPrevDisabled, "Previous page", "Prev")}

      {pages.map((p, i) => {
        if (p === "ellipsis") {
          return (
            <span
              key={`ellipsis-${i < pages.length / 2 ? "start" : "end"}`}
              className="text-xs px-1.5 text-text-secondary select-none"
            >
              <span aria-hidden="true">&hellip;</span>
              <span className="sr-only">Pages skipped</span>
            </span>
          );
        }
        const className = `${PILL} ${p === page ? PILL_CURRENT : PILL_IDLE}`;
        const ariaCurrent = p === page ? "page" : undefined;
        return hrefFor ? (
          <a
            key={p}
            href={hrefFor(p)}
            aria-current={ariaCurrent}
            aria-label={`Page ${p}`}
            className={className}
          >
            {p}
          </a>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange?.(p)}
            aria-current={ariaCurrent}
            aria-label={`Page ${p}`}
            className={className}
          >
            {p}
          </button>
        );
      })}

      {stepControl(page + 1, isNextDisabled, "Next page", "Next")}
    </nav>
  );
}
