import { Check, Copy } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";

/**
 * Pass the code either as `children` (from React) or as `code`.
 * Keep in sync with `CodeBlock.astro`: both follow the `@/scripts/copy`
 * attribute contract (`data-copy-root`, `data-copy`, `data-copy-text`,
 * `data-copied`). Rendered statically (e.g. /docs), the page's copy script
 * handles clicks; hydrated (ConfigViewer), `onClick` does.
 */
export function CodeBlock({
  children,
  code,
  label,
}: {
  children?: string;
  code?: string;
  label?: string;
}) {
  const { copied, copy } = useClipboard();
  const text = code ?? children ?? "";

  return (
    <div className="rounded-lg border border-border bg-code-bg overflow-hidden" data-copy-root>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-text-secondary font-medium">{label ?? "Code"}</span>
        <button
          type="button"
          data-copy=""
          data-copied={copied || undefined}
          onClick={() => copy(text)}
          className="group text-text-secondary hover:text-text transition-colors shrink-0 p-1 rounded-md"
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          <Copy className="w-4 h-4 group-data-copied:hidden" aria-hidden="true" />
          <Check
            className="w-4 h-4 text-success hidden group-data-copied:block"
            aria-hidden="true"
          />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-text">
        <code data-copy-text data-language={label?.toLowerCase()}>
          {text}
        </code>
      </pre>
    </div>
  );
}
