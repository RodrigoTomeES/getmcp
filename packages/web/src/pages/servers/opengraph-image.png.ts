import type { APIRoute } from "astro";
import { pngResponse } from "@/lib/og-image";
import { SERVERS_OG } from "@/lib/og-pages";

export const GET: APIRoute = async () => pngResponse(await SERVERS_OG.render());
