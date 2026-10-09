import type { APIRoute } from "astro";
import { pngResponse } from "@/lib/og-image";
import { HOME_OG } from "@/lib/og-pages";

export const GET: APIRoute = async () => pngResponse(await HOME_OG.render());
