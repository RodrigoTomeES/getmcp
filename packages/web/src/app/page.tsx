import { getAllServers, getCategories, getServerCount } from "@mcp-hub/registry";
import { SearchBar } from "@/components/SearchBar";

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
          <span className="text-[var(--color-text)]">10 applications</span>.
        </p>
      </div>

      {/* Install hint */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-8 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Install any server with the CLI:{" "}
          <code className="text-[var(--color-accent)] bg-[var(--color-code-bg)] px-2 py-0.5 rounded">
            npx @mcp-hub/cli add &lt;server-id&gt;
          </code>
        </p>
      </div>

      {/* Search + server listing */}
      <SearchBar servers={servers} categories={categories} />
    </div>
  );
}
