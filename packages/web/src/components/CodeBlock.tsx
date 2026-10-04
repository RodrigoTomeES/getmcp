import { Check, Copy } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";

/**
 * Pass the code either as `children` (from React) or as `code` (from `.astro`
 * files, where children arrive as rendered HTML instead of a string).
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
    <div className="rounded-lg border border-border bg-code-bg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs text-text-secondary font-medium">{label ?? "Code"}</span>
        <button
          data-code-copy
          onClick={() => copy(text)}
          className="text-text-secondary hover:text-text transition-colors shrink-0 p-1 rounded-md"
          aria-label={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-text">
        <code data-language={label?.toLowerCase()}>{text}</code>
      </pre>
    </div>
  );
}
