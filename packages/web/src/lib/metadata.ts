import { APP_COUNT, SITE_URL } from "./constants";

/**
 * Minimal port of the Next.js Metadata API used by the previous site.
 *
 * Next merges page metadata into the root layout metadata *shallowly* per
 * top-level key (a page `openGraph` replaces the layout `openGraph`, etc.) and
 * applies the layout `title.template` to every page except the root page.
 * `resolveMetadata()` reproduces those semantics so the emitted tags match.
 */

export type OpenGraph = {
  title?: string;
  description?: string;
  type?: string;
  siteName?: string;
  locale?: string;
};

export type Twitter = {
  card?: string;
  title?: string;
  description?: string;
  site?: string;
  creator?: string;
};

export type PageMetadata = {
  title?: string;
  description?: string;
  keywords?: string[];
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  openGraph?: OpenGraph;
  twitter?: Twitter;
};

export type OgImage = {
  /** Absolute path of the generated image, e.g. `/servers/opengraph-image.png` */
  path: string;
  alt: string;
};

const DEFAULT_TITLE = `getmcp — Install MCP Servers in ${APP_COUNT} AI Apps with One Command`;
const TITLE_TEMPLATE = (title: string) => `${title} — getmcp`;
const DEFAULT_DESCRIPTION = `Install and configure MCP servers across Claude Desktop, VS Code, Cursor, and ${APP_COUNT - 3} more AI apps with one command. Universal config generator for JSON, JSONC, YAML, and TOML.`;

export const ROOT_METADATA: PageMetadata = {
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "MCP",
    "MCP server",
    "install MCP",
    "Model Context Protocol",
    "Claude Desktop MCP",
    "VS Code MCP",
    "Cursor MCP",
    "MCP config generator",
    "MCP CLI",
    "getmcp",
    "MCP registry",
    "MCP server installer",
    "MCP configuration",
    "Windsurf MCP",
    "Codex MCP",
    "team MCP setup",
    "private MCP registry",
  ],
  openGraph: {
    siteName: "getmcp",
    locale: "en_US",
    type: "website",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: "@getmcp",
    creator: "@RodrigoTomeES",
  },
  alternates: {
    languages: {
      en: SITE_URL,
      "x-default": SITE_URL,
    },
  },
};

export type ResolvedMetadata = Omit<PageMetadata, "title"> & {
  title: string;
  ogImage?: OgImage;
  noindex?: boolean;
};

export function resolveMetadata(
  page: PageMetadata,
  options: { isRootPage?: boolean; ogImage?: OgImage; noindex?: boolean } = {},
): ResolvedMetadata {
  const merged: PageMetadata = { ...ROOT_METADATA, ...page };
  const title =
    page.title === undefined
      ? DEFAULT_TITLE
      : options.isRootPage
        ? page.title
        : TITLE_TEMPLATE(page.title);

  // Next fills missing Twitter title/description from Open Graph.
  const twitter: Twitter | undefined = merged.twitter && {
    ...merged.twitter,
    title: merged.twitter.title ?? merged.openGraph?.title,
    description: merged.twitter.description ?? merged.openGraph?.description,
  };

  return { ...merged, title, twitter, ogImage: options.ogImage, noindex: options.noindex };
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
