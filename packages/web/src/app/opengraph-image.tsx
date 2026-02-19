import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getServerCount } from "@getmcp/registry";

export const alt = "getmcp — Universal MCP Server Directory";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const interBold = await readFile(
    join(process.cwd(), "assets/Inter-Bold.ttf")
  );
  const interRegular = await readFile(
    join(process.cwd(), "assets/Inter-Regular.ttf")
  );

  const serverCount = getServerCount();

  return new ImageResponse(
    (
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
            background:
              "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
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
            background:
              "linear-gradient(90deg, #3b82f6, #2563eb, #3b82f6)",
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
          <svg
            width="56"
            height="56"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M16 3 L16 15"
              stroke="#ededed"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M11 11 L16 16 L21 11"
              stroke="#ededed"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="16"
              cy="20"
              r="3.5"
              stroke="#ededed"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M16 23.5 L16 29"
              stroke="#ededed"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12.9 22.6 L8 27"
              stroke="#ededed"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M19.1 22.6 L24 27"
              stroke="#ededed"
              strokeWidth="2"
              strokeLinecap="round"
            />
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
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "#ededed",
              lineHeight: 1.1,
              letterSpacing: "-2px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Universal MCP</span>
            <span>Server Directory</span>
          </div>

          <div
            style={{
              fontSize: "26px",
              color: "#a0a0a0",
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            Browse {serverCount} MCP servers. One config format, generated for
            12 applications.
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
          {/* App pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              "Claude Desktop",
              "VS Code",
              "Cursor",
              "Windsurf",
              "Goose",
              "Zed",
            ].map((app) => (
              <span
                key={app}
                style={{
                  fontSize: "14px",
                  color: "#94a3b8",
                  backgroundColor: "#1e293b",
                  padding: "6px 14px",
                  borderRadius: "20px",
                }}
              >
                {app}
              </span>
            ))}
            <span
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                backgroundColor: "#1e293b",
                padding: "6px 14px",
                borderRadius: "20px",
              }}
            >
              +6 more
            </span>
          </div>

          <span
            style={{
              fontSize: "20px",
              color: "#a0a0a0",
            }}
          >
            getmcp.es
          </span>
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
          data: interRegular,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
