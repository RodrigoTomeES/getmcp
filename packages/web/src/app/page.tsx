import { getAllServers, getCategories, getServerCount } from "@getmcp/registry";
import { getAppIds } from "@getmcp/generators";
import { SearchBar } from "@/components/SearchBar";
import { AnimatedCommand } from "@/components/AnimatedCommand";
import { AsciiArt } from "@/components/AsciiArt";

export default function HomePage() {
  const servers = getAllServers();
  const categories = getCategories();
  const count = getServerCount();
  const appCount = getAppIds().length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
      {/* Hero section — two-column layout inspired by skills.sh */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 lg:gap-14 mb-12 pt-4 md:pt-10 relative">
        {/* Subtle radial glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 max-w-4/5 w-200 h-125 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Left column: ASCII brand + tagline */}
        <AsciiArt />

        {/* Right column: description + animated CLI */}
        <div className="relative flex flex-col justify-center text-center lg:text-left">
          <p className="text-text-secondary text-xl sm:text-2xl lg:text-3xl leading-tight tracking-tight text-balance mb-8">
            Browse <span className="text-text">{count} MCP servers</span> and install them into{" "}
            <span className="text-text">{appCount} AI applications</span> with a single command.
          </p>

          <div>
            <p className="font-mono text-sm font-medium uppercase text-text mb-3">Try it now</p>
            <AnimatedCommand />
          </div>
        </div>
      </div>

      {/* Search + server listing */}
      <SearchBar servers={servers} categories={categories} />
    </div>
  );
}
