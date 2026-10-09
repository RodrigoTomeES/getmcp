# CSS Scroll Spy Pattern

## Technique

Use the native CSS scroll spy via `scroll-target-group: auto` + `:target-current` pseudo-class. This is a progressive enhancement — wrapped in `@supports` so unsupported browsers simply get default styling with no errors.

## Build Constraint

**The `@supports (scroll-target-group: auto)` block MUST stay out of `globals.css` and any file processed by Tailwind/Vite.** The pattern was introduced because Turbopack's CSS parser (Next.js era) could not handle `scroll-target-group` or `:target-current`; it is kept out of the pipeline after the move to Astro so the rule never goes through a CSS toolchain that may not understand these new properties.

The rules live in `packages/web/public/docs-scroll-spy.css`, which Astro copies to the output untouched. `pages/docs.astro` links it in the head (through the layout's `head` slot), so only /docs loads it, and no inline `<style>` is needed: the site's CSP (`security.csp`) allows it through `style-src 'self'`, without a hash.

## Implementation Pattern

`public/docs-scroll-spy.css`:

```css
@supports (scroll-target-group: auto) {
  nav[aria-label="Table of contents"] ul {
    scroll-target-group: auto;
  }
  nav[aria-label="Table of contents"] a:target-current {
    color: var(--color-accent);
  }
  nav[aria-label="Table of contents"] li:has(a:target-current) {
    border-left-color: var(--color-accent);
  }
}
```

`pages/docs.astro`:

```astro
<BaseLayout metadata={metadata}>
  <link rel="stylesheet" href="/docs-scroll-spy.css" slot="head" />
  <DocsContent />
</BaseLayout>
```

`components/DocsSidebar.astro`:

```astro
<nav aria-label="Table of contents">
  <ul class="border-l border-border pl-4">
    {
      sections.map((section) => (
        <li>
          <a href={`#${section.id}`}>{section.label}</a>
        </li>
      ))
    }
  </ul>
</nav>
```

### Key Details

- **`scroll-target-group: auto`** on the `<ul>` enables the browser's native scroll spy
- **`:target-current`** on `<a>` targets the currently active link (the section visible in the viewport)
- **`:has(a:target-current)`** on `<li>` allows styling the parent item (e.g., accent left border)
- For a per-item highlight, put the left border on each `<li>` (e.g. `border-l-2`) instead of the `<ul>`
- Scope selectors with `nav[aria-label="..."]` to avoid conflicts with other navigation elements

### Progressive Enhancement

- **Supported browsers** (Chrome 133+): active section gets accent text and accent left border
- **Unsupported browsers**: sidebar renders with default border color and text styling, no errors

## Reference

- Rules: `packages/web/public/docs-scroll-spy.css`
- Markup: `packages/web/src/components/DocsSidebar.astro`
- Linked from: `packages/web/src/pages/docs.astro`
