import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getServer, getAllServers } from "@getmcp/registry";
import { isStdioConfig } from "@getmcp/core";

export function generateStaticParams() {
  return getAllServers().map((server) => ({ id: server.id }));
}

export const alt = "MCP Server Configuration";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const server = getServer(id);

  if (!server) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            color: "#ededed",
            fontSize: "48px",
            fontFamily: "Inter",
          }}
        >
          Server not found
        </div>
      ),
      { ...size }
    );
  }

  const [interBold, interSemiBold, interRegular] = await Promise.all([
    readFile(join(process.cwd(), "assets/Inter-Bold.ttf")),
    readFile(join(process.cwd(), "assets/Inter-SemiBold.ttf")),
    readFile(join(process.cwd(), "assets/Inter-Regular.ttf")),
  ]);

  const isStdio = isStdioConfig(server.config);
  const transport = isStdio ? "stdio" : "remote";

  // Build the command or URL string
  let commandText = "";
  if (isStdio && "command" in server.config) {
    const parts = [server.config.command, ...(server.config.args ?? [])];
    commandText = parts.join(" ");
    // Truncate long commands
    if (commandText.length > 80) {
      commandText = commandText.slice(0, 77) + "...";
    }
  } else if ("url" in server.config) {
    commandText = server.config.url;
    if (commandText.length > 80) {
      commandText = commandText.slice(0, 77) + "...";
    }
  }

  // Truncate description
  let description = server.description;
  if (description.length > 160) {
    description = description.slice(0, 157) + "...";
  }

  const categories = (server.categories ?? []).slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          padding: "48px 56px",
          fontFamily: "Inter",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            bottom: "-300px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: isStdio
              ? "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: isStdio
              ? "linear-gradient(90deg, #22c55e, #16a34a, #22c55e)"
              : "linear-gradient(90deg, #a855f7, #7c3aed, #a855f7)",
            display: "flex",
          }}
        />

        {/* Header: logo + domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Logo icon */}
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 3 L16 15"
                stroke="#a0a0a0"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M11 11 L16 16 L21 11"
                stroke="#a0a0a0"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="16"
                cy="20"
                r="3.5"
                stroke="#a0a0a0"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M16 23.5 L16 29"
                stroke="#a0a0a0"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12.9 22.6 L8 27"
                stroke="#a0a0a0"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M19.1 22.6 L24 27"
                stroke="#a0a0a0"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#a0a0a0",
                letterSpacing: "-0.5px",
              }}
            >
              getmcp
            </span>
          </div>
          <span
            style={{
              fontSize: "18px",
              color: "#a0a0a0",
            }}
          >
            getmcp.es
          </span>
        </div>

        {/* Main content card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            border: "1px solid #262626",
            borderRadius: "16px",
            backgroundColor: "#141414",
            padding: "40px 44px",
            gap: "20px",
            overflow: "hidden",
          }}
        >
          {/* Server name + transport badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontSize: "44px",
                fontWeight: 700,
                color: "#ededed",
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              {server.name}
            </span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: isStdio ? "#4ade80" : "#c084fc",
                backgroundColor: isStdio
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(168,85,247,0.1)",
                border: isStdio
                  ? "1px solid rgba(34,197,94,0.2)"
                  : "1px solid rgba(168,85,247,0.2)",
                padding: "4px 14px",
                borderRadius: "20px",
              }}
            >
              {transport}
            </span>
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: "22px",
              color: "#a0a0a0",
              lineHeight: 1.5,
              display: "flex",
            }}
          >
            {description}
          </div>

          {/* Command / URL box */}
          {commandText && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "#1a1a2e",
                border: "1px solid #262626",
                borderRadius: "10px",
                padding: "14px 20px",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  color: "#3b82f6",
                  fontWeight: 600,
                }}
              >
                {isStdio ? "$" : "URL"}
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "#94a3b8",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {commandText}
              </span>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "auto",
              }}
            >
              {categories.map((cat) => (
                <span
                  key={cat}
                  style={{
                    fontSize: "14px",
                    color: "#94a3b8",
                    backgroundColor: "#1e293b",
                    padding: "6px 14px",
                    borderRadius: "20px",
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "Inter",
          data: interSemiBold,
          style: "normal",
          weight: 600,
        },
        {
          name: "Inter",
          data: interRegular,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
