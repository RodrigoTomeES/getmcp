export function TeamFeatures() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold mb-2">Built for teams. Ready for enterprise.</h2>
      <p className="text-text-secondary mb-8 max-w-2xl">
        Share server configurations across your team. Connect private registries. Keep everyone in
        sync.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 — Project Manifests */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="font-bold text-text mb-2">Declare once, sync everywhere</h3>
          <p className="text-sm text-text-secondary">
            Commit a <code className="text-accent">getmcp.json</code> to your repo. Your team runs{" "}
            <code className="text-accent">getmcp sync</code> and every app is configured instantly.
          </p>
          <pre className="bg-code-bg rounded-md p-3 font-mono text-xs text-text-secondary mt-3 overflow-x-auto">
            {`{
  "servers": {
    "github": {},
    "slack": {
      "env": {
        "SLACK_TOKEN": ""
      }
    }
  }
}`}
          </pre>
        </div>

        {/* Card 2 — Private Registries */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="font-bold text-text mb-2">Your servers, your registry</h3>
          <p className="text-sm text-text-secondary">
            Connect the official registry, your company&apos;s private registry, or both. Bearer,
            basic, and custom header auth built in.
          </p>
          <pre className="bg-code-bg rounded-md p-3 font-mono text-xs text-text-secondary mt-3 overflow-x-auto">
            {`$ getmcp registry add \\
    https://mcp.company.com`}
          </pre>
        </div>

        {/* Card 3 — Lock File */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="font-bold text-text mb-2">Lock file for consistency</h3>
          <p className="text-sm text-text-secondary">
            <code className="text-accent">getmcp-lock.json</code> tracks what&apos;s installed,
            where, and when. Commit it to version control — no more &ldquo;works on my
            machine&rdquo;.
          </p>
          <pre className="bg-code-bg rounded-md p-3 font-mono text-xs text-text-secondary mt-3 overflow-x-auto">
            {`getmcp-lock.json
├── servers: { github, slack }
├── installedAt: per-app paths
└── lastSync: 2026-03-04`}
          </pre>
        </div>
      </div>
    </section>
  );
}
