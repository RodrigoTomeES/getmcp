import { getRegistryEntryJsonSchema } from "@getmcp/core";

export const dynamic = "force-static";

export function GET() {
  const schema = getRegistryEntryJsonSchema();
  return Response.json(schema);
}
