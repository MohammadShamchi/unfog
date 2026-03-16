# Unfog — Complete App Context for AI Collaboration

> **Use this document to:** Brainstorm features, plan development, discuss architecture, or onboard any AI assistant to work on this project.

---

## 1. What is Unfog?

**One-liner:** "ChatGPT gives you a wall of text. We give you clarity you can see."

Unfog is an AI-powered visual thinking tool that converts unstructured thoughts into editable clarity maps. Users describe any problem in natural language (any language), and AI generates a structured breakdown diagram showing problems, root causes, solutions, and connections.

**The Core Loop:**
```
DESCRIBE → VISUALIZE → REFINE → (AI re-analyzes) → repeat
```

Unlike chatbots that return walls of text, Unfog produces spatial, visual, editable maps. Users refine the diagram, and AI re-analyzes on every edit — creating a conversation loop that sharpens thinking until the problem is crystal clear.

---

## 2. Target Users

### Primary: "The Foggy Thinker"
Anyone experiencing cognitive overload who needs to externalize and organize their thinking.

| Segment | Example Scenario |
|---------|------------------|
| Business owners | "Sales are down but I don't know why" |
| Students | "My thesis has 12 requirements and I'm lost" |
| Developers | "10 bugs, 3 features, no idea where to start" |
| Life decision makers | "Should I relocate? What are all the factors?" |
| Freelancers | "Too many priorities, everything feels urgent" |

### Secondary: "The Strategic Organizer"
- Startup founders organizing messy ideas before a pitch deck
- Managers mapping team problems before difficult meetings
- Consultants diagnosing client situations rapidly

---

## 3. Current Feature Set (Implemented)

### Core Features
| Feature | Description |
|---------|-------------|
| **Multi-round Intake** | AI asks follow-up questions before generating (max 2 rounds, 3 questions each) |
| **Typed Nodes** | 4 semantic types: Problem (red), Cause (amber), Solution (teal), Context (indigo) |
| **Ghost Suggestions** | "Have you considered...?" nodes that appear after analysis (accept/dismiss) |
| **Focus Mode** | Dim unrelated nodes, highlight the selected branch (press `F`) |
| **Canvas Chat** | Conversational AI with full graph context |
| **Explore Node** | Expand any node with 2-4 child nodes |
| **Multi-provider AI** | Gemini, OpenAI, Claude, OpenRouter — user-configurable |
| **Synthesized Sound** | Tone.js audio feedback for every interaction |
| **Undo/Redo** | 30 snapshots of canvas state |
| **Inline Editing** | Double-click to edit node labels |
| **Auto-layout** | Dagre algorithm for hierarchical positioning |

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Double-click | Edit node text |
| Backspace / Delete | Delete selected |
| `Cmd Z` | Undo |
| `Cmd Shift Z` | Redo |
| `F` | Focus on selected branch |
| `Escape` | Exit focus mode |
| `?` | Show shortcuts |
| `Cmd ,` | AI Settings |

---

## 4. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | Bun | Fastest install and dev server |
| **Framework** | Next.js 16 (App Router) | SSR, API routes, Vercel deployment |
| **Language** | TypeScript (strict) | Type safety across codebase |
| **Canvas** | @xyflow/react 12 (React Flow) | Production-grade node graphs |
| **State** | Zustand 5 | Lightweight, devtools support |
| **UI** | shadcn/ui + Tailwind CSS 4 | Accessible, themeable |
| **Motion** | Framer Motion 12 | Layout transitions |
| **Sound** | Tone.js 15 | Web Audio synthesis |
| **Auto-layout** | @dagrejs/dagre | Hierarchical positioning |
| **AI** | Multi-provider SDKs | Gemini, OpenAI, Anthropic, OpenRouter |

---

## 5. Architecture Overview

### Three-Zone Editor Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header (52px)                                               │
│  [Logo] [Version]                    [Sound] [Settings]      │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Prompt     │                                               │
│  Panel      │           Canvas (React Flow)                 │
│  (320px)    │                                               │
│             │     ┌─────┐      ┌─────┐                      │
│  [Input]    │     │     │──────│     │                      │
│  [History]  │     └─────┘      └─────┘                      │
│  [Chat]     │                                               │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### State Management (9 Zustand Stores)
| Store | Purpose |
|-------|---------|
| `canvas-store` | Nodes, edges, summary, selection, layout orchestration |
| `intake-store` | Multi-round questioning flow state |
| `ghost-store` | Ghost suggestions (up to 4), accept/dismiss |
| `focus-store` | Focus mode: focusedNodeId, branchNodeIds |
| `chat-store` | Conversation messages (last 8 kept in context) |
| `undo-store` | 30 snapshots of {nodes, edges} |
| `settings-store` | AI provider, API keys, model, temperature |
| `sound-store` | Sound toggle, Tone.js initialization |
| `history-store` | Prompt history (max 20, localStorage) |

### API Routes
| Route | Purpose |
|-------|---------|
| `POST /api/analyze` | Initial problem analysis → full graph |
| `POST /api/refine` | Diff-based re-analysis after user edits |
| `POST /api/assess` | Intake assessment — decides if follow-up needed |
| `POST /api/chat` | Canvas chat — conversational AI with graph context |
| `POST /api/explore` | Expand a node → generates 2-4 child nodes |
| `POST /api/suggest` | Ghost suggestions — "Have you considered...?" |
| `POST /api/models` | Fetches available models for a provider |

---

## 6. Data Models

### Node Types
```typescript
type NodeType = "problem" | "cause" | "solution" | "context";

const NODE_COLORS: Record<NodeType, string> = {
  problem:  "#EF4444",  // Red
  cause:    "#F59E0B",  // Amber
  solution: "#5FE0C1",  // Teal (accent)
  context:  "#6366F1",  // Indigo
};
```

### Core Types
```typescript
// What AI returns
interface AnalysisNode {
  id: string;           // "node_1", "node_2", etc.
  type: NodeType;
  label: string;        // 3-6 words
  description: string;  // 1-2 sentences
}

interface AnalysisEdge {
  source: string;
  target: string;
  label?: string;
}

interface AnalysisResponse {
  summary: string;
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
}

// Chat operations that AI can perform
interface ChatOperations {
  addNodes: AnalysisNode[];
  updateNodes: Array<{ id: string; label?: string; description?: string; type?: NodeType }>;
  removeNodeIds: string[];
  addEdges: AnalysisEdge[];
  removeEdges: Array<{ source: string; target: string }>;
}
```

### Intake System
```typescript
interface IntakeQuestion {
  id: string;
  question: string;
  options: string[];       // 2-4 selectable answers
  allowCustom: boolean;    // Show "Other" text input
}

interface IntakeAssessment {
  sufficient: boolean;     // true = skip to generation
  questions?: IntakeQuestion[];
}

// Max 2 rounds, max 3 questions per round
```

---

## 7. AI Provider System

### Multi-Provider Adapter Pattern
```
src/lib/ai/providers/
├── types.ts       # AIProviderAdapter interface
├── index.ts       # Factory: createProvider(config)
├── gemini.ts      # Google Gemini adapter
├── openai.ts      # OpenAI adapter
├── anthropic.ts   # Claude adapter
└── openrouter.ts  # OpenRouter adapter (300+ models)
```

### Configuration Priority
1. User settings (localStorage) — highest priority
2. Environment variables (fallback)
3. Default values — lowest priority

### AI Config Schema
```typescript
interface AIConfig {
  provider: "gemini" | "openai" | "anthropic" | "openrouter";
  apiKey: string;
  model: string;
  temperature: number;  // Default: 0.3 (analytical)
}
```

---

## 8. Design System — "Quiet Luxury"

### Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-canvas` | #0E1013 | Deepest dark — main background |
| `--bg-surface` | #16181D | Panels, sidebar |
| `--bg-elevated` | #1E2028 | Nodes, cards, modals |
| `--accent` | #5FE0C1 | Primary actions, active states |
| `--text-primary` | #E8E8ED | Main content |
| `--text-secondary` | #8B8D98 | Labels, hints |
| `--text-muted` | #555664 | Disabled, placeholders |

### Motion Principles
- **Metaphor:** "Breathing" — slow inhale, controlled exhale
- **No bouncing, no overshooting**
- **Timings:** 120ms hover, 350ms node appearance, 800ms AI thinking pulse
- **Respects:** `prefers-reduced-motion`

### Typography
| Role | Font |
|------|------|
| Display | Satoshi (500–700) |
| Body | General Sans (400–500) |
| Code/Labels | JetBrains Mono (400) |

---

## 9. File Structure

```
src/
├── app/
│   ├── api/              # API routes (analyze, chat, explore, etc.)
│   ├── canvas/           # Main editor page
│   ├── layout.tsx
│   └── page.tsx          # Landing page
├── components/
│   ├── canvas/           # Canvas components (nodes, edges, overlays)
│   ├── landing/          # Landing page components
│   ├── layout/           # Header, EditorLayout
│   ├── panels/           # PromptPanel, NodeInspector, CanvasChat
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/
│   ├── ai/               # AI functions, prompts, providers
│   ├── export/           # Canvas export utilities
│   ├── graph/            # Graph traversal (BFS/DFS)
│   ├── layout/           # Dagre auto-layout
│   └── sound/            # Tone.js sound engine
├── stores/               # Zustand stores (9 stores)
├── styles/               # Global CSS, design tokens
└── types/                # TypeScript type definitions

docs/
├── UNFOG_PRD.md                    # Product Requirements Document
├── 01_canvas_setup_SPEC.md         # Canvas foundation spec
├── 01.5_ai_engine_config_SPEC.md   # AI configuration spec
├── 12_guided_intake_SPEC.md        # Multi-round intake spec
└── specs_14_to_17_living_canvas.md # Living canvas features
```

---

## 10. Development Status

### ✅ Completed (MVP)
- [x] Canvas setup with React Flow
- [x] AI engine with multi-provider support
- [x] Node system (4 types, colors, editing)
- [x] Auto-layout with Dagre
- [x] Guided intake (2 rounds max)
- [x] Ghost suggestions
- [x] Focus mode
- [x] Contextual canvas chat
- [x] Explore node (drill deeper)
- [x] Sound design (Tone.js)
- [x] Undo/redo system
- [x] Settings modal (AI provider config)

### 🚧 Out of Scope (v0.2+)
- [ ] User accounts/authentication
- [ ] Database persistence
- [ ] Real-time collaboration
- [ ] PDF/image export
- [ ] Mobile responsive layout
- [ ] Light mode
- [ ] Payment/subscription

---

## 11. Brainstorming Areas

Use these topics to brainstorm with any AI:

### A. Collaboration Features
- How might multiple users collaborate on the same canvas?
- Real-time cursors? Comments on nodes? Async sharing?
- Version control for diagrams?

### B. Export & Integration
- What export formats would be most valuable? (PDF, PNG, SVG, Markdown)
- Integration with project management tools? (Notion, Linear, Jira)
- API for external tools to generate diagrams?

### C. AI Enhancements
- What other AI operations could be useful?
  - Summarize branch
  - Find contradictions
  - Suggest priorities
  - Generate action items
  - Estimate effort/timeline
- Should AI suggest connections between existing nodes?

### D. Canvas Interactions
- What gestures/interactions are missing?
  - Multi-select for bulk operations?
  - Drag to connect nodes?
  - Swimlane layouts?
  - Freeform vs. structured modes?

### E. Templates & Workflows
- Should there be domain-specific templates?
  - Business model canvas
  - User journey map
  - Decision matrix
  - Root cause analysis (5 Whys)
  - SWOT analysis

### F. Data Persistence
- What's the right persistence model?
  - Local-first (IndexedDB)?
  - Cloud sync (Supabase/Firebase)?
  - Git-based storage?

### G. Mobile Experience
- How should the canvas work on mobile?
  - Touch-optimized interactions?
  - Simplified view mode?
  - Voice input prioritized?

### H. Accessibility
- How to make node graphs screen-reader friendly?
- Keyboard navigation improvements?
- High contrast mode?

---

## 12. Key Decisions to Discuss

| Decision | Current State | Options to Consider |
|----------|---------------|---------------------|
| **Persistence** | In-memory only, lost on refresh | LocalStorage, IndexedDB, Cloud |
| **Collaboration** | Single user only | Yjs CRDTs, Socket.io, Firebase |
| **Pricing** | Free, API keys user-provided | Freemium, subscription, usage-based |
| **Mobile** | Desktop-optimized | Responsive, native app, PWA |
| **AI Model** | User-configurable, default Gemini | Pro tier with better models |
| **Data Ownership** | User owns their data | Encryption, export guarantees |

---

## 13. Running the App

```bash
# Setup
git clone https://github.com/MohammadShamchi/unfog.git
cd unfog
bun install

# Configure
cp .env.example .env.local
# Add your GOOGLE_AI_API_KEY to .env.local

# Run
bun dev
# Open http://localhost:3000
```

---

## 14. Testing Checklist

When implementing new features, verify:

- [ ] Feature works with all 4 node types
- [ ] Feature works in both English and non-English (Persian/Turkish)
- [ ] Feature respects focus mode (if applicable)
- [ ] Feature is undoable (Cmd+Z)
- [ ] Feature has appropriate sound feedback
- [ ] Feature works with reduced motion preference
- [ ] Feature handles empty/error states gracefully
- [ ] Feature is keyboard accessible

---

*Document Version: 1.0*
*Project: Unfog (WorkflowOS Product #1)*
*Created: March 2026*
