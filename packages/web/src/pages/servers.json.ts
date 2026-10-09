import type { APIRoute } from "astro";
import { getAllServers } from "@getmcp/registry";
import { toServerCardData } from "@/lib/server-detail";

// Full search index for the /servers SearchBar island, fetched after hydration.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(getAllServers().map(toServerCardData)), {
    headers: { "Content-Type": "application/json" },
  });
