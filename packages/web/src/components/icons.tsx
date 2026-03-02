type IconProps = { className?: string };

export function StarIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

export function DownloadIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14ZM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z" />
    </svg>
  );
}

export function ForkIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
    </svg>
  );
}

export function IssueIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
    </svg>
  );
}

export function DockerIcon({ className = "w-3.5 h-3.5" }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 5h2V3H3v2Zm3 0h2V3H6v2Zm3 0h2V3H9v2ZM3 8h2V6H3v2Zm3 0h2V6H6v2Zm3 0h2V6H9v2Zm3-2h2V4h-2v2ZM6 11h2V9H6v2Z" />
      <path d="M15.2 6.4c-.3-.2-.9-.3-1.4-.2-.1-.7-.5-1.3-1.1-1.8l-.3-.2-.2.3c-.3.4-.4.9-.3 1.3.1.4.2.7.5 1-.3.1-.5.2-.8.3-.4.1-.8.2-1.2.2H.3l-.1.5c-.1.8 0 1.6.3 2.4.3.6.8 1.2 1.4 1.5.7.4 1.9.6 3.2.6.6 0 1.2-.1 1.8-.2.8-.2 1.6-.5 2.2-1 .5-.4 1-.9 1.4-1.5.6.3 1.3.3 1.9.1.3-.1.5-.3.7-.5l.2-.3-.1-.2Z" />
    </svg>
  );
}

export function GitHubIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

export function ExternalLinkIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z" />
    </svg>
  );
}
