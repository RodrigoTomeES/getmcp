import type { Metadata } from "next";
import { Fira_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const firaMono = Fira_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-fira-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://getmcp.es"),
  title: "getmcp — Universal MCP Server Directory",
  description:
    "Browse, discover, and install MCP servers into any AI application. One config, every app.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    siteName: "getmcp",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={firaMono.variable}>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon.svg"
                alt="getmcp logo"
                width={32}
                height={32}
                className="h-6 w-auto"
              />
              <span className="text-xl font-bold tracking-tight">getmcp</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-white font-medium">
                beta
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-text-secondary">
              <Link href="/" className="hover:text-text transition-colors hidden sm:inline-block">
                Servers
              </Link>
              <Link href="/docs" className="hover:text-text transition-colors">
                Docs
              </Link>
              <a
                href="https://github.com/RodrigoTomeES/getmcp"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border px-6 py-6 text-center text-sm text-text-secondary">
          <div className="max-w-6xl mx-auto">getmcp — One config format, every AI app.</div>
        </footer>
      </body>
    </html>
  );
}
