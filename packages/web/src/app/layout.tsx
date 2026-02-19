import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "getmcp — Universal MCP Server Directory",
  description:
    "Browse, discover, and install MCP servers into any AI application. One config, every app.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-[var(--color-border)] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <img
                src="/icon.svg"
                alt="getmcp"
                width={32}
                height={32}
                className="h-6 w-auto"
              />
              <span className="text-xl font-bold tracking-tight">
                getmcp
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-white font-medium">
                beta
              </span>
            </a>
            <nav className="flex items-center gap-6 text-sm text-[var(--color-text-secondary)]">
              <a
                href="/"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                Servers
              </a>
              <a
                href="https://github.com/RodrigoTomeES/getmcp"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--color-text)] transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[var(--color-border)] px-6 py-6 text-center text-sm text-[var(--color-text-secondary)]">
          <div className="max-w-6xl mx-auto">
            getmcp — One config format, every AI app.
          </div>
        </footer>
      </body>
    </html>
  );
}
