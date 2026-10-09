# Design System — getmcp Web

> Dark-first, border-driven design with no light mode. Depth is created through background color layering, not shadows.

---

## Colors

All colors are defined as CSS custom properties in `globals.css` via Tailwind v4's `@theme` directive.

### Core Palette

| Token                    | Value     | Tailwind Class        | Usage                      |
| ------------------------ | --------- | --------------------- | -------------------------- |
| `--color-bg`             | `#0a0a0a` | `bg-bg`               | Page background            |
| `--color-surface`        | `#141414` | `bg-surface`          | Cards, elevated containers |
| `--color-surface-hover`  | `#1c1c1c` | `bg-surface-hover`    | Hover state for surfaces   |
| `--color-border`         | `#262626` | `border-border`       | Borders, dividers          |
| `--color-text`           | `#ededed` | `text-text`           | Primary text               |
| `--color-text-secondary` | `#a0a0a0` | `text-text-secondary` | Muted/secondary text       |

### Accent

| Token                  | Value     | Tailwind Class                              | Usage                   |
| ---------------------- | --------- | ------------------------------------------- | ----------------------- |
| `--color-accent`       | `#3b82f6` | `bg-accent`, `text-accent`, `border-accent` | Brand blue, links, CTAs |
| `--color-accent-hover` | `#2563eb` | `bg-accent-hover`                           | Hover state for accent  |

### Status

| Token             | Value     | Tailwind Class | Usage             |
| ----------------- | --------- | -------------- | ----------------- |
| `--color-success` | `#22c55e` | `text-success` | Success, positive |
| `--color-warning` | `#f59e0b` | `text-warning` | Warnings, caution |

### Transport Types

| Token                         | Value                                          | Usage                   |
| ----------------------------- | ---------------------------------------------- | ----------------------- |
| `--color-transport-stdio`     | `#22c55e`                                      | Stdio badge text        |
| `--color-transport-stdio-bg`  | `color-mix(in srgb, #22c55e 10%, transparent)` | Stdio badge background  |
| `--color-transport-remote`    | `#a855f7`                                      | Remote badge text       |
| `--color-transport-remote-bg` | `color-mix(in srgb, #a855f7 10%, transparent)` | Remote badge background |

### Component-Specific

| Token                    | Value                                          | Usage                           |
| ------------------------ | ---------------------------------------------- | ------------------------------- |
| `--color-tag-bg`         | `#1e293b`                                      | Category tag background         |
| `--color-tag-text`       | `#a1b2c8`                                      | Category tag text               |
| `--color-code-bg`        | `#111111`                                      | Code block background           |
| `--color-official`       | `#3b82f6`                                      | Official badge text             |
| `--color-official-bg`    | `color-mix(in srgb, #3b82f6 10%, transparent)` | Official badge background       |
| `--color-warning-bg`     | `color-mix(in srgb, #f59e0b 10%, transparent)` | Warning badge background        |
| `--color-warning-border` | `color-mix(in srgb, #f59e0b 30%, transparent)` | Warning box border              |
| `--color-warning-subtle` | `color-mix(in srgb, #f59e0b 12%, transparent)` | Warning box background          |
| `--color-warning-light`  | `color-mix(in srgb, #f59e0b 80%, white)`       | Light amber (warning code text) |

### Depth Layering (no shadows)

```
bg (#0a0a0a)  →  surface (#141414)  →  surface-hover (#1c1c1c)
                                        code-bg (#111111)
```

---

## Fonts

### Web (system stack + Fira Mono)

```css
/* Body text */
font-family:
  system-ui,
  -apple-system,
  sans-serif;

/* Monospace (Tailwind font-mono) */
font-family: var(--font-fira-mono); /* "Fira Mono", "Fira Mono fallback: Courier New", monospace */
```

**Fira Mono** is loaded with the Astro Fonts API (`fonts` in `astro.config.mjs`, provider `fontProviders.fontsource()`). Astro downloads the files from Fontsource at build time, caches them in `node_modules/.astro/fonts`, and serves them hashed from `/_astro/fonts/`. `<Font cssVariable="--font-fira-mono" />` in `src/layouts/BaseLayout.astro` outputs the `@font-face` rules and the preload links.

- Weights: **400** (ASCII art, code) and **500** (`font-medium` labels), style `normal`.
- Subsets: `latin` and `symbols2`. `symbols2` holds the box-drawing and block element characters (█, ╗, ╔, ═, ║, ╚, ╝) of the ASCII logos on the home and 404 pages. Each subset is its own `@font-face` with a `unicode-range`, so `symbols2` is only downloaded on pages that render those glyphs.
- Preload: every page preloads `latin` 400. Pages with an above-the-fold ASCII logo (`index.astro`, `404.astro`) pass `preloadSymbols` to `BaseLayout` to also preload `symbols2` 400.
- Fallback: `fallbacks: ["monospace"]`. Astro generates a metric-matched `Courier New` face, so text barely shifts when Fira Mono loads. On systems without Courier New (most Linux/Android), the plain `monospace` fallback is used.
- Tailwind integration: `@theme inline { --font-mono: var(--font-fira-mono); }` in `src/styles/globals.css`.
- `font-display: swap` (Fonts API default): shows the fallback immediately and swaps when Fira Mono loads.

### OG Images (Inter)

Font files in `packages/web/assets/`:

- `Inter-Regular.ttf` (400)
- `Inter-SemiBold.ttf` (600)
- `Inter-Bold.ttf` (700)

Used exclusively for OG image generation at build time (satori + `@resvg/resvg-js`, see `src/lib/og-image.tsx`). CJK and Hebrew text falls back to the Noto Sans fonts in the same folder.

### Font Weights

| Weight | Class           | Usage                       |
| ------ | --------------- | --------------------------- |
| 400    | (default)       | Body text                   |
| 500    | `font-medium`   | Labels, buttons             |
| 600    | `font-semibold` | Section titles, card titles |
| 700    | `font-bold`     | Page headings, emphasis     |

---

## Typography

### Headings

| Level         | Classes                            | Example                  |
| ------------- | ---------------------------------- | ------------------------ |
| Page title    | `text-4xl font-bold`               | Homepage h1              |
| Section title | `text-3xl font-bold`               | Server detail h1         |
| Section h2    | `text-2xl font-bold`               | Docs sections            |
| Subsection    | `text-lg font-semibold`            | Component section titles |
| Card title    | `font-semibold text-lg`            | ServerCard name          |
| Logo          | `text-xl font-bold tracking-tight` | Header branding          |

### Body Text

| Style       | Classes                                              | Usage                   |
| ----------- | ---------------------------------------------------- | ----------------------- |
| Primary     | `text-text`                                          | Main content            |
| Secondary   | `text-text-secondary`                                | Muted, descriptions     |
| Intro       | `text-lg text-text-secondary`                        | Introductory paragraphs |
| Small       | `text-xs`                                            | Labels, badges, hints   |
| Code inline | `bg-surface px-1.5 py-0.5 rounded text-sm font-mono` | Inline `code`           |
| Code block  | `font-mono text-sm leading-relaxed`                  | Code viewers            |

### Links

- Default: `text-accent hover:underline`
- Breadcrumb: `text-text-secondary hover:text-text`
- External: `underline text-warning-light` (for warning context links)

### Lists

- Unordered: `list-disc list-inside space-y-2 ml-1`
- Ordered: `list-decimal list-inside space-y-2 ml-1`

---

## Borders, Radii & Shadows

### Border Radius

| Token          | Size   | Usage                                  |
| -------------- | ------ | -------------------------------------- |
| `rounded`      | 4px    | Inline code, small tags                |
| `rounded-md`   | 6px    | Buttons, small interactive elements    |
| `rounded-lg`   | 8px    | Cards, code blocks, inputs, containers |
| `rounded-full` | 9999px | Badges, pills, category filter buttons |

### Borders

- Default: `border border-border` (1px `#262626`)
- Accent: `border-accent` (active state)
- Warning: `border-warning-border` (alert boxes)
- Directional: `border-b` (header), `border-t` (footer)

### Shadows

None. The design relies entirely on background color layering and borders for depth.

---

## Layout

### Max Widths

| Page            | Class                    |
| --------------- | ------------------------ |
| Homepage        | `max-w-6xl mx-auto px-6` |
| Docs            | `max-w-3xl mx-auto px-6` |
| Server detail   | `max-w-6xl mx-auto px-6` |
| Install command | `max-w-xl mx-auto`       |

### Responsive Breakpoints (Tailwind defaults)

| Breakpoint | Width  | Usage               |
| ---------- | ------ | ------------------- |
| `sm`       | 640px  | Metadata grid 2-col |
| `md`       | 768px  | Server grid 2-col   |
| `lg`       | 1024px | Server grid 3-col   |

### Grid Patterns

- **Server grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- **Metadata grid**: `grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5`

### Spacing Conventions

- Page vertical padding: `py-10`/`py-12` (homepage, detail) or `py-16` (docs)
- Section spacing: `mb-8` to `mb-12` between major sections
- Component internal: `p-4` to `p-5`
- Flex gaps: `gap-1.5` (tabs), `gap-2` to `gap-4` (content), `gap-6` (nav links)
- Hero to content separator: `<hr className="border-border mb-10" />` on homepage
- Metadata grid: `py-6 border-y border-border` for bordered section feel

---

## UI Components

### ServerCard

**File**: `components/ServerCard.tsx`
**Props**: `{ server: RegistryEntryType }`

```
┌─────────────────────────────────────────┐
│  Server Name                   [stdio]  │  ← font-semibold + transport badge
│  Description text truncated to two      │  ← text-sm text-text-secondary
│  lines maximum...                       │     line-clamp-2
│                                         │
│  [category] [category]     [ENV_VAR]    │  ← tags + env badge (mt-auto)
│  ─────────────────────────────────────  │  ← border-t
│  by Author Name                         │  ← text-xs text-text-secondary
└─────────────────────────────────────────┘
```

- Container: `flex flex-col rounded-lg border border-border bg-surface p-5`
- Hover: `hover:bg-surface-hover hover:border-accent/50 transition-all`
- Tags use `mt-auto` to pin to bottom when cards vary in height

### SearchBar

**File**: `components/SearchBar.tsx`

```
┌──────────────────────────────────────┐
│  🔍  Search servers...               │  ← input with icon
└──────────────────────────────────────┘
 [All] [developer-tools] [web] [ai] ...   ← category filter pills

 ┌─────────┐ ┌─────────┐ ┌─────────┐
 │  Card   │ │  Card   │ │  Card   │     ← 3-col grid (responsive)
 └─────────┘ └─────────┘ └─────────┘
```

- Input: `rounded-lg border border-border bg-surface focus:border-accent`
- Filter pills: `rounded-full border text-xs px-3 py-1.5`
  - Active: `border-accent bg-accent/10 text-accent`
  - Inactive: `border-border text-text-secondary`

### ConfigViewer

**File**: `components/ConfigViewer.astro`

```
Configuration
 [Claude Desktop] [VS Code] [Cursor] ...  ← app tabs
 Config path: ~/.config/...                ← hint text

 ┌──────────────────────────────────────┐
 │  json                        [copy]  │  ← header bar
 ├──────────────────────────────────────┤
 │  {                                   │  ← code block
 │    "mcpServers": { ... }             │     bg-code-bg, font-mono
 │  }                                   │
 └──────────────────────────────────────┘
```

- App pills are native radios: a `<fieldset>` with an sr-only `<legend>`, each `<label>` wraps an sr-only `<input type="radio" name="config-app">`; arrow keys move the selection
- Pill checked: `has-checked:border-accent has-checked:bg-accent/10 has-checked:text-accent`
- Pill unchecked: `border-border text-text-secondary`, hover `not-has-checked:hover:border-text-secondary not-has-checked:hover:text-text`
- Focus: `has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent` on the label
- Every app panel is pre-rendered; the inactive ones carry `hidden` (no display utilities on panels)
- Code container: `rounded-lg border border-border bg-code-bg`
- Footer: docs link + optional warnings in a `flex flex-wrap` row

### PackageManagerCommand

**File**: `components/PackageManagerCommand.astro`

```
 ┌──────────────────────────────────────┐
 │  > [pnpm] [npm] [yarn] [bun] [copy] │  ← header with PM tabs
 ├──────────────────────────────────────┤
 │  npx @getmcp/cli add github          │  ← command text
 └──────────────────────────────────────┘
```

- PM options are native radios (`name="package-manager"`, `<fieldset>` + sr-only `<legend>`), styled on the `<label>`
- PM checked: `has-checked:bg-surface has-checked:text-text`
- PM unchecked: `text-text-secondary hover:text-text`; focus ring as in ConfigViewer
- The four commands are pre-rendered `<span data-panel data-copy-text>` inside one `<pre><code>`; the copy button copies the visible one

### Home hero and CLI showcase

**Files**: `components/AsciiArt.astro`, `components/AnimatedCommand.astro`, `components/CliShowcase.astro` (no React on the home page)

- **ASCII logo**: the outlined art and the solid layer are both rendered statically inside a `role="img" aria-label="getmcp"` wrapper (both `<pre>` are `aria-hidden`). The solid layer gets `motion-safe:animate-ascii-reveal`, a 250 ms `clip-path: inset(0 100% 0 0)` → `inset(0)` wipe in `steps(40)`. Without JS or with reduced motion the logo is complete from the first paint. The CRT scanline overlay is `motion-reduce:hidden`
- **Animated command**: the first command is server-rendered in full (no-JS and reduced-motion state). The script starts in the "typed, pausing" state (2000 ms), then erases (30 ms/char), pauses 300 ms and types the next (60 ms/char). The blinking cursor is `motion-reduce:hidden`. Both copy buttons carry `data-copy` with the full current command
- **CLI showcase**: command cards are `<label>`s around sr-only radios (`name="cli-command"`, `<fieldset>` + sr-only `<legend>`); checked: `has-checked:border-accent has-checked:bg-accent/10`, unchecked hover: `not-has-checked:hover:border-accent/50`, focus ring via `has-focus-visible:`. Arrow keys move linearly through the cards. The 10 terminal mocks are pre-rendered `[data-panel]`s, the inactive ones `hidden`

### MetaItem

**File**: `components/MetaItem.tsx`

```
 LABEL            ← dt: text-xs font-medium uppercase tracking-wider text-text-secondary
 Value            ← dd: text-sm text-text (optional font-mono), truncate with title tooltip
```

- Uses semantic `<dt>`/`<dd>` elements inside a parent `<dl>` wrapper on the page
- No container box -- definition-list style, text sits directly on page background
- Wrapper div with `space-y-1` for label/value spacing
- Grid on the `<dl>`: `grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5`
- Bordered section: `py-6 border-y border-border` separates metadata from surrounding content

### Transport Badge

```
 [stdio]   → bg-transport-stdio-bg text-transport-stdio (green)
 [remote]  → bg-transport-remote-bg text-transport-remote (purple)
```

- Styling: `text-xs px-2 py-0.5 rounded-full font-medium`

### Environment Variables Warning

```
 ┌──────────────────────────────────────┐
 │  ⚠ Required Environment Variables    │  ← text-warning
 │                                      │
 │  API_KEY  SECRET_TOKEN               │  ← bg-code-bg, text-warning-light
 └──────────────────────────────────────┘
```

- Box: `rounded-lg border border-warning-border bg-warning-subtle p-5`

### DocsSidebar

**File**: `components/DocsSidebar.tsx`

```
 ON THIS PAGE       ← text-xs font-medium uppercase tracking-wider
 │ What is getmcp?  ← text-sm, text-text-secondary hover:text-text
 │ Getting started
 │   Generate config  ← level 3: pl-3 text-xs
 │ ...
```

- Container: `sticky top-6 w-48 shrink-0 self-start`
- Heading: `text-xs font-medium uppercase tracking-wider text-text-secondary mb-4`
- List: `space-y-2.5 text-sm border-l border-border pl-4`
- Level 3 items indented with `pl-3 text-xs`
- Supports `scroll-target-group` and `:target-current` for active state highlighting

---

## Buttons

### Primary (CTA)

```
bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2.5 rounded-lg
```

### Secondary (filters, tabs)

```
border border-border text-text-secondary hover:border-text-secondary hover:text-text
px-3 py-1.5 rounded-md  (or rounded-full for pills)
```

### Active Tab/Filter

```
border-accent bg-accent/10 text-accent       (filter pill)
border-accent bg-accent text-white            (config tab)
```

### Icon Button (copy)

```
group text-text-secondary hover:text-text transition-colors rounded-md
→ data-copied on the button for 2s: Copy icon `group-data-copied:hidden`,
  Check icon `text-success hidden group-data-copied:block`
```

Both icons are always rendered; `scripts/copy.ts` toggles `data-copied` and writes "Copied to clipboard" into one shared `aria-live="polite"` region (cleared by the same 2s timer). The `aria-label` stays "Copy code".

---

## Error/Empty States

### 404 Page

`NotFound.astro`, static (no React):

```
 ASCII "404"              ← two aria-hidden <pre> layers in a role="img" wrapper, clamp(10px, 4.2vw, 26px)
 terminal window          ← fake `npx @getmcp/cli find <path>` with a red error line and a hint
 [Browse servers]         ← primary CTA button + `or run npx @getmcp/cli find`
```

- Centered column with `py-20`, filling the viewport below header and footer
- Fixed CRT scanline overlay; the sweeping scanline, the solid-layer reveal (`motion-safe:animate-ascii-reveal`) and the cursor blink only run without reduced motion
- The requested path is filled in by a tiny script (`/unknown` without JS)

### Error Page

```
 Error                    ← text-sm font-mono uppercase tracking-wider
 Something went wrong     ← text-2xl font-bold tracking-tight
 error message            ← text-sm text-text-secondary
 [Try again]              ← secondary button
```

- Same `py-32` vertical padding for visual consistency

---

## Icons

Icons come from two libraries: **lucide-react** (generic UI icons) and **@icons-pack/react-simple-icons** (brand icons).

- Size: `w-4 h-4` (default), `w-3.5 h-3.5` (compact metrics), `w-3 h-3` (checkbox check)
- Style: stroke-based (lucide defaults: `strokeWidth={2}`, `strokeLinecap="round"`, `strokeLinejoin="round"`)
- Color: `text-text-secondary` (inherits via `currentColor`)

No wrapper file — consumers import directly from `lucide-react` and `@icons-pack/react-simple-icons`. Pass `aria-hidden="true"` on each usage.

In `.astro` components use **@lucide/astro** with per-icon deep imports (`import Copy from "@lucide/astro/icons/copy"`); never the barrel import, which compiles every icon.

Icons used: `Search`, `SlidersHorizontal`, `Terminal`, `Copy`, `Check`, `X`, `Lock`, `Star`, `Download`, `GitFork`, `CircleDot`, `ExternalLink`, `BadgeCheck`, `SiGithub`, `SiDocker`, custom logo.

### Logo

Custom SVG (download arrow + node network). Stroke: `#ededed`, strokeWidth `2.2`. Displayed at `w-6 h-6` in header.

---

## Animations & Transitions

| Pattern              | Class                                              | Duration | Usage                                                 |
| -------------------- | -------------------------------------------------- | -------- | ----------------------------------------------------- |
| Color change         | `transition-colors`                                | 150ms    | Hover text/border/background                          |
| All properties       | `transition-all`                                   | 150ms    | Card hover (bg + border)                              |
| Loading skeleton     | `animate-pulse`                                    | default  | Loading states                                        |
| Copy button feedback | (JS timeout)                                       | 2000ms   | Checkmark → clipboard revert                          |
| ASCII logo reveal    | `motion-safe:animate-ascii-reveal`                 | 250ms    | Home hero solid layer (`clip-path` wipe, `steps(40)`) |
| Typing cursor        | `motion-safe:animate-[blink_1s_step-end_infinite]` | 1s       | Hero command cursor (hidden with reduced motion)      |

---

## Form Elements

### Text Input (SearchBar)

```
w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface
text-text placeholder-text-secondary
focus:outline-none focus:border-accent transition-colors
```

Left-padded for search icon positioned with `absolute left-3.5 top-1/2 -translate-y-1/2`.

### Focus States

Keyboard focus is handled globally in `globals.css`:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

### Text Selection

```css
::selection {
  background: color-mix(in srgb, var(--color-accent) 30%, transparent);
}
```

---

## OG Image Generation

Dimensions: **1200 x 630px** (PNG).

| Element          | Style                                              |
| ---------------- | -------------------------------------------------- |
| Background       | `#0a0a0a` + radial accent gradient (top-right)\*   |
| Top bar          | 4px gradient `#3b82f6 → #2563eb → #3b82f6`         |
| Logo text        | Inter Bold 48px, `#ededed`                         |
| Beta badge       | `#3b82f6` bg, white text, 16px, rounded-full       |
| Heading          | Inter Bold 64px, `#ededed`, line-height 1.1        |
| Description      | Inter Regular 26px, `#a0a0a0`, line-height 1.4     |
| Category pills   | 14px, `#94a3b8` on `#1e293b`, rounded-full         |
| Transport badges | Stdio: `#4ade80`, Remote: `#c084fc`                |
| Code block       | `#111111` bg, `#ededed` text, `$` prompt `#3b82f6` |
| Domain           | 20px, `#a0a0a0`, bottom-right                      |

\* The glow is not part of the Satori element tree: `renderOGImage()` (`src/lib/og-image.tsx`) injects it into the SVG as a native `<radialGradient>`. A CSS `radial-gradient` (with the `overflow: hidden` it needs) makes Satori emit a pattern with full-canvas masks that is ~2.2× slower to render for the same pixels. Templates only need the `#0a0a0a` root background.

Fonts: `Inter-Bold.ttf` (700), `Inter-Regular.ttf` (400) loaded from `assets/`.

---

---

## New Page Patterns (2026-02-27)

### Category Pages (`/category/[slug]`)

Dedicated landing pages for each of the 14 server categories.

```
┌─────────────────────────────────────────┐
│ Home / Servers / {Category}             │  ← Breadcrumb
│                                         │
│ {Category} MCP Servers                  │  ← h1 with category count
│ Description of this category             │
│ 42 servers available                    │
├─────────────────────────────────────────┤
│ [Card] [Card] [Card]                    │  ← 3-col ServerCard grid
│ [Card] [Card] [Card]                    │
│ [Card] [Card]                           │
└─────────────────────────────────────────┘
```

- **Layout**: `max-w-6xl mx-auto px-6 py-12`
- **Server grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- **JSON-LD**: `CollectionPage` + `ItemList` of servers + `BreadcrumbList`
- **Breadcrumb styling**: `text-sm text-text-secondary hover:text-text`

### Guide Pages (`/guides/[app]`)

Per-app installation and configuration guides with generator metadata.

```
┌─────────────────────────────────────────┐
│ Home / Guides / VS Code                 │  ← Breadcrumb
│                                         │
│ Setting up MCP in VS Code               │  ← h1
│ A step-by-step guide to installing      │
│ and configuring MCP servers             │
├─────────────────────────────────────────┤
│ Overview                                │  ← h2 sections
│ VS Code supports both stdio and remote  │
│ servers via the built-in MCP client.    │
│                                         │
│ Quick Install                           │  ← Code block with copy
│ $ npx @getmcp/cli add github --app vscode
│                                         │
│ Configuration Format                    │
│ Config Path:  ~/.vscode/argv.json      │  ← dl grid metadata
│ Field Name:   mcp                       │
│ Root Key:     mcpServers                │
│                                         │
│ Sample Configuration                    │  ← Code block
│ { "mcp": { "mcpServers": { ... } } }    │
│                                         │
│ Prerequisites                           │  ← Checklist or paragraph
│ □ VS Code 1.80+                         │
│ □ MCP CLI installed                     │
│                                         │
│ Popular Servers for VS Code             │  ← Compact 2-col grid
│ [Server] [Server]                       │     (names + badges only)
│ [Server] [Server]                       │
│                                         │
│ Troubleshooting                         │  ← FAQ or common issues
│ Q: How do I enable MCP?                 │
│ A: Uncomment the mcp section...         │
│                                         │
│ Official Documentation                  │  ← External link
│ VS Code MCP Extension →                 │
└─────────────────────────────────────────┘
```

- **Layout**: `max-w-3xl mx-auto px-6 py-12`
- **Breadcrumb**: Link styled as `text-text-secondary hover:text-text text-sm`
- **Section spacing**: `mb-10` between major sections
- **Code blocks**: `rounded-lg border border-border bg-code-bg p-4 font-mono text-sm`
- **Metadata grid** (`dl`): `grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5 py-6 border-y border-border`
- **Related servers grid**: `grid grid-cols-1 md:grid-cols-2 gap-4`
- **JSON-LD**: `TechArticle` (author: "getmcp", about: "[App] MCP Configuration") + `BreadcrumbList`
- **Config metadata sourced from**: `packages/generators/src/<app-name>.ts` `AppMetadata` (configFileName, configPaths, docsUrl)

### /servers Index Page

Hub page for discovering all servers in the registry.

```
┌─────────────────────────────────────────┐
│ Home / Servers                          │  ← Breadcrumb
│                                         │
│ Discover MCP Servers                    │  ← h1
│ Browse all available servers across     │
│ 14 categories                           │
├─────────────────────────────────────────┤
│ 🔍 Search...     [All] [dev-tools] ...  │  ← SearchBar (reused)
│                                         │
│ Showing 142 servers                     │
│                                         │
│ [Card] [Card] [Card]                    │  ← Full 3-col grid
│ [Card] [Card] [Card]                    │
│ ...                                     │
└─────────────────────────────────────────┘
```

- **SearchBar reuse**: Full component with category filter pills
- **Server grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- **JSON-LD**: `CollectionPage` (name: "MCP Server Registry") + server `ItemList` + `BreadcrumbList`

### Mobile ConfigViewer Tabs

Responsive tab switching for app configuration display.

```
Desktop (md+):
 [Claude Desktop] [VS Code] [Cursor] ...  ← Flex pill buttons, visible on md+

Mobile (<md):
 ┌────────────────────────────┐
 │ Claude Desktop        [∨]  │  ← HTML select element
 └────────────────────────────┘
```

- **Mobile select**: `md:hidden` applied to `<select>` element
- **Desktop pills**: `hidden md:flex` on the radio `<fieldset>`
- **Sync**: `scripts/radio-panels.ts` keeps the select, the radios and the visible panel in sync; radios and select use `autocomplete="off"`
- **Preference storage**: saved under `getmcp-preferred-app` on change; `RestoreChoice.astro` restores it inline before first paint
- **Select styling**: `rounded-md border border-border bg-surface text-text p-2`
- **File**: `packages/web/src/components/ConfigViewer.astro`

### Search Filter Pills

Dual filter rows for category search and runtime/transport filtering.

```
Row 1 (Category pills):
 [All] [developer-tools] [web] [ai] [analytics] ...

Row 2 (Runtime + Transport filters):
 Runtime: [Node.js] [Python] [Go] [Rust] ...
 ─────────────────────────────────────────
 Transport: [Stdio] [Remote]
```

- **Filter rows**: Stacked on mobile, side-by-side on md+
- **Category pills**: `rounded-full border px-3 py-1.5 text-xs`
  - Active: `border-accent bg-accent/10 text-accent`
  - Inactive: `border-border text-text-secondary`
- **Separator between runtime/transport**: `<span className="w-px h-6 bg-border">` (or use `mx-2`)
- **Active filter count**: Shown in results text (e.g., "Showing 12 servers (3 filters)")
- **File**: `packages/web/src/components/SearchBar.tsx`

### Server Card Enrichment

Enhanced metadata display on server listing cards.

```
┌──────────────────────────────────┐
│ Server Name          [node.js]   │  ← Runtime badge pushed right
│                                  │
│ Description text about the       │  ← line-clamp-2
│ server's functionality...        │
│                                  │
│ [category] [tag]     by Author   │  ← Author pushed to right
│ ──────────────────────────────── │
│ [stdio]              $35/month   │  ← Transport badge + pricing
└──────────────────────────────────┘
```

- **Runtime badge**: `bg-surface-hover text-text-secondary font-mono text-xs px-2 py-0.5 rounded-full`
- **Author byline**: `text-xs text-text-secondary ml-auto` (absolute right on card, or flex justify-between)
- **Transport badge**: Existing `text-xs px-2 py-0.5 rounded-full font-medium` (green for stdio, purple for remote)
- **File**: `packages/web/src/components/ServerCard.tsx`

---

## Dependencies

| Package                      | Purpose                   |
| ---------------------------- | ------------------------- |
| `astro@^7.3.5`               | Framework (static output) |
| `@astrojs/react@^7.0.0`      | React islands             |
| `react@^19.3.0`              | UI library                |
| `tailwindcss@^4.3.3`         | CSS framework             |
| `@tailwindcss/vite@^4.3.3`   | Vite integration          |
| `satori` + `@resvg/resvg-js` | OG image generation       |

No UI component library (shadcn, Radix, etc.). All components are custom-built.
