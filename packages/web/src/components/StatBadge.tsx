const icons = {
  star: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  ),
  download: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z" />
    </svg>
  ),
  fork: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
    </svg>
  ),
  issue: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
    </svg>
  ),
  docker: (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 5h2V3H3v2Zm3 0h2V3H6v2Zm3 0h2V3H9v2ZM3 8h2V6H3v2Zm3 0h2V6H6v2Zm3 0h2V6H9v2Zm3-2h2V4h-2v2ZM6 11h2V9H6v2Z" />
      <path d="M15.2 6.4c-.3-.2-.9-.3-1.4-.2-.1-.7-.5-1.3-1.1-1.8l-.3-.2-.2.3c-.3.4-.4.9-.3 1.3.1.4.2.7.5 1-.3.1-.5.2-.8.3-.4.1-.8.2-1.2.2H.3l-.1.5c-.1.8 0 1.6.3 2.4.3.6.8 1.2 1.4 1.5.7.4 1.9.6 3.2.6.6 0 1.2-.1 1.8-.2.8-.2 1.6-.5 2.2-1 .5-.4 1-.9 1.4-1.5.6.3 1.3.3 1.9.1.3-.1.5-.3.7-.5l.2-.3-.1-.2Z" />
    </svg>
  ),
};

type IconType = keyof typeof icons;

const iconLabels: Record<IconType, string> = {
  star: "stars",
  download: "downloads",
  fork: "forks",
  issue: "open issues",
  docker: "Docker pulls",
};

export function StatBadge({
  icon,
  value,
  label,
}: {
  icon: IconType;
  value: string;
  label?: string;
}) {
  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full bg-surface-hover text-text-secondary inline-flex items-center gap-1.5"
      aria-label={`${value}${label ?? ""} ${iconLabels[icon]}`}
    >
      {icons[icon]}
      {value}
      {label && <span className="text-text-secondary/60">{label}</span>}
    </span>
  );
}
