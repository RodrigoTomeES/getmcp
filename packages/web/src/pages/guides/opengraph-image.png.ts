import type { APIRoute } from "astro";
import { pngResponse } from "@/lib/og-image";
import { GUIDES_OG } from "@/lib/og-pages";

export const GET: APIRoute = async () => pngResponse(await GUIDES_OG.render());
