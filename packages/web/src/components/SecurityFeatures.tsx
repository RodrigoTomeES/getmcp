const FEATURES = [
  "Masked prompts for secrets",
  "HTTPS enforcement for registries",
  "Merge-only config writes",
  "Credential management with env overrides",
  "Atomic file operations",
  "Prototype pollution prevention",
];

export function SecurityFeatures() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold mb-2">Security by default</h2>
      <p className="text-text-secondary mb-8 max-w-2xl">
        Your secrets stay secret. Your configs stay safe.
      </p>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" aria-hidden="true" />
              <span className="text-sm text-text-secondary">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
