export const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export const STORAGE_KEY = "getmcp-pm";
export const DEFAULT_PM: PackageManager = "npm";

export function getCommand(pm: PackageManager, serverId?: string): string {
  const id = serverId ?? "<server-id>";
  switch (pm) {
    case "pnpm":
      return `pnpm dlx @getmcp/cli add ${id}`;
    case "npm":
      return `npx @getmcp/cli add ${id}`;
    case "yarn":
      return `yarn dlx @getmcp/cli add ${id}`;
    case "bun":
      return `bunx @getmcp/cli add ${id}`;
  }
}
