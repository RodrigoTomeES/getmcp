"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useClipboard } from "@/hooks/use-clipboard";

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

const COMMANDS = ["add github", "find search", "list --category ai", "remove github"];

const TYPE_SPEED = 60; // ms per character when typing
const ERASE_SPEED = 30; // ms per character when erasing
const PAUSE_AFTER_TYPE = 2000; // pause with full command visible
const PAUSE_AFTER_ERASE = 300; // brief pause before typing next command

export function AnimatedCommand() {
  const [index, setIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isErasing, setIsErasing] = useState(false);
  const { copied, copy } = useClipboard();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const currentCommand = COMMANDS[index];
  const displayedPart = reducedMotion ? currentCommand : currentCommand.slice(0, charCount);
  const fullCommand = `npx @getmcp/cli ${currentCommand}`;

  const tick = useCallback(() => {
    if (reducedMotion) return;

    if (!isErasing) {
      // Typing forward
      if (charCount < currentCommand.length) {
        timerRef.current = setTimeout(() => setCharCount((c) => c + 1), TYPE_SPEED);
      } else {
        // Finished typing — pause, then start erasing
        timerRef.current = setTimeout(() => setIsErasing(true), PAUSE_AFTER_TYPE);
      }
    } else {
      // Erasing
      if (charCount > 0) {
        timerRef.current = setTimeout(() => setCharCount((c) => c - 1), ERASE_SPEED);
      } else {
        // Finished erasing — move to next command after a brief pause
        timerRef.current = setTimeout(() => {
          setIndex((prev) => (prev + 1) % COMMANDS.length);
          setIsErasing(false);
        }, PAUSE_AFTER_ERASE);
      }
    }
  }, [charCount, isErasing, currentCommand, reducedMotion]);

  useEffect(() => {
    tick();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tick]);

  return (
    <div className="rounded-lg border border-border bg-code-bg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-text-secondary shrink-0"
            aria-hidden="true"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" x2="20" y1="19" y2="19" />
          </svg>
          <span className="text-xs font-mono text-text-secondary select-none">terminal</span>
        </div>

        {/* Copy button */}
        <button
          onClick={() => copy(fullCommand)}
          className="text-text-secondary hover:text-text transition-colors shrink-0 p-1"
          aria-label={copied ? "Copied!" : "Copy command"}
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-success"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </button>
      </div>

      {/* Command display — click anywhere to copy */}
      <button
        type="button"
        onClick={() => copy(fullCommand)}
        className="w-full text-left px-4 py-3 cursor-pointer hover:bg-white/3 transition-colors"
        aria-label="Copy command to clipboard"
      >
        <pre className="text-sm font-mono overflow-x-auto whitespace-nowrap select-none">
          <code>
            <span className="text-accent">$</span>{" "}
            <span className="text-text-secondary">npx @getmcp/cli</span>{" "}
            <span className="text-text">{displayedPart}</span>
            {!reducedMotion && (
              <span className="inline-block w-[0.55em] h-[1.1em] bg-text/70 align-middle animate-[blink_1s_step-end_infinite]" />
            )}
          </code>
        </pre>
      </button>
    </div>
  );
}
