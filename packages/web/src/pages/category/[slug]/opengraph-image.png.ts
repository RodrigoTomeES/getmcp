import type { APIRoute, GetStaticPaths } from "astro";
import { pngResponse } from "@/lib/og-image";
import { CATEGORY_SLUGS } from "@/lib/categories";
import { CATEGORY_OG } from "@/lib/og-pages";

export const getStaticPaths = (() =>
  CATEGORY_SLUGS.map((slug) => ({ params: { slug } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  pngResponse(await CATEGORY_OG.render(params.slug!));
