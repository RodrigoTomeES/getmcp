/**
 * Pagination helpers shared by the `/servers` SearchBar island (client-side
 * pages) and the category pages (static pages built with `paginate()`).
 */

/** Servers per static category page; also one of the `/servers` page sizes. */
export const CATEGORY_PAGE_SIZE = 48;

/**
 * Page numbers to show in the pagination bar: every page when there are 7 or
 * fewer, otherwise the first, the last and the current page with its
 * neighbours, with "ellipsis" for the skipped ranges.
 */
export function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
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

/** URL of page `n` of a category: page 1 is `/category/<slug>`, the rest `/category/<slug>/<n>`. */
export function categoryPageUrl(slug: string, n: number): string {
  return n <= 1 ? `/category/${slug}` : `/category/${slug}/${n}`;
}
