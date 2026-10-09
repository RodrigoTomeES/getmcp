# CSS Scroll Spy Pattern

## Technique

Use the native CSS scroll spy via `scroll-target-group: auto` + `:target-current` pseudo-class. This is a progressive enhancement — wrapped in `@supports` so unsupported browsers simply get default styling with no errors.

## Build Constraint

**The `@supports (scroll-target-group: auto)` block MUST be placed in an inline `<style>` tag inside the component, NOT in `globals.css` or any file processed by Tailwind/Vite.** The pattern was introduced because Turbopack's CSS parser (Next.js era) could not handle `scroll-target-group` or `:target-current`; it is kept inline after the move to Astro so the rule never goes through a CSS pipeline that may not understand these new properties. `DocsSidebar.tsx` is rendered to static HTML by Astro, so the inline `<style>` ends up in the page as-is.

## Implementation Pattern

```tsx
<nav aria-label="Table of contents">
  <style>{`
    @supports (scroll-target-group: auto) {
      nav[aria-label="Table of contents"] ul {
        scroll-target-group: auto;
      }
      nav[aria-label="Table of contents"] a:target-current {
        color: var(--color-accent);
        font-weight: 500;
      }
      nav[aria-label="Table of contents"] li:has(a:target-current) {
        border-left-color: var(--color-accent);
      }
    }
  `}</style>
  <ul>
    <li className="border-l-2 border-border pl-4 transition-colors">
      <a href="#section-id">Section</a>
    </li>
  </ul>
</nav>
```

### Key Details

- **`scroll-target-group: auto`** on the `<ul>` enables the browser's native scroll spy
- **`:target-current`** on `<a>` targets the currently active link (the section visible in the viewport)
- **`:has(a:target-current)`** on `<li>` allows styling the parent item (e.g., accent left border)
- **`border-l-2`** must be on each `<li>` (not the `<ul>`) so active state can highlight individual items
- **`transition-colors`** on `<li>` ensures smooth border color transitions
- Scope selectors with `nav[aria-label="..."]` to avoid conflicts with other navigation elements

### Progressive Enhancement

- **Supported browsers** (Chrome 133+): active section gets accent text + font-weight + accent left border
- **Unsupported browsers**: sidebar renders with default border color and text styling, no errors

## Reference

- Current implementation: `packages/web/src/components/DocsSidebar.tsx`
