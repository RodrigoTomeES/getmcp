import type { APIRoute, GetStaticPaths } from "astro";
import { pngResponse } from "@/lib/og-image";
import { GUIDE_NAMES, GUIDE_OG } from "@/lib/og-pages";

export const getStaticPaths = (() =>
  Object.keys(GUIDE_NAMES).map((app) => ({ params: { app } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => pngResponse(await GUIDE_OG.render(params.app!));
