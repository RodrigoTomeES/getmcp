import type { InternalRegistryEntry } from "@getmcp/registry";
import { getServerMetrics } from "@getmcp/registry";
import { compactNumber, relativeTime } from "@/lib/format";
import {
  StarIcon,
  DownloadIcon,
  ForkIcon,
  IssueIcon,
  DockerIcon,
  GitHubIcon,
  ExternalLinkIcon,
} from "./icons";

type Metrics = NonNullable<ReturnType<typeof getServerMetrics>>;

function SidebarStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-sm font-semibold flex items-center gap-1.5">
        <span className="text-text-secondary">{icon}</span>
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-text-secondary shrink-0">{label}</span>
      <span className="text-sm text-text truncate text-right">{children}</span>
    </div>
  );
}

const StarIconEl = <StarIcon className="w-4 h-4" />;
const ForkIconEl = <ForkIcon className="w-4 h-4" />;
const DownloadIconEl = <DownloadIcon className="w-4 h-4" />;
const IssueIconEl = <IssueIcon className="w-4 h-4" />;
const DockerIconEl = <DockerIcon className="w-4 h-4" />;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function ServerSidebar({
  server,
  metrics,
}: {
  server: InternalRegistryEntry;
  metrics?: Metrics;
}) {
  const downloads = metrics?.npm?.weeklyDownloads ?? metrics?.pypi?.monthlyDownloads;
  const downloadLabel = metrics?.npm?.weeklyDownloads
    ? "/week"
    : metrics?.pypi?.monthlyDownloads
      ? "/month"
      : "";
  const version = metrics?.npm?.latestVersion ?? metrics?.pypi?.latestVersion;
  const isRemote = "url" in server.config;

  const hasStats =
    (metrics?.github?.stars ?? 0) > 0 ||
    (metrics?.github?.forks ?? 0) > 0 ||
    (downloads ?? 0) > 0 ||
    (metrics?.github?.openIssues ?? 0) > 0 ||
    (metrics?.docker?.pulls ?? 0) > 0;

  const details: Array<{ label: string; value: string; mono?: boolean }> = [];
  if (server.author) details.push({ label: "Author", value: server.author });
  if (version) details.push({ label: "Version", value: version, mono: true });
  if (server.license) details.push({ label: "License", value: server.license });
  if (server.runtime) details.push({ label: "Runtime", value: server.runtime });
  if (server.language) details.push({ label: "Language", value: server.language });
  if (server.package) details.push({ label: "Package", value: server.package, mono: true });
  details.push({ label: "Transport", value: isRemote ? "Remote" : "Stdio" });
  if (metrics?.github?.lastPush) {
    details.push({ label: "Updated", value: relativeTime(metrics.github.lastPush) });
  }

  const hasLinks = server.repository || server.homepage;
  const maxTags = 10;
  const tags = server.tags ?? [];
  const visibleTags = tags.slice(0, maxTags);
  const hiddenCount = tags.length - maxTags;

  const hasSections = hasStats || details.length > 0 || hasLinks || visibleTags.length > 0;
  if (!hasSections) return null;

  return (
    <div
      className="rounded-lg border border-border bg-surface divide-y divide-border"
      aria-label="Server metadata"
    >
      {/* Stats grid */}
      {hasStats && (
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            {metrics?.github?.stars != null && metrics.github.stars > 0 && (
              <SidebarStat
                icon={StarIconEl}
                label="Stars"
                value={compactNumber(metrics.github.stars)}
              />
            )}
            {metrics?.github?.forks != null && metrics.github.forks > 0 && (
              <SidebarStat
                icon={ForkIconEl}
                label="Forks"
                value={compactNumber(metrics.github.forks)}
              />
            )}
            {downloads != null && downloads > 0 && (
              <SidebarStat
                icon={DownloadIconEl}
                label={`Downloads${downloadLabel}`}
                value={compactNumber(downloads)}
              />
            )}
            {metrics?.github?.openIssues != null && metrics.github.openIssues > 0 && (
              <SidebarStat
                icon={IssueIconEl}
                label="Open Issues"
                value={compactNumber(metrics.github.openIssues)}
              />
            )}
            {metrics?.docker?.pulls != null && metrics.docker.pulls > 0 && (
              <SidebarStat
                icon={DockerIconEl}
                label="Docker Pulls"
                value={compactNumber(metrics.docker.pulls)}
              />
            )}
          </div>
        </div>
      )}

      {/* Details */}
      {details.length > 0 && (
        <div className="p-5 space-y-3">
          {details.map((d) => (
            <DetailRow key={d.label} label={d.label}>
              <span className={d.mono ? "font-mono" : ""} title={d.value}>
                {d.value}
              </span>
            </DetailRow>
          ))}
        </div>
      )}

      {/* Links */}
      {hasLinks && (
        <div className="p-5 space-y-2">
          {server.repository && (
            <a
              href={server.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent hover:underline transition-colors"
            >
              <GitHubIcon className="w-4 h-4" />
              <span className="truncate">{extractDomain(server.repository)}</span>
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          )}
          {server.homepage && server.homepage !== server.repository && (
            <a
              href={server.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent hover:underline transition-colors"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              <span className="truncate">{extractDomain(server.homepage)}</span>
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          )}
        </div>
      )}

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5" aria-label="Server tags">
            {visibleTags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-tag-bg text-tag-text">
                {tag}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-text-secondary">
                +{hiddenCount} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
