"use client";

import { useEffect, useRef, useState } from "react";

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

export function AsciiArt() {
  const [charCount, setCharCount] = useState(0);
  const rafRef = useRef<number>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rafRef.current = requestAnimationFrame(() => setCharCount(solidArt.length));
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
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
  }, []);

  return (
    <div className="relative text-center lg:text-left py-1">
      <div className="relative overflow-hidden mx-auto lg:mx-0 w-fit text-left">
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
          style={{ fontSize: "clamp(7px, 3.1vw, 15px)" }}
          aria-label="getmcp"
        >
          {solidArt.slice(0, charCount)}
          {charCount < solidArt.length && (
            <span className="inline-block w-[0.55em] h-[1.1em] bg-text/70 align-middle animate-[blink_1s_step-end_infinite]" />
          )}
        </pre>
      </div>

      <p className="font-mono text-[13px] lg:text-[17px] uppercase tracking-tight text-text font-medium mt-4">
        The Universal MCP Installer
      </p>
    </div>
  );
}
