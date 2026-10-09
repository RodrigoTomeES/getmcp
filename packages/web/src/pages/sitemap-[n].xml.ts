import type { APIRoute, GetStaticPaths } from "astro";
import { chunkEntries, getSitemapEntries, renderUrlSet, type SitemapEntry } from "@/lib/sitemap";

export const getStaticPaths = (() =>
  chunkEntries(getSitemapEntries()).map((entries, i) => ({
    params: { n: String(i) },
    props: { entries },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ entries: SitemapEntry[] }> = ({ props }) =>
  new Response(renderUrlSet(props.entries), {
    headers: { "Content-Type": "application/xml" },
  });
