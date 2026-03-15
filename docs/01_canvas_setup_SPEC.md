# Spec 01 — Canvas + Layout + Theme Setup

> **Project:** Unfog
> **Phase:** Foundation (Days 1–2)
> **Goal:** A running app with dark canvas, dot grid, editor layout, correct fonts, and all design tokens wired up.
> **Success Criteria:** Open `localhost:3000/canvas` → see dark editor with dot grid, sidebar, header, and correct typography. No functionality yet — just the shell.

---

## 1. Project Scaffold

### 1.1 Init Commands

```bash
# Create Next.js project with Bun
bun create next-app unfog --typescript --tailwind --app --src-dir --eslint

cd unfog

# Core dependencies
bun add @xyflow/react zustand framer-motion tone lucide-react @dagrejs/dagre

# Dev dependencies
bun add -d @types/node

# shadcn/ui init
bunx --bun shadcn@latest init
```

**shadcn/ui init answers:**
- Style: Default
- Base color: Slate (we override everything anyway)
- CSS variables: Yes
- Tailwind CSS config: `tailwind.config.ts`
- Components alias: `@/components/ui`

**Install these shadcn components immediately:**

```bash
bunx --bun shadcn@latest add button textarea badge dropdown-menu tooltip
```

### 1.2 Folder Structure (Day 1 Only)

Only create what you need for this spec. Don't create empty placeholder files.

```
src/
├── app/
│   ├── layout.tsx              # Root layout — fonts, theme provider
│   ├── page.tsx                # Redirect to /canvas
│   └── canvas/
│       └── page.tsx            # Main editor page
│
├── components/
│   ├── canvas/
│   │   ├── ProblemCanvas.tsx   # React Flow wrapper
│   │   └── DotGridBackground.tsx
│   │
│   ├── layout/
│   │   ├── Header.tsx          # Top bar
│   │   └── EditorLayout.tsx    # Sidebar + canvas composition
│   │
│   ├── panels/
│   │   └── PromptPanel.tsx     # Left sidebar (static shell only)
│   │
│   └── ui/                     # shadcn components (auto-generated)
│
├── styles/
│   └── globals.css             # Design tokens + React Flow overrides
│
└── lib/
    └── utils.ts                # cn() helper (shadcn generates this)
```

### 1.3 TypeScript Config

In `tsconfig.json`, verify these are set:

```json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 2. Design Tokens

### 2.1 CSS Custom Properties

Add to `src/styles/globals.css` — these are the **single source of truth** for the entire app. Every component references these. No hardcoded colors anywhere.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ========== BACKGROUNDS ========== */
    --bg-canvas: #0E1013;
    --bg-surface: #16181D;
    --bg-elevated: #1E2028;
    --bg-hover: #252830;

    /* ========== ACCENT ========== */
    --accent: #5FE0C1;
    --accent-hover: #4BC5A8;
    --accent-muted: rgba(95, 224, 193, 0.10);
    --accent-glow: rgba(95, 224, 193, 0.20);

    /* ========== TEXT ========== */
    --text-primary: #E8E8ED;
    --text-secondary: #8B8D98;
    --text-muted: #555664;

    /* ========== SEMANTIC NODE COLORS ========== */
    --node-problem: #EF4444;
    --node-solution: #5FE0C1;
    --node-cause: #F59E0B;
    --node-context: #6366F1;

    /* ========== BORDERS ========== */
    --border: #2A2C35;
    --border-hover: #3A3C45;
    --border-active: #5FE0C1;

    /* ========== SPACING ========== */
    --sidebar-width: 320px;
    --header-height: 52px;
    --panel-padding: 20px;
    --node-min-width: 200px;
    --node-max-width: 280px;
    --canvas-gap: 60px;
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;

    /* ========== MOTION ========== */
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
    --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --duration-micro: 120ms;
    --duration-fast: 200ms;
    --duration-med: 350ms;
    --duration-slow: 500ms;
    --duration-breath: 800ms;

    /* ========== DOT GRID ========== */
    --dot-color: rgba(255, 255, 255, 0.05);
    --dot-size: 1px;
    --dot-gap: 24px;
  }
}
```

### 2.2 Tailwind Config Extension

In `tailwind.config.ts`, extend the theme to reference CSS variables so you can use classes like `bg-canvas`, `text-primary`, `border-border`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        "surface-hover": "var(--bg-hover)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          muted: "var(--accent-muted)",
          glow: "var(--accent-glow)",
        },
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "node-problem": "var(--node-problem)",
        "node-solution": "var(--node-solution)",
        "node-cause": "var(--node-cause)",
        "node-context": "var(--node-context)",
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        "border-active": "var(--border-active)",
      },
      spacing: {
        sidebar: "var(--sidebar-width)",
        header: "var(--header-height)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      fontFamily: {
        display: ['"Satoshi"', "system-ui", "sans-serif"],
        body: ['"General Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      transitionTimingFunction: {
        "ease-out-custom": "var(--ease-out)",
        "ease-in-out-custom": "var(--ease-in-out)",
        spring: "var(--spring)",
      },
      transitionDuration: {
        micro: "var(--duration-micro)",
        fast: "var(--duration-fast)",
        med: "var(--duration-med)",
        slow: "var(--duration-slow)",
        breath: "var(--duration-breath)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

**Note:** `tailwindcss-animate` is installed automatically by shadcn/ui init.

### 2.3 React Flow Theme Overrides

Append to `globals.css` after the `:root` block:

```css
/* ========== REACT FLOW OVERRIDES ========== */
.react-flow__background {
  background-color: var(--bg-canvas) !important;
}

.react-flow__edge-path {
  stroke: var(--border) !important;
  stroke-width: 1.5px;
}

.react-flow__edge-path:hover {
  stroke: var(--text-secondary) !important;
}

.react-flow__handle {
  width: 8px;
  height: 8px;
  background: var(--border);
  border: none;
}

.react-flow__handle:hover {
  background: var(--accent);
}

.react-flow__controls {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.react-flow__controls-button {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  fill: var(--text-secondary);
}

.react-flow__controls-button:hover {
  background: var(--bg-hover);
  fill: var(--text-primary);
}

.react-flow__minimap {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

/* Selection box */
.react-flow__selection {
  background: var(--accent-muted);
  border: 1px solid var(--accent);
}

/* Attribution — hide in dev, add proper credit in footer */
.react-flow__attribution {
  display: none;
}
```

---

## 3. Fonts

### 3.1 Installation

**Option A — Fontsource (preferred if available):**

```bash
bun add @fontsource-variable/jetbrains-mono
```

Satoshi and General Sans are **not on Fontsource**. Use Option B for those.

**Option B — Self-hosted from Fontshare (Satoshi + General Sans):**

1. Download from [fontshare.com](https://www.fontshare.com/):
   - Satoshi (Variable weight)
   - General Sans (Variable weight)
2. Place `.woff2` files in `public/fonts/`:

```
public/
└── fonts/
    ├── Satoshi-Variable.woff2
    ├── GeneralSans-Variable.woff2
    └── (italic variants if needed)
```

3. Add `@font-face` declarations to `globals.css` (inside `@layer base`):

```css
@font-face {
  font-family: "Satoshi";
  src: url("/fonts/Satoshi-Variable.woff2") format("woff2");
  font-weight: 400 700;
  font-display: swap;
  font-style: normal;
}

@font-face {
  font-family: "General Sans";
  src: url("/fonts/GeneralSans-Variable.woff2") format("woff2");
  font-weight: 400 500;
  font-display: swap;
  font-style: normal;
}
```

**JetBrains Mono** — import in `layout.tsx`:

```tsx
import "@fontsource-variable/jetbrains-mono";
```

### 3.2 Apply in Root Layout

```tsx
// src/app/layout.tsx
import "@/styles/globals.css";
import "@fontsource-variable/jetbrains-mono";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unfog — Dump your thoughts. See them clearly.",
  description:
    "An AI thinking partner that turns brain fog into visual clarity maps.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-body bg-canvas text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
```

### 3.3 Verification Checklist

After setup, open DevTools → Elements → Computed tab on:

| Element         | Expected Font    | Expected Weight |
|----------------|------------------|-----------------|
| `<h1>`          | Satoshi          | 600             |
| `<p>`           | General Sans     | 400             |
| Code/mono span  | JetBrains Mono   | 400             |

If any show `system-ui` → the font file isn't loading. Check path and `@font-face`.

---

## 4. Components

### 4.1 Root Page — Redirect

```tsx
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/canvas");
}
```

### 4.2 Canvas Page

```tsx
// src/app/canvas/page.tsx
import { EditorLayout } from "@/components/layout/EditorLayout";

export default function CanvasPage() {
  return <EditorLayout />;
}
```

### 4.3 EditorLayout

This is the main composition. Three zones: header, sidebar, canvas.

```tsx
// src/components/layout/EditorLayout.tsx
"use client";

import { Header } from "./Header";
import { PromptPanel } from "../panels/PromptPanel";
import { ProblemCanvas } from "../canvas/ProblemCanvas";

export function EditorLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      {/* Header — fixed 52px */}
      <Header />

      {/* Main area — sidebar + canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — fixed 320px */}
        <PromptPanel />

        {/* Canvas — fills remaining space */}
        <main className="relative flex-1">
          <ProblemCanvas />
        </main>
      </div>
    </div>
  );
}
```

### 4.4 Header

```tsx
// src/components/layout/Header.tsx
"use client";

import { Volume2 } from "lucide-react";

export function Header() {
  return (
    <header
      className="flex items-center justify-between border-b px-5"
      style={{
        height: "var(--header-height)",
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="font-display text-lg font-bold tracking-tight text-text-primary">
          unfog
        </span>
        <span className="text-xs font-body text-text-muted">v0.1</span>
      </div>

      {/* Right controls — placeholders */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-sm p-1.5 text-text-secondary transition-colors duration-micro hover:bg-surface-hover hover:text-text-primary"
          aria-label="Toggle sound"
        >
          <Volume2 size={18} />
        </button>
      </div>
    </header>
  );
}
```

### 4.5 PromptPanel (Static Shell)

No functionality yet — just the visual frame with a disabled text area and button.

```tsx
// src/components/panels/PromptPanel.tsx
"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function PromptPanel() {
  return (
    <aside
      className="flex flex-col border-r"
      style={{
        width: "var(--sidebar-width)",
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      {/* Input section */}
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-sm font-semibold text-text-primary mb-1">
            Describe your problem
          </h2>
          <p className="text-xs text-text-muted font-body">
            Write anything — in any language. AI will map it.
          </p>
        </div>

        <Textarea
          placeholder="I run a software company. Sales are bad, HR is a mess, and we're not shipping fast enough..."
          className="min-h-[140px] resize-none border-border bg-bg-elevated text-text-primary placeholder:text-text-muted font-body text-sm focus:border-accent focus:ring-1 focus:ring-accent-glow"
          style={{
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-elevated)",
          }}
          disabled
        />

        <Button
          className="w-full gap-2 font-display text-sm font-semibold"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--bg-canvas)",
            borderRadius: "var(--radius-sm)",
          }}
          disabled
        >
          <Sparkles size={16} />
          Unfog this
        </Button>
      </div>

      {/* Divider */}
      <div
        className="mx-5"
        style={{ borderTop: "1px solid var(--border)" }}
      />

      {/* History section — placeholder */}
      <div className="flex-1 overflow-y-auto p-5">
        <h3 className="font-display text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          History
        </h3>
        <p className="text-xs text-text-muted font-body">
          Previous prompts will appear here.
        </p>
      </div>
    </aside>
  );
}
```

### 4.6 DotGridBackground

Custom React Flow background using CSS radial-gradient (no SVG, lighter than the built-in `<Background />` component).

```tsx
// src/components/canvas/DotGridBackground.tsx
export function DotGridBackground() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(
          circle,
          var(--dot-color) var(--dot-size),
          transparent var(--dot-size)
        )`,
        backgroundSize: "var(--dot-gap) var(--dot-gap)",
      }}
    />
  );
}
```

### 4.7 ProblemCanvas

The React Flow wrapper. Empty canvas — no nodes/edges yet.

```tsx
// src/components/canvas/ProblemCanvas.tsx
"use client";

import {
  ReactFlow,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DotGridBackground } from "./DotGridBackground";

function CanvasInner() {
  return (
    <div className="h-full w-full" style={{ backgroundColor: "var(--bg-canvas)" }}>
      <ReactFlow
        nodes={[]}
        edges={[]}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <DotGridBackground />
        <Controls
          position="bottom-right"
          showInteractive={false}
        />
        <MiniMap
          position="bottom-left"
          nodeColor="var(--border)"
          maskColor="rgba(14, 16, 19, 0.8)"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        />
      </ReactFlow>
    </div>
  );
}

export function ProblemCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
```

---

## 5. Verification — "Day 1 Done" Checklist

Run `bun dev` and open `localhost:3000`. You should see:

| Check | What to Verify |
|-------|---------------|
| ✅ | Redirects from `/` to `/canvas` |
| ✅ | Dark background (#0E1013) covers entire viewport |
| ✅ | Dot grid visible on canvas (subtle white dots) |
| ✅ | Header bar at top — "unfog" in Satoshi bold, sound icon on right |
| ✅ | Left sidebar (320px) with text area, "Unfog this" teal button, history section |
| ✅ | Canvas fills remaining space with React Flow (zoom/pan works) |
| ✅ | MiniMap in bottom-left, Controls in bottom-right |
| ✅ | All text uses correct fonts (check DevTools Computed) |
| ✅ | No hydration errors in console |
| ✅ | No flash of unstyled content (fonts load with `font-display: swap`) |
| ✅ | Border between sidebar and canvas is `#2A2C35` (subtle, not harsh) |

**Screenshot test:** Does this look like a premium dark tool — not a default shadcn template? If the sidebar feels "gray" or "Bootstrap-y", your tokens aren't wired correctly.

---

## 6. Known Gotchas

| Issue | Fix |
|-------|-----|
| React Flow doesn't render | Make sure `ReactFlowProvider` wraps the component using hooks. Canvas component must have explicit `h-full w-full` and the parent must have a defined height. |
| Fonts show system-ui | Check `public/fonts/` paths. Open Network tab → filter by `.woff2` → verify they load with 200. |
| Tailwind classes like `bg-canvas` don't work | Verify `tailwind.config.ts` `extend.colors` references `var(--bg-canvas)`. Restart dev server after config changes. |
| Hydration mismatch | Every component that uses browser APIs or hooks must be `"use client"`. The layout stays as server component. |
| shadcn button styles conflict with your theme | Override via `className` and inline `style` for token-based colors. Don't fight shadcn defaults — layer on top. |
| Dot grid not visible | Increase `--dot-color` opacity temporarily (e.g., `rgba(255,255,255,0.15)`) to debug, then dial back to `0.05`. |

---

## 7. What NOT to Build Yet

Do not touch these in this spec — they belong to Spec 02+:

- ❌ Custom node components (Spec 02)
- ❌ Custom edge components (Spec 02)
- ❌ Zustand stores (Spec 02)
- ❌ AI integration / API routes (Spec 03)
- ❌ Tone.js / sound engine (Spec 05)
- ❌ Framer Motion animations beyond basic transitions (Spec 05)
- ❌ Landing page (Spec 05)
- ❌ Any data fetching or state management

---

## 8. Next Spec

When this spec is complete and verified:

→ **Create `02_node_system_SPEC.md`** — Custom node types, edge design, Zustand canvas store, node CRUD.

---

*Build Day 1: Scaffold + tokens + fonts + layout.*
*Build Day 2: React Flow canvas + dot grid + controls + polish the shell.*
*End of Day 2: Screenshot it. Tweet "Day 1: The canvas exists."*
