# CSS Scroll Spy Pattern

## Technique

Use the native CSS scroll spy via `scroll-target-group: auto` + `:target-current` pseudo-class. This is a progressive enhancement — wrapped in `@supports` so unsupported browsers simply get default styling with no errors.

## Turbopack Constraint

**The `@supports (scroll-target-group: auto)` block MUST be placed in an inline `<style>` tag inside the component, NOT in `globals.css` or any file processed by Tailwind/Turbopack.** Turbopack's CSS parser cannot handle `scroll-target-group` or `:target-current` and will fail the build with a "Parsing CSS source code failed" error.

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
