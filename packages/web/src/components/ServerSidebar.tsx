import type { InternalRegistryEntry } from "@getmcp/registry";
import { getServerMetrics } from "@getmcp/registry";
import { compactNumber, relativeTime } from "@/lib/format";

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

const StarIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
  </svg>
);

const ForkIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
  </svg>
);

const DownloadIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z" />
  </svg>
);

const IssueIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
  </svg>
);

const DockerIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 5h2V3H3v2Zm3 0h2V3H6v2Zm3 0h2V3H9v2ZM3 8h2V6H3v2Zm3 0h2V6H6v2Zm3 0h2V6H9v2Zm3-2h2V4h-2v2ZM6 11h2V9H6v2Z" />
    <path d="M15.2 6.4c-.3-.2-.9-.3-1.4-.2-.1-.7-.5-1.3-1.1-1.8l-.3-.2-.2.3c-.3.4-.4.9-.3 1.3.1.4.2.7.5 1-.3.1-.5.2-.8.3-.4.1-.8.2-1.2.2H.3l-.1.5c-.1.8 0 1.6.3 2.4.3.6.8 1.2 1.4 1.5.7.4 1.9.6 3.2.6.6 0 1.2-.1 1.8-.2.8-.2 1.6-.5 2.2-1 .5-.4 1-.9 1.4-1.5.6.3 1.3.3 1.9.1.3-.1.5-.3.7-.5l.2-.3-.1-.2Z" />
  </svg>
);

const GitHubIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
);

const ExternalLinkIcon = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
  </svg>
);

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
                icon={StarIcon}
                label="Stars"
                value={compactNumber(metrics.github.stars)}
              />
            )}
            {metrics?.github?.forks != null && metrics.github.forks > 0 && (
              <SidebarStat
                icon={ForkIcon}
                label="Forks"
                value={compactNumber(metrics.github.forks)}
              />
            )}
            {downloads != null && downloads > 0 && (
              <SidebarStat
                icon={DownloadIcon}
                label={`Downloads${downloadLabel}`}
                value={compactNumber(downloads)}
              />
            )}
            {metrics?.github?.openIssues != null && metrics.github.openIssues > 0 && (
              <SidebarStat
                icon={IssueIcon}
                label="Open Issues"
                value={compactNumber(metrics.github.openIssues)}
              />
            )}
            {metrics?.docker?.pulls != null && metrics.docker.pulls > 0 && (
              <SidebarStat
                icon={DockerIcon}
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
              {GitHubIcon}
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
              {ExternalLinkIcon}
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
