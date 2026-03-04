import { Terminal } from "lucide-react";

const SMART_FEATURES = [
  "Auto-detects installed AI apps on your system",
  "Never overwrites existing configs — merge only",
  "Detects config format automatically (JSON/JSONC/YAML/TOML)",
  "Tracks global vs project scope per app",
  "Incremental registry sync — only fetches changes",
];

export function DeveloperExperience() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold mb-8">Made for developers who hate friction</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Smart Automation */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="font-bold text-text mb-4">Smart Automation</h3>
          <ul className="space-y-3">
            {SMART_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" aria-hidden="true" />
                <span className="text-sm text-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Power Flags */}
        <div className="rounded-lg border border-border bg-code-bg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <Terminal className="w-4 h-4 text-text-secondary shrink-0" aria-hidden="true" />
            <span className="text-xs font-mono text-text-secondary select-none">power flags</span>
          </div>
          <pre className="px-4 py-3 font-mono text-sm leading-loose overflow-x-auto">
            <code>
              <span className="text-accent">$</span>{" "}
              <span className="text-text">getmcp add github --dry-run</span>
              {"    "}
              <span className="text-text-secondary"># Preview changes</span>
              {"\n"}
              <span className="text-accent">$</span>{" "}
              <span className="text-text">getmcp ls --json</span>
              {"               "}
              <span className="text-text-secondary"># Machine-readable</span>
              {"\n"}
              <span className="text-accent">$</span>{" "}
              <span className="text-text">getmcp rm slack --yes</span>
              {"          "}
              <span className="text-text-secondary"># Skip prompts</span>
              {"\n"}
              <span className="text-accent">$</span> <span className="text-text">getmcp dr</span>
              {"                      "}
              <span className="text-text-secondary"># Alias for doctor</span>
              {"\n"}
              <span className="text-accent">$</span>{" "}
              <span className="text-text">getmcp add pg --app=cursor</span>
              {"     "}
              <span className="text-text-secondary"># Target one app</span>
            </code>
          </pre>
        </div>
      </div>

      <p className="text-sm text-text-secondary text-center mt-6">
        Also available as a library:{" "}
        <code className="text-accent">import {"{ detectApps }"} from &quot;@getmcp/cli&quot;</code>
      </p>
    </section>
  );
}
