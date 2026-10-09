import type { APIRoute, GetStaticPaths } from "astro";
import type { InternalRegistryEntry } from "@getmcp/registry";
import { pngResponse } from "@/lib/og-image";
import { createServerOGImage } from "@/lib/og-server";
import { getServerPaths } from "@/lib/server-paths";

export const getStaticPaths = (() => getServerPaths()) satisfies GetStaticPaths;

export const GET: APIRoute<{ server: InternalRegistryEntry }> = async ({ props }) =>
  pngResponse(await createServerOGImage(props.server));
