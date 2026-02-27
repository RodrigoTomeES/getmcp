import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getServer, getAllServers } from "@getmcp/registry";
import { isStdioConfig } from "@getmcp/core";
import { getCommand, DEFAULT_PM } from "@/lib/package-manager";

export function generateStaticParams() {
  return getAllServers().map((server) => ({ id: server.id }));
}

export const alt = "MCP Server Configuration";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const server = getServer(id);

  if (!server) {
    return new ImageResponse(
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
      </div>,
      { ...size },
    );
  }

  const [interBold, interRegular] = await Promise.all([
    readFile(join(process.cwd(), "assets/Inter-Bold.ttf")),
    readFile(join(process.cwd(), "assets/Inter-Regular.ttf")),
  ]);

  const isStdio = isStdioConfig(server.config);
  const transport = isStdio ? "stdio" : "remote";

  // Truncate description
  let description = server.description;
  if (description.length > 160) {
    description = description.slice(0, 157) + "...";
  }

  const categories = (server.categories ?? []).slice(0, 4);
  const installCommand = getCommand(DEFAULT_PM, server.id);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0a",
        padding: "60px",
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient accent */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      {/* Top bar with accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6)",
          display: "flex",
        }}
      />

      {/* Logo section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* Logo icon */}
        <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
          <path d="M16 3 L16 15" stroke="#ededed" strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M11 11 L16 16 L21 11"
            stroke="#ededed"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="20" r="3.5" stroke="#ededed" strokeWidth="2" fill="none" />
          <path d="M16 23.5 L16 29" stroke="#ededed" strokeWidth="2" strokeLinecap="round" />
          <path d="M12.9 22.6 L8 27" stroke="#ededed" strokeWidth="2" strokeLinecap="round" />
          <path d="M19.1 22.6 L24 27" stroke="#ededed" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#ededed",
            letterSpacing: "-1px",
          }}
        >
          getmcp
        </span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "white",
            backgroundColor: "#3b82f6",
            padding: "4px 12px",
            borderRadius: "20px",
            marginLeft: "4px",
          }}
        >
          beta
        </span>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: "24px",
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
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "#ededed",
              lineHeight: 1.1,
              letterSpacing: "-2px",
              display: "flex",
            }}
          >
            {server.name}
          </div>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: isStdio ? "#4ade80" : "#c084fc",
              backgroundColor: isStdio ? "rgba(34,197,94,0.1)" : "rgba(168,85,247,0.1)",
              border: isStdio ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(168,85,247,0.2)",
              padding: "6px 16px",
              borderRadius: "20px",
            }}
          >
            {transport}
          </span>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: "26px",
            color: "#a0a0a0",
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          {description}
        </div>

        {/* Install command box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "#111111",
            border: "1px solid #262626",
            borderRadius: "10px",
            padding: "14px 20px",
          }}
        >
          <span
            style={{
              fontSize: "21px",
              color: "#3b82f6",
              fontWeight: 700,
            }}
          >
            $
          </span>
          <span
            style={{
              fontSize: "21px",
              color: "#94a3b8",
              fontFamily: "monospace",
            }}
          >
            {installCommand}
          </span>
        </div>
      </div>

      {/* Bottom section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Category pills */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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

        <span
          style={{
            fontSize: "20px",
            color: "#a0a0a0",
          }}
        >
          installmcp.dev
        </span>
      </div>
    </div>,
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
          data: interRegular,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
