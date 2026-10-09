import type { APIRoute, GetStaticPaths } from "astro";
import { getCategories } from "@getmcp/registry";
import { pngResponse } from "@/lib/og-image";
import { CATEGORY_OG } from "@/lib/og-pages";

export const getStaticPaths = (() =>
  getCategories().map((slug) => ({ params: { slug } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  pngResponse(await CATEGORY_OG.render(params.slug!));
