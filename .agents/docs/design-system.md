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
| `--color-tag-text`       | `#94a3b8`                                      | Category tag text               |
| `--color-code-bg`        | `#1a1a2e`                                      | Code block background           |
| `--color-warning-bg`     | `color-mix(in srgb, #f59e0b 10%, transparent)` | Warning badge background        |
| `--color-warning-border` | `color-mix(in srgb, #f59e0b 20%, transparent)` | Warning box border              |
| `--color-warning-subtle` | `color-mix(in srgb, #f59e0b 5%, transparent)`  | Warning box background          |
| `--color-warning-light`  | `color-mix(in srgb, #f59e0b 80%, white)`       | Light amber (warning code text) |

### Depth Layering (no shadows)

```
bg (#0a0a0a)  →  surface (#141414)  →  surface-hover (#1c1c1c)
                                        code-bg (#1a1a2e)
```

---

## Fonts

### Web (system stack)

```css
font-family:
  system-ui,
  -apple-system,
  sans-serif;
```

No custom web fonts are loaded. Monospace for code uses the browser default via `font-mono`.

### OG Images (Inter)

Font files in `packages/web/assets/`:

- `Inter-Regular.ttf` (400)
- `Inter-SemiBold.ttf` (600)
- `Inter-Bold.ttf` (700)

Used exclusively for `next/og` ImageResponse generation.

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
| Server detail   | `max-w-4xl mx-auto px-6` |
| Install command | `max-w-xl mx-auto`       |

### Responsive Breakpoints (Tailwind defaults)

| Breakpoint | Width  | Usage               |
| ---------- | ------ | ------------------- |
| `sm`       | 640px  | Metadata grid 2-col |
| `md`       | 768px  | Server grid 2-col   |
| `lg`       | 1024px | Server grid 3-col   |

### Grid Patterns

- **Server grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- **Metadata grid**: `grid grid-cols-1 sm:grid-cols-2 gap-4`

### Spacing Conventions

- Page vertical padding: `py-10` (homepage, detail) or `py-16` (docs)
- Section spacing: `mb-8` between major sections
- Component internal: `p-3` to `p-5`
- Flex gaps: `gap-1.5` (tabs), `gap-2` to `gap-4` (content), `gap-6` (nav links)

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
│  [category] [category]     [ENV_VAR]    │  ← tags + env badge
│  by Author Name                         │  ← text-xs text-text-secondary
└─────────────────────────────────────────┘
```

- Container: `rounded-lg border border-border bg-surface p-5`
- Hover: `hover:bg-surface-hover hover:border-accent transition-all`

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

**File**: `components/ConfigViewer.tsx`

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

- Tab active: `border-accent bg-accent text-white`
- Tab inactive: `border-border text-text-secondary`
- Code container: `rounded-lg border border-border bg-code-bg`

### PackageManagerCommand

**File**: `components/PackageManagerCommand.tsx`

```
 ┌──────────────────────────────────────┐
 │  > [pnpm] [npm] [yarn] [bun] [copy] │  ← header with PM tabs
 ├──────────────────────────────────────┤
 │  npx @getmcp/cli add github          │  ← command text
 └──────────────────────────────────────┘
```

- PM tab active: `bg-surface text-text`
- PM tab inactive: `text-text-secondary hover:text-text`

### MetaItem

**File**: `components/MetaItem.tsx`

```
 ┌──────────────────┐
 │  Label            │  ← text-xs text-text-secondary
 │  Value            │  ← text-sm (optional font-mono)
 └──────────────────┘
```

- Container: `rounded-lg border border-border bg-surface p-3`

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

- Box: `rounded-lg border border-warning-border bg-warning-subtle p-4`

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
text-text-secondary hover:text-text transition-colors
→ text-success (copied state, reverts after 2s)
```

---

## Icons

No icon library. All icons are inline SVGs with consistent styling:

- Size: `w-4 h-4`
- Style: stroke-based (`fill="none"`, `strokeWidth={2}`, `strokeLinecap="round"`, `strokeLinejoin="round"`)
- Color: `text-text-secondary` (inherits via `currentColor`)

Icons used: search (magnifying glass), terminal (command prompt), clipboard (copy), checkmark (copied), custom logo.

### Logo

Custom SVG (download arrow + node network). Stroke: `#ededed`, strokeWidth `2.2`. Displayed at `w-6 h-6` in header.

---

## Animations & Transitions

| Pattern              | Class               | Duration | Usage                        |
| -------------------- | ------------------- | -------- | ---------------------------- |
| Color change         | `transition-colors` | 150ms    | Hover text/border/background |
| All properties       | `transition-all`    | 150ms    | Card hover (bg + border)     |
| Loading skeleton     | `animate-pulse`     | default  | Loading states               |
| Copy button feedback | (JS timeout)        | 2000ms   | Checkmark → clipboard revert |

---

## Form Elements

### Text Input (SearchBar)

```
w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface
text-text placeholder-text-secondary
focus:outline-none focus:border-accent transition-colors
```

Left-padded for search icon positioned with `absolute left-3 top-1/2 -translate-y-1/2`.

---

## OG Image Generation

Dimensions: **1200 x 630px** (PNG).

| Element          | Style                                              |
| ---------------- | -------------------------------------------------- |
| Background       | `#0a0a0a` + radial accent gradient (top-right)     |
| Top bar          | 4px gradient `#3b82f6 → #2563eb → #3b82f6`         |
| Logo text        | Inter Bold 48px, `#ededed`                         |
| Beta badge       | `#3b82f6` bg, white text, 16px, rounded-full       |
| Heading          | Inter Bold 64px, `#ededed`, line-height 1.1        |
| Description      | Inter Regular 26px, `#a0a0a0`, line-height 1.4     |
| Category pills   | 14px, `#94a3b8` on `#1e293b`, rounded-full         |
| Transport badges | Stdio: `#4ade80`, Remote: `#c084fc`                |
| Code block       | `#1a1a2e` bg, `#ededed` text, `$` prompt `#3b82f6` |
| Domain           | 20px, `#a0a0a0`, bottom-right                      |

Fonts: `Inter-Bold.ttf` (700), `Inter-Regular.ttf` (400) loaded from `assets/`.

---

## Dependencies

| Package                       | Purpose                     |
| ----------------------------- | --------------------------- |
| `next@^16.1.6`                | Framework (App Router)      |
| `react@^19.2.4`               | UI library                  |
| `tailwindcss@^4.0.0`          | CSS framework               |
| `@tailwindcss/postcss@^4.0.0` | PostCSS integration         |
| `lightningcss@^1.30.0`        | CSS processing              |
| `babel-plugin-react-compiler` | React Compiler optimization |

No UI component library (shadcn, Radix, etc.). All components are custom-built.
