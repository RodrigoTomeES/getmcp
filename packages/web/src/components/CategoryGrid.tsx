import Link from "next/link";
import { getServersByCategory } from "@getmcp/registry";
import { CATEGORY_NAMES, CATEGORY_DESCRIPTIONS } from "@/lib/categories";

export function CategoryGrid() {
  const slugs = Object.keys(CATEGORY_NAMES);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Browse by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {slugs.map((slug) => {
          const name = CATEGORY_NAMES[slug];
          const desc = CATEGORY_DESCRIPTIONS[slug] ?? "";
          const count = getServersByCategory(slug).length;

          return (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className="group flex flex-col rounded-lg border border-border bg-surface p-4 hover:bg-surface-hover hover:border-accent/50 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <h3 className="font-medium text-sm group-hover:text-accent transition-colors truncate">
                  {name}
                </h3>
                <span className="text-xs text-text-secondary shrink-0">{count}</span>
              </div>
              <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
