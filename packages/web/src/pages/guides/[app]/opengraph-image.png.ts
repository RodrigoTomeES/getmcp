import type { APIRoute, GetStaticPaths } from "astro";
import { pngResponse } from "@/lib/og-image";
import { GUIDE_SLUGS } from "@/lib/guide-data";
import { GUIDE_OG } from "@/lib/og-pages";

export const getStaticPaths = (() =>
  GUIDE_SLUGS.map((app) => ({ params: { app } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => pngResponse(await GUIDE_OG.render(params.app!));
