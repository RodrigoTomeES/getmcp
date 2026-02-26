"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// prettier-ignore
const asciiArt =
` ██████╗ ███████╗████████╗███╗   ███╗ ██████╗██████╗
██╔════╝ ██╔════╝╚══██╔══╝████╗ ████║██╔════╝██╔══██╗
██║  ███╗█████╗     ██║   ██╔████╔██║██║     ██████╔╝
██║   ██║██╔══╝     ██║   ██║╚██╔╝██║██║     ██╔═══╝
╚██████╔╝███████╗   ██║   ██║ ╚═╝ ██║╚██████╗██║
 ╚═════╝ ╚══════╝   ╚═╝   ╚═╝     ╚═╝ ╚═════╝╚═╝`;
const solidArt = asciiArt.replace(/[╗╔╚╝═║]/g, " ");

const DURATION_MS = 250; // total animation duration
const CHARS_PER_FRAME = Math.ceil(solidArt.length / (DURATION_MS / 16)); // ~16ms per frame at 60fps

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

export function AsciiArt() {
  const [charCount, setCharCount] = useState(0);
  const rafRef = useRef<number>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (reducedMotion) {
      setCharCount(solidArt.length);
      return;
    }

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

  return (
    <div className="relative text-center lg:text-left py-1">
      <div className="relative mx-auto lg:mx-0 w-fit text-left">
        <pre
          className="font-mono tracking-[-1px] leading-[125%] whitespace-pre select-none"
          style={{
            fontSize: "clamp(7px, 3.1vw, 15px)",
            color: "lab(59.4% 0 0)",
          }}
          aria-hidden="true"
        >
          {asciiArt}
        </pre>
        <pre
          className="absolute top-0 left-0 font-mono tracking-[-1px] leading-[125%] text-text whitespace-pre select-none"
          style={{
            fontSize: "clamp(7px, 3.1vw, 15px)",
            textShadow: "0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)",
          }}
          aria-label="getmcp"
        >
          {solidArt.slice(0, charCount)}
          {charCount < solidArt.length && !reducedMotion && (
            <span className="inline-block w-[0.55em] h-[1.1em] bg-text/70 align-middle animate-[blink_1s_step-end_infinite]" />
          )}
        </pre>

        {/* Static CRT scanlines */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 50%, transparent 100%)",
            maskImage: "radial-gradient(ellipse at center, black 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />
      </div>

      <p className="font-mono text-sm lg:text-base uppercase tracking-tight text-text font-medium mt-4">
        The Universal MCP Installer
      </p>
    </div>
  );
}
