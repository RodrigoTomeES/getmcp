import { StarIcon, DownloadIcon, ForkIcon, IssueIcon, DockerIcon } from "./icons";

type IconType = "star" | "download" | "fork" | "issue" | "docker";

const iconComponents: Record<IconType, React.ComponentType<{ className?: string }>> = {
  star: StarIcon,
  download: DownloadIcon,
  fork: ForkIcon,
  issue: IssueIcon,
  docker: DockerIcon,
};

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
  const Icon = iconComponents[icon];

  return (
    <span
      className="text-xs px-2.5 py-1 rounded-full bg-surface-hover text-text-secondary inline-flex items-center gap-1.5"
      aria-label={`${value}${label ?? ""} ${iconLabels[icon]}`}
    >
      <Icon />
      {value}
      {label && <span className="text-text-secondary/60">{label}</span>}
    </span>
  );
}
