# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Unfog is an AI-powered visual thinking tool that converts unstructured thoughts into editable clarity maps. Users describe a problem in natural language (any language), and AI generates a structured breakdown diagram with typed nodes (problem, cause, solution, context) and edges. Users refine the diagram, AI re-analyzes on every edit — creating a feedback loop.

Core loop: **DESCRIBE → VISUALIZE → REFINE → AI re-analyzes → repeat**

## Tech Stack

- **Runtime/Package Manager:** Bun
- **Framework:** Next.js 15 (App Router) with `src/` directory
- **Language:** TypeScript (strict mode)
- **Canvas:** @xyflow/react 12 (React Flow)
- **State:** Zustand 5
- **UI:** shadcn/ui + Tailwind CSS 4
- **Motion:** Framer Motion 11
- **Sound:** Tone.js 15 (synthesized audio, no sample files)
- **Auto-Layout:** @dagrejs/dagre (hierarchical top-to-bottom)
- **Icons:** Lucide React
- **AI:** Anthropic SDK — Claude claude-sonnet-4-20250514, temperature 0.3
- **Fonts:** Satoshi + General Sans (self-hosted .woff2 from Fontshare) + JetBrains Mono (fontsource)

## Commands

```bash
bun install          # Install dependencies
bun dev              # Dev server at localhost:3000
bun run build        # Production build
bun run lint         # ESLint
```

## Architecture

### Layout Zones

Three-zone editor layout (single-page app):
- **Header** — 52px height, logo + controls
- **Prompt Panel** (sidebar) — 320px fixed width, text input + generate button + prompt history
- **Canvas** — remaining space, React Flow with dot grid background

Entry: `/` redirects to `/canvas`

### Node System

Four semantic node types with distinct colors:
| Type | Color | Purpose |
|------|-------|---------|
| Problem | #EF4444 (red) | Pain points or symptoms |
| Cause | #F59E0B (amber) | Root causes |
| Solution | #5FE0C1 (teal) | Recommended actions |
| Context | #6366F1 (indigo) | Background info, constraints |

### AI Response Schema

```typescript
interface AnalysisResponse {
  summary: string;
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
}

interface AnalysisNode {
  id: string;
  type: 'problem' | 'cause' | 'solution' | 'context';
  label: string;        // 3-6 words
  description: string;  // 1-2 sentences
}

interface AnalysisEdge {
  source: string;
  target: string;
  label?: string;
}
```

AI runs server-side via Next.js route handler. For re-analysis, the full canvas state (nodes, edges, original prompt) is sent with context about user edits; AI returns a diff.

### Design Tokens

All colors, spacing, motion, and border values are CSS custom properties defined in `src/styles/globals.css`. No hardcoded colors — every component references tokens via Tailwind utilities (`bg-canvas`, `text-primary`, `border-border`) mapped in `tailwind.config.ts`.

Key values: canvas #0E1013, surface #16181D, elevated #1E2028, accent teal #5FE0C1.

### Motion Principles

"Breathing" metaphor — slow inhale, controlled exhale. No bouncing, no overshooting. Timings: 120ms hover, 350ms node appearance, 800ms AI thinking pulse. Respects `prefers-reduced-motion`.

### Sound Design

Tone.js synthesized audio (no sample files). Every interaction has a sound: node creation (rising tone), deletion (descending), edge connection (chord), AI generation start (sweep 400ms), AI completion (three-note ascending). All under 150ms except AI sweep. Master volume -20dB. User-toggleable, persisted in localStorage.

## Data Architecture (v0.1)

No database, no user accounts. Canvas state in browser memory. Optional JSON export/import via localStorage.

## Deployment

Vercel (free tier). AI API key is server-side only.

## Spec-Driven Development

The project follows a phased spec plan. Read the relevant spec file before implementing:
- `01_canvas_setup_SPEC.md` — Canvas, layout, fonts, design tokens, React Flow setup
- `02_node_system_SPEC.md` — Custom nodes, edges, Zustand canvas store
- `03_ai_analysis_SPEC.md` — Claude integration, prompt engineering, auto-layout
- `04_editing_loop_SPEC.md` — Inline editing, node CRUD, AI re-analysis
- `05_sound_polish_SPEC.md` — Sound engine, animations, landing page, deployment
