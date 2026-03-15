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
- **AI:** Multi-provider (Gemini, OpenAI, Anthropic, OpenRouter) — user-configurable via settings. Default fallback: Gemini with `GOOGLE_AI_API_KEY` env var
- **Fonts:** Satoshi + General Sans (self-hosted .woff2 from Fontshare) + JetBrains Mono (fontsource)

## Commands

```bash
bun install          # Install dependencies
bun dev              # Dev server at localhost:3000
bun run build        # Production build
bun run lint         # ESLint
```

No test runner is configured.

## Environment Variables

```bash
GOOGLE_AI_API_KEY=   # Default Gemini API key (server-side fallback when user hasn't configured a provider)
AI_MODEL=            # Default model (fallback; default="gemini-2.5-flash")
AI_TEMPERATURE=      # Default temperature (fallback; default=0.3)
```

User-provided config via the settings modal (stored in localStorage) takes precedence over env vars. API keys from settings are sent in request bodies to API routes.

## Architecture

### Entry Points

- `/` — Landing page (`LandingPage` component)
- `/canvas` — Main editor (`EditorLayout` → `Header` + `PromptPanel` + `ProblemCanvas`)

### Layout Zones

Three-zone editor layout (single-page app):
- **Header** — 52px height, logo + controls
- **Prompt Panel** (sidebar) — 320px, appears after first analysis. Contains prompt input, history, canvas chat
- **Canvas** — remaining space, React Flow with dot grid background

### Node System

All canvas nodes use a single React Flow type `"insight"` (`InsightNode`). The semantic type is in `data.nodeType`.

Four semantic types with distinct colors (defined in `NODE_COLORS` in `src/types/canvas.ts`):
| Type | Color | Purpose |
|------|-------|---------|
| Problem | #EF4444 (red) | Pain points or symptoms |
| Cause | #F59E0B (amber) | Root causes |
| Solution | #5FE0C1 (teal) | Recommended actions |
| Context | #6366F1 (indigo) | Background info, constraints |

A fifth visual type `"ghost"` is used for suggestion nodes (not persisted).

### AI Provider System

Multi-provider adapter pattern in `src/lib/ai/providers/`:
- `types.ts` — `AIProviderAdapter` interface with a single `generate()` method
- `index.ts` — Factory `createProvider(config)` that switches on provider name
- Individual adapters: `anthropic.ts`, `gemini.ts`, `openai.ts`, `openrouter.ts`

Each adapter handles JSON schema support differently: Gemini and OpenAI support native response schemas; Anthropic and OpenRouter inject the schema into the system prompt.

`src/lib/ai/client.ts` provides shared utilities: `createProviderFromConfig()`, `safeParseJSON()` (strips markdown fences), `generateWithBackoff()` (retry with exponential backoff), and compact serializers for nodes/edges.

### API Routes

All routes at `src/app/api/` accept `{ ...body, aiConfig? }` and pass config to lib functions. Fallback to env vars if no config.

| Route | Purpose |
|-------|---------|
| `POST /api/analyze` | Initial problem analysis → full graph |
| `POST /api/refine` | Diff-based re-analysis after user edits |
| `POST /api/assess` | Intake assessment — decides if prompt needs follow-up questions |
| `POST /api/chat` | Canvas chat — conversational AI with graph context |
| `POST /api/explore` | Expand a node — generates 2-4 child nodes |
| `POST /api/suggest` | Ghost suggestions — "Have you considered...?" nodes |
| `POST /api/models` | Fetches available models for a given provider |

### State Management (Zustand Stores)

Nine stores in `src/stores/`. Key interactions:

- **canvas-store** — Central state: nodes, edges, summary, originalPrompt, editHistory, selection. Orchestrates layout via dagre. `setAnalysis()` for initial load, `applyRefinement()` for diffs, `applyExploreResult()` and `applyChatOperations()` for incremental changes.
- **intake-store** — Multi-round questioning flow: idle → assessing → asking → answering → generating. Up to 2 rounds of follow-up questions before generating.
- **ghost-store** — Manages up to 4 suggestion nodes. `acceptGhost()` creates a real node; `dismissGhost()` adds topic to a never-re-suggest list.
- **focus-store** — Focus mode: `enterFocus(nodeId)` computes reachable branch via BFS, used to dim unrelated nodes and filter ghost suggestions.
- **chat-store** — Conversation messages with 3s send throttle. Keeps last 8 messages in context; older ones condensed.
- **undo-store** — Snapshot-based undo/redo (max 30 snapshots of `{nodes, edges}`).
- **settings-store** — AI provider, apiKey, model, temperature — all persisted to localStorage.
- **sound-store** — Sound toggle + Tone.js initialization state.
- **history-store** — Prompt history (max 20 entries, persisted to localStorage).

### Key Data Flows

**Initial analysis:** User submits prompt → `use-intake-handler` calls `/api/assess` → if insufficient, shows `IntakeQuestions` for up to 2 rounds → enriches prompt with answers → calls `/api/analyze` → `canvas-store.setAnalysis()` runs dagre layout → nodes appear on canvas.

**Refinement:** User edits nodes/edges (tracked in `editHistory` as typed `EditEvent` objects) → triggers `/api/refine` → returns diff (`addNodes`, `updateNodes`, `removeNodeIds`, `addEdges`, `removeEdges`) → `applyRefinement()` merges changes.

**Explore:** User selects node → toolbar "Explore" → `/api/explore` → returns 2-4 child nodes → `applyExploreResult()` incrementally lays out new nodes via `layoutNewNodes()`.

**Ghost suggestions:** After analysis completes (nodes go from 0 → >0), `use-ghost-suggestions` hook waits 1s then calls `/api/suggest` → `ghost-store.setGhosts()` → ghost nodes rendered on canvas.

### Design Tokens

All colors, spacing, motion, and border values are CSS custom properties defined in `src/styles/globals.css`. No hardcoded colors — every component references tokens via Tailwind utilities (`bg-canvas`, `text-primary`, `border-border`) mapped in `tailwind.config.ts`.

Key values: canvas #0E1013, surface #16181D, elevated #1E2028, accent teal #5FE0C1.

### Motion Principles

"Breathing" metaphor — slow inhale, controlled exhale. No bouncing, no overshooting. Timings: 120ms hover, 350ms node appearance, 800ms AI thinking pulse. Respects `prefers-reduced-motion`.

### Sound Design

Tone.js synthesized audio (no sample files) in `src/lib/sound/sound-engine.ts`. Every interaction type has a unique sound. All respect `enabled` flag. Master volume -20dB. User-toggleable, persisted in localStorage. Audio context initialized lazily on first user interaction.

### Graph Utilities

`src/lib/graph/` contains BFS/DFS traversal for the node graph:
- `get-branch.ts` — Bidirectional BFS from a node (used by focus mode)
- `causal-chain.ts` — `buildNodeGraphContext()` computes ancestors, descendants, and neighbors for a selected node, serialized into AI prompts for contextual chat

## Data Persistence (v0.1)

No database, no user accounts. Canvas state lives in browser memory (lost on reload). Settings, sound preference, and prompt history are persisted to localStorage under `unfog:*` keys.

## Deployment

Vercel (free tier). AI API keys are server-side only (env vars) or sent per-request from client settings.

## Spec Files

The project follows spec-driven development. Remaining spec files in the repo root:
- `01_canvas_setup_SPEC.md` — Canvas, layout, fonts, design tokens, React Flow setup
- `01.5_ai_engine_config_SPEC.md` — Multi-provider AI configuration
- `12_guided_intake_SPEC.md` — Multi-round intake questioning flow
