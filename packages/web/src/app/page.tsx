import { getAllServers, getCategories, getServerCount } from "@getmcp/registry";
import { SearchBar } from "@/components/SearchBar";
import { PackageManagerCommand } from "@/components/PackageManagerCommand";

export default function HomePage() {
  const servers = getAllServers();
  const categories = getCategories();
  const count = getServerCount();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hero section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3 tracking-tight">
          MCP Server Directory
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Browse {count} MCP servers and get the exact configuration for your AI
          app. One canonical format, generated for{" "}
          <span className="text-[var(--color-text)]">12 applications</span>.
        </p>
      </div>

      {/* Install hint */}
      <div className="max-w-xl mx-auto">
        <PackageManagerCommand />
      </div>

      {/* Search + server listing */}
      <SearchBar servers={servers} categories={categories} />
    </div>
  );
}
