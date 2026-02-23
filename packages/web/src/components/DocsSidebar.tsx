const sections = [
  { id: "what-is-getmcp", label: "What is getmcp?", level: 2 },
  { id: "getting-started", label: "Getting started", level: 2 },
  { id: "project-manifests", label: "Project manifests", level: 2 },
  { id: "supported-apps", label: "Supported apps", level: 2 },
  { id: "how-it-works", label: "How it works", level: 2 },
  { id: "library-usage", label: "Library usage", level: 2 },
  { id: "generate-config", label: "Generate config", level: 3 },
  { id: "validate-schemas", label: "Validate schemas", level: 3 },
  { id: "search-registry", label: "Search registry", level: 3 },
  { id: "adding-a-server", label: "Adding a server", level: 2 },
  { id: "security-disclaimer", label: "Security disclaimer", level: 2 },
] as const;

const scrollSpyStyles = `
@supports (scroll-target-group: auto) {
  nav[aria-label="Table of contents"] ul {
    scroll-target-group: auto;
  }
  nav[aria-label="Table of contents"] a:target-current {
    color: var(--color-accent);
  }
}`;

export function DocsSidebar() {
  return (
    <nav
      aria-label="Table of contents"
      className="hidden lg:block sticky top-6 w-48 shrink-0 self-start"
    >
      <style dangerouslySetInnerHTML={{ __html: scrollSpyStyles }} />
      <ul className="space-y-2 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`block transition-colors text-text-secondary hover:text-text ${
                section.level === 3 ? "pl-4" : ""
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
