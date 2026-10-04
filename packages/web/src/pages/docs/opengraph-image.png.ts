import type { APIRoute } from "astro";
import { pngResponse } from "@/lib/og-image";
import { DOCS_OG } from "@/lib/og-pages";

export const GET: APIRoute = async () => pngResponse(await DOCS_OG.render());
