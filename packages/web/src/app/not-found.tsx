"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, useEffect, useRef, useState, useSyncExternalStore } from "react";

// prettier-ignore
const asciiArt =
`██╗  ██╗ ██████╗ ██╗  ██╗
██║  ██║██╔═══██╗██║  ██║
███████║██║   ██║███████║
╚════██║██║   ██║╚════██║
     ██║╚██████╔╝     ██║
     ╚═╝ ╚═════╝      ╚═╝`;
const solidArt = asciiArt.replace(/[╗╔╚╝═║]/g, " ");

const REVEAL_MS = 200;
const CHARS_PER_FRAME = Math.ceil(solidArt.length / (REVEAL_MS / 16));

function subscribeToReducedMotion(callback: () => void) {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function NotFound() {
  const pathname = usePathname() || "/unknown";
  const [charCount, setCharCount] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const rafRef = useRef<number>(null);

  const terminalLines = [
    { id: "cmd", text: `$ npx @getmcp/cli find ${pathname}`, className: "text-text" },
    { id: "blank-1", text: "", className: "" },
    { id: "error", text: "Error: resource not found in registry.", className: "text-red-400" },
    { id: "blank-2", text: "", className: "" },
    {
      id: "hint",
      text: 'hint: try "npx @getmcp/cli list" to browse all servers',
      className: "text-text-secondary",
    },
  ];

  useEffect(() => {
    if (reducedMotion) return;

    let current = 0;
    const step = () => {
      current = Math.min(current + CHARS_PER_FRAME, solidArt.length);
      setCharCount(current);
      if (current < solidArt.length) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion]);

  const displayCount = reducedMotion ? solidArt.length : charCount;

  const asciiFont: CSSProperties = {
    fontSize: "clamp(10px, 4.2vw, 26px)",
  };

  return (
    <div
      className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center justify-center"
      style={{ minHeight: "calc(100dvh - 57px - 85px)" }}
    >
      {/* Static CRT scanlines */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
        }}
        aria-hidden="true"
      />

      {/* Sweeping scanline */}
      {!reducedMotion && (
        <div
          className="pointer-events-none fixed left-0 right-0 z-10 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.07), transparent)",
            animation: "scanline-sweep 8s linear infinite",
          }}
          aria-hidden="true"
        />
      )}

      {/* ASCII 404 */}
      <div className="relative mb-10 sm:mb-14" role="img" aria-label="Error 404">
        {/* Base shadow layer */}
        <pre
          className="font-mono tracking-[-1px] leading-[125%] whitespace-pre select-none text-center"
          style={{ ...asciiFont, color: "lab(59.4% 0 0)" }}
          aria-hidden="true"
        >
          {asciiArt}
        </pre>

        {/* Character reveal layer */}
        <pre
          className="absolute top-0 left-0 w-full font-mono tracking-[-1px] leading-[125%] whitespace-pre select-none text-center text-text"
          style={{
            ...asciiFont,
            textShadow: "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)",
          }}
          aria-hidden="true"
        >
          {solidArt.slice(0, displayCount)}
          {displayCount < solidArt.length && (
            <span className="inline-block w-[0.55em] h-[1.1em] bg-text/70 align-middle animate-[blink_1s_step-end_infinite]" />
          )}
        </pre>
      </div>

      {/* Terminal window */}
      <div className="w-full max-w-lg">
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-code-bg">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="block w-3 h-3 rounded-full bg-[#ff5f57]/80" />
              <span className="block w-3 h-3 rounded-full bg-[#febc2e]/80" />
              <span className="block w-3 h-3 rounded-full bg-[#28c840]/80" />
            </div>
            <span className="text-xs font-mono text-text-secondary/60 ml-2">terminal</span>
          </div>

          {/* Terminal content */}
          <div className="p-4 font-mono text-[13px] leading-relaxed bg-surface">
            {terminalLines.map((line) => (
              <div key={line.id} className={line.className}>
                {line.text || "\u00A0"}
              </div>
            ))}
            <div className="mt-1 flex items-center text-text">
              <span>$ </span>
              <span
                className={`inline-block w-[0.55em] h-[1.1em] bg-text/70 align-middle${reducedMotion ? "" : " animate-[blink_1s_step-end_infinite]"} ml-0.5`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
        >
          Browse servers
        </Link>
        <p className="text-xs text-text-secondary mt-3 font-mono">
          or run{" "}
          <code className="px-1.5 py-0.5 rounded bg-code-bg text-text">npx @getmcp/cli find</code>
        </p>
      </div>
    </div>
  );
}
