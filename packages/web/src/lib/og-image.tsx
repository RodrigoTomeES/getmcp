import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactElement, ReactNode } from "react";
import satori, { type SatoriOptions } from "satori";
import { renderAsync } from "@resvg/resvg-js";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png" as const;
export const OG_FONT_FAMILY = "Inter, Noto Sans SC, Noto Sans KR, Noto Sans JP, Noto Sans Hebrew";

/** Strip emoji and other astral-plane characters that no bundled font covers. */
export function stripEmoji(text: string): string {
  return Array.from(text)
    .filter((c) => (c.codePointAt(0) ?? 0) <= 0xffff)
    .join("")
    .trim();
}

type OGFont = SatoriOptions["fonts"][number];

let fontsPromise: Promise<OGFont[]> | undefined;

/**
 * Load the OG fonts once per build. Satori caches parsed fonts per `fonts`
 * array instance, so reusing the same array avoids re-parsing the (large) CJK
 * fonts for every one of the ~38k images.
 */
export function loadOGFonts(): Promise<OGFont[]> {
  fontsPromise ??= (async () => {
    // Astro builds from the package root; tests set the path explicitly.
    const assets = process.env.GETMCP_WEB_ASSETS_DIR ?? join(process.cwd(), "assets");
    const [interBold, interRegular, notoSansSC, notoSansKR, notoSansJP, notoSansHebrew] =
      await Promise.all([
        readFile(join(assets, "Inter-Bold.ttf")),
        readFile(join(assets, "Inter-Regular.ttf")),
        readFile(join(assets, "NotoSansSC-Regular.ttf")),
        readFile(join(assets, "NotoSansKR-Regular.ttf")),
        readFile(join(assets, "NotoSansJP-Regular.ttf")),
        readFile(join(assets, "NotoSansHebrew-Regular.ttf")),
      ]);
    return [
      { name: "Inter", data: interBold, style: "normal" as const, weight: 700 as const },
      { name: "Inter", data: interRegular, style: "normal" as const, weight: 400 as const },
      { name: "Noto Sans SC", data: notoSansSC, style: "normal" as const, weight: 400 as const },
      { name: "Noto Sans KR", data: notoSansKR, style: "normal" as const, weight: 400 as const },
      { name: "Noto Sans JP", data: notoSansJP, style: "normal" as const, weight: 400 as const },
      {
        name: "Noto Sans Hebrew",
        data: notoSansHebrew,
        style: "normal" as const,
        weight: 400 as const,
      },
    ];
  })();
  return fontsPromise;
}

const OG_BACKGROUND_RECT = `<rect x="0" y="0" width="${OG_SIZE.width}" height="${OG_SIZE.height}" fill="#0a0a0a"/>`;

/**
 * Blue glow in the top-right corner, as a native SVG radial gradient. Satori
 * turns the equivalent CSS `radial-gradient` (plus the `overflow: hidden` it
 * needed) into a pattern with nested and full-canvas masks that made resvg
 * ~5x slower to rasterize; the pixels are the same (max 1/255 difference).
 */
const OG_GLOW =
  '<radialGradient id="og-glow" cx="1100" cy="100" r="424.26406871192853" gradientUnits="userSpaceOnUse">' +
  '<stop offset="0" stop-color="rgb(59,130,246)" stop-opacity="0.15"/>' +
  '<stop offset="0.7" stop-color="rgb(0,0,0)" stop-opacity="0"/>' +
  "</radialGradient>" +
  '<circle cx="1100" cy="100" r="300" fill="url(#og-glow)"/>';

/** Insert the glow right above the root background, below everything else. */
export function addOGGlow(svg: string): string {
  const index = svg.indexOf(OG_BACKGROUND_RECT);
  if (index === -1) throw new Error("OG image: root background rect not found in Satori output");
  const end = index + OG_BACKGROUND_RECT.length;
  return svg.slice(0, end) + OG_GLOW + svg.slice(end);
}

/**
 * Render a Satori element tree to a PNG (replaces `next/og`'s `ImageResponse`).
 * The root element must have the `#0a0a0a` background; the corner glow is added here.
 */
export async function renderOGImage(element: ReactElement): Promise<Uint8Array> {
  const fonts = await loadOGFonts();
  const svg = addOGGlow(await satori(element, { ...OG_SIZE, fonts }));
  // Satori already converts text to paths, so resvg never needs (slow to load) system fonts.
  const image = await renderAsync(svg, {
    fitTo: { mode: "width", value: OG_SIZE.width },
    font: { loadSystemFonts: false },
  });
  return image.asPng();
}

/** Build a static PNG `Response` for an Astro endpoint. */
export function pngResponse(png: Uint8Array): Response {
  return new Response(png as BodyInit, { headers: { "Content-Type": OG_CONTENT_TYPE } });
}

interface OGImageOptions {
  heading: ReactNode[] | ReactNode;
  description: string;
  pills: string[];
}

export async function createOGImage({ heading, description, pills }: OGImageOptions) {
  return renderOGImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0a",
        padding: "60px",
        fontFamily: OG_FONT_FAMILY,
        position: "relative",
      }}
    >
      {/* Top bar with accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6)",
          display: "flex",
        }}
      />

      {/* Logo section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* Logo icon */}
        <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L16 15" stroke="#ededed" strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M11 11 L16 16 L21 11"
            stroke="#ededed"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="20" r="3.5" stroke="#ededed" strokeWidth="2" fill="none" />
          <path d="M16 23.5 L16 29" stroke="#ededed" strokeWidth="2" strokeLinecap="round" />
          <path d="M12.9 22.6 L8 27" stroke="#ededed" strokeWidth="2" strokeLinecap="round" />
          <path d="M19.1 22.6 L24 27" stroke="#ededed" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#ededed",
            letterSpacing: "-1px",
          }}
        >
          getmcp
        </span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "white",
            backgroundColor: "#3b82f6",
            padding: "4px 12px",
            borderRadius: "20px",
            marginLeft: "4px",
          }}
        >
          beta
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: "24px",
        }}
      >
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#ededed",
            lineHeight: 1.1,
            letterSpacing: "-2px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {heading}
        </div>

        <div
          style={{
            fontSize: "26px",
            color: "#a0a0a0",
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          {description}
        </div>
      </div>

      {/* Bottom section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {pills.map((pill) => (
            <span
              key={pill}
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                backgroundColor: "#1e293b",
                padding: "6px 14px",
                borderRadius: "20px",
              }}
            >
              {pill}
            </span>
          ))}
        </div>

        <span
          style={{
            fontSize: "20px",
            color: "#a0a0a0",
          }}
        >
          getmcp.es
        </span>
      </div>
    </div>,
  );
}
