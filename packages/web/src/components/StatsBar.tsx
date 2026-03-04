interface StatsBarProps {
  serverCount: number;
  appCount: number;
}

export function StatsBar({ serverCount, appCount }: StatsBarProps) {
  const stats = [
    { value: String(appCount), label: "AI Apps" },
    { value: `${serverCount}+`, label: "Servers" },
    { value: "10", label: "Commands" },
    { value: "4", label: "Config Formats" },
  ];

  return (
    <div className="flex items-center justify-center gap-6 md:gap-8 py-6 flex-wrap">
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-6 md:gap-8">
          {i > 0 && <span className="hidden md:block w-px h-8 bg-border" aria-hidden="true" />}
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{stat.value}</p>
            <p className="text-xs text-text-secondary uppercase tracking-wider">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
