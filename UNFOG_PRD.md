# Unfog — Product Requirements Document

> **Version:** 1.0
> **Author:** Mohammad Shamchi
> **Date:** March 15, 2026
> **Status:** In Development (MVP)
> **Timeline:** 14-day sprint

---

## Executive Summary

Unfog is an AI-powered visual thinking tool that converts unstructured thoughts into editable clarity maps. Users describe any problem — business, personal, academic — in natural language (any language), and AI instantly generates a structured breakdown diagram showing problems, root causes, solutions, and connections.

Unlike chatbots that return walls of text, Unfog produces spatial, visual, editable maps. Users refine the diagram, and AI re-analyzes on every edit — creating a conversation loop that sharpens thinking until the problem is crystal clear.

**One-liner:** "ChatGPT gives you a wall of text. We give you clarity you can see."

---

## Problem Statement

### The Brain Fog Problem

Every day, millions of people face a common but underserved challenge: they know something is wrong, but they can't see the full picture. Business owners feel their company struggling but can't pinpoint why. Students stare at thesis requirements feeling overwhelmed. Developers juggle ten tasks without knowing where to start.

### Why Current Tools Fail

| Tool Category | What It Does | Why It Falls Short |
|---|---|---|
| AI Chatbots (ChatGPT, Claude chat) | Returns text answers | Walls of text don't create spatial understanding |
| Whiteboard tools (Miro, FigJam) | Manual diagramming | Requires users to already know the structure |
| Diagram tools (Lucidchart, draw.io) | Technical diagrams | Built for engineers, not for thinking |
| Project tools (Monday, Asana) | Task lists and boards | Lists organize work, not thoughts |
| Automation (n8n, Zapier) | Workflow automation | Solves execution, not diagnosis |

### The Gap

No tool takes raw, messy human thinking and converts it into a visual, editable structure using AI — then keeps refining it through a feedback loop. Unfog fills this gap.

---

## Target Users

### Primary Persona: "The Foggy Thinker"

Anyone experiencing cognitive overload who needs to externalize and organize their thinking.

| Segment | Example Scenario | Pain Level |
|---|---|---|
| Business owners | "Sales are down but I don't know why" | High — decisions stall without clarity |
| Students | "My thesis has 12 requirements and I'm lost" | High — paralysis leads to missed deadlines |
| Developers | "10 bugs, 3 features, no idea where to start" | Medium — wastes productive hours |
| Life decision makers | "Should I relocate? What are all the factors?" | High — emotional weight amplifies confusion |
| Freelancers | "Too many priorities, everything feels urgent" | Medium — leads to burnout |

### Secondary Persona: "The Strategic Organizer"

People who already think structurally but want AI to accelerate diagnosis.

| Segment | Example Scenario |
|---|---|
| Startup founders | Organizing messy ideas before a pitch deck |
| Managers | Mapping team problems before a difficult meeting |
| Consultants | Diagnosing client situations rapidly |

### Not Targeting (v1)

- Enterprise teams with existing process tools (Jira, Confluence)
- Developers needing code-level workflow automation
- Users requiring real-time collaboration

---

## Product Vision

### Core Loop

The entire product centers on one repeating loop:

```
DESCRIBE → VISUALIZE → REFINE → (AI re-analyzes) → repeat
```

1. **Describe** — User writes a messy description of their situation in any language
2. **Visualize** — AI generates a structured diagram with typed nodes (problem, cause, solution, context) and edges showing relationships
3. **Refine** — User edits nodes: changes labels, removes irrelevant items, adds missing context, changes node types
4. **Re-analyze** — AI processes the refined state and suggests improvements, new connections, or missing elements
5. **Repeat** — Loop continues until the user has clarity

This is not a one-shot generation. The magic is in the iterative refinement — the product feels alive because AI responds to every user edit.

### Multi-Language by Default

The AI engine accepts input in any language and responds in the same language. Node labels, descriptions, and the entire diagram speak the user's language. No translation layer — the AI natively handles this through prompt engineering.

---

## User Stories

### P0 — Must Have (MVP)

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-01 | Foggy thinker | Type a messy description of my problem | I can start the process without needing structure |
| US-02 | Foggy thinker | See an AI-generated diagram of my problem | I get instant visual clarity |
| US-03 | User | Edit node labels inline | I can correct or improve AI-generated text |
| US-04 | User | Delete nodes that aren't relevant | The diagram reflects my actual situation |
| US-05 | User | Change a node's type (problem → cause) | The semantic meaning stays accurate |
| US-06 | User | Trigger AI re-analysis after my edits | The diagram gets smarter with each refinement |
| US-07 | Non-English speaker | Write in my own language and see results in that language | The tool works for me without translation |
| US-08 | User | See clear visual distinction between problems, causes, solutions, and context | I can scan the diagram quickly |

### P1 — Should Have

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-09 | Returning user | See my previous prompts in a history sidebar | I can revisit earlier thinking sessions |
| US-10 | User | Hear subtle sounds when nodes are created/deleted | The experience feels polished and premium |
| US-11 | User | Toggle sound on/off | I can use the tool in quiet environments |
| US-12 | User | See smooth animations when nodes appear | The generation feels intentional, not jarring |
| US-13 | User | See a clear loading state during AI thinking | I know the system is working |

### P2 — Nice to Have

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| US-14 | User | Export my canvas state as JSON | I can save and reload my work |
| US-15 | New visitor | See a compelling landing page | I understand the product before trying it |

---

## Feature Specification

### 5.1 Canvas & Editor Layout

The app is a single-page editor with three zones:

| Zone | Width | Content |
|---|---|---|
| Header | Full width, 52px height | Logo, version badge, sound toggle |
| Prompt Panel (sidebar) | 320px fixed | Text input, generate button, prompt history |
| Canvas | Remaining space (flex) | React Flow canvas with dot grid, nodes, edges, controls |

The canvas uses a dark theme with a subtle dot grid background. Zoom, pan, and minimap controls are built in.

### 5.2 Node System

Four semantic node types, each with a distinct color and purpose:

| Type | Color | Icon | Purpose |
|---|---|---|---|
| Problem | Red (#EF4444) | ! | Pain point or symptom the user described |
| Cause | Amber (#F59E0B) | ? | Root cause or underlying issue |
| Solution | Teal (#5FE0C1) | → | Recommended action or fix |
| Context | Indigo (#6366F1) | i | Background info, constraint, or note |

Each node is a card with: type badge, editable label (3-6 words), AI-generated description (1-2 sentences), and quick actions (change type, delete) on hover.

### 5.3 AI Analysis Engine

**Provider:** Anthropic Claude API (server-side)
**Model:** claude-sonnet-4-20250514
**Temperature:** 0.3 (analytical, deterministic)

The AI receives the user's text input with a structured system prompt that instructs it to break down the input into problems, root causes, and solutions, returning a typed JSON schema of nodes and edges.

For re-analysis, the AI receives the full current canvas state (all nodes, edges, and the original prompt) with context about the user's edits, and returns a diff of updates.

### 5.4 Auto-Layout

Generated nodes are positioned automatically using the dagre graph layout algorithm (hierarchical, top-to-bottom). This ensures generated diagrams are readable without manual arrangement.

### 5.5 Sound Design

Synthesized audio feedback using Tone.js (no sample files, tiny bundle). Every interaction has a corresponding sound: node creation (rising tone), deletion (descending tone), edge connection (harmonic chord), AI generation start (ambient sweep), AI completion (three-note ascending).

All sounds are under 150ms except the AI sweep (400ms). Master volume at -20dB. Respects `prefers-reduced-motion`. User-toggleable with state persisted in localStorage.

---

## Technical Architecture

### Stack

| Layer | Technology | Rationale |
|---|---|---|
| Runtime / Package Manager | Bun | Fastest install and dev server for rapid 2-week build |
| Framework | Next.js 15 (App Router) | SSR, image optimization, API routes, Vercel deployment |
| Language | TypeScript (strict mode) | Type safety across the entire codebase |
| Canvas | @xyflow/react 12 (React Flow) | Production-grade node graph with dark mode support |
| State Management | Zustand 5 | Lightweight, devtools support, middleware |
| UI Components | shadcn/ui + Tailwind CSS 4 | Accessible, themeable, utility-first styling |
| Motion | Framer Motion 11 | Production animations with layout transitions |
| Sound | Tone.js 15 | Web Audio synthesis without sample loading |
| Auto-Layout | @dagrejs/dagre | Hierarchical graph positioning |
| Icons | Lucide React | Clean, tree-shakeable icon set |
| AI | Anthropic SDK | Claude API for problem analysis |
| Fonts | Satoshi + General Sans + JetBrains Mono | Premium typography (self-hosted from Fontshare) |

### Deployment

| Concern | Solution |
|---|---|
| Hosting | Vercel (free tier) |
| AI API | Claude API via Next.js route handler (server-side only) |
| Analytics | Vercel Analytics |
| Error Tracking | Console only (v0.1) |
| Domain | unfog.app or unfog.io |

### Data Architecture (v0.1)

No database. No user accounts. Canvas state lives in browser memory with optional JSON export/import via localStorage. This is intentional for the MVP — persistence and accounts are v0.2 scope.

---

## Design Language — "Quiet Luxury"

### Philosophy

The visual identity is inspired by walking into a high-end workspace at night. Calm, focused, precise. Every surface has a purpose. Nothing screams. The accent color catches your eye like a subtle neon sign reflected in glass.

### Color System

| Token | Hex | Usage |
|---|---|---|
| Canvas | #0E1013 | Deepest dark — main background |
| Surface | #16181D | Panels, sidebar |
| Elevated | #1E2028 | Nodes, cards, modals |
| Accent (Teal) | #5FE0C1 | Primary actions, active states |
| Text Primary | #E8E8ED | Main content |
| Text Secondary | #8B8D98 | Labels, hints |
| Text Muted | #555664 | Disabled, placeholders |

### Typography

| Role | Font | Weight |
|---|---|---|
| Display / Headlines | Satoshi | 500–700 |
| Body / UI | General Sans | 400–500 |
| Code / Node Labels | JetBrains Mono | 400 |

These fonts are deliberately chosen over defaults like Inter or Roboto to create a premium feel. Satoshi provides the geometric character of Linear-tier products. General Sans offers warmer readability than Inter for body text.

### Motion Principles

All animation follows a "breathing" metaphor: slow inhale, controlled exhale. No bouncing. No overshooting. Key timing: 120ms for hover feedback, 350ms for node appearance, 800ms for AI thinking pulse.

---

## Success Metrics

### MVP Launch (Day 14)

| Metric | Target | How Measured |
|---|---|---|
| Core loop functional | User can describe → visualize → refine → re-analyze | Manual QA |
| Generation time | Under 5 seconds from prompt to rendered diagram | Browser performance timing |
| Re-analysis accuracy | AI produces relevant updates in 8/10 test cases | Manual evaluation |
| Multi-language | Works correctly in English, Persian, Turkish, Spanish | Manual testing |
| Screenshot-worthy | 3 out of 5 test users say they would screenshot the result | User feedback |

### Post-Launch (30 days)

| Metric | Target | How Measured |
|---|---|---|
| Twitter/X impressions on launch tweet | 10K+ | Twitter Analytics |
| Unique visitors (first week) | 500+ | Vercel Analytics |
| Repeat usage (returned within 7 days) | 20%+ | Vercel Analytics |
| GitHub stars (if open-sourced) | 100+ in first month | GitHub |

---

## Build Plan

| Phase | Days | Deliverables |
|---|---|---|
| Foundation | 1–2 | Canvas, layout, fonts, design tokens, theme, React Flow setup |
| Nodes | 3–4 | Custom node components, edge design, Zustand canvas store |
| AI Core | 5–6 | Claude integration, prompt engineering, auto-layout with dagre |
| Editing | 7–8 | Inline text editing, node CRUD, type switching |
| Loop | 8–9 | AI re-analysis after edits, prompt history sidebar |
| Sound | 10 | Tone.js engine, all sound events, toggle |
| Polish | 11–12 | Loading states, error handling, animation refinement |
| Ship | 13–14 | Landing page, Vercel deploy, README, demo GIF, launch tweet |

---

## Scope Boundaries

### In Scope (v0.1)

Dark canvas with dot grid, editor layout, prompt panel, 4 custom node types, animated edges, AI analysis, auto-layout, inline editing, node CRUD, AI re-analysis loop, prompt history, sound engine, loading/thinking states, error handling, canvas export (JSON), landing page, deployment.

### Out of Scope (v0.2+)

User accounts/authentication, database persistence, sharing/collaboration, PDF/image export, module recommendations (Product #2: Business Blueprint), mobile responsive layout, light mode, localization UI, payment/subscription.

---

## Competitive Landscape

| Competitor | Approach | Unfog Advantage |
|---|---|---|
| ChatGPT / Claude Chat | Text-based Q&A | Visual, spatial, editable — not a wall of text |
| Miro / FigJam | Manual whiteboarding | AI generates the structure; user refines, not builds |
| Lucidchart / draw.io | Technical diagramming | Natural language input, any language, no technical skill needed |
| Monday.com / Asana | Task and project lists | Spatial thinking and visual connections vs. flat lists |
| n8n / Zapier | Workflow automation | Diagnosis and thinking, not execution and automation |

---

## Viral Strategy

### The Screenshot Test

Every feature decision passes one test: "Would someone screenshot this and share it?" The dark canvas with colorful semantic nodes, clean typography, and teal accents is designed to be screenshot-worthy. The generated diagram itself is the marketing.

### Organic Growth Loop

1. User creates a problem map
2. The output looks good enough to screenshot
3. They share on Twitter/LinkedIn: "This tool mapped my business problems in 30 seconds"
4. Their network sees the visual, asks "What tool is this?"
5. Link clicks drive new users — repeat

### Build in Public

Daily progress posts on Twitter/X throughout the 14-day build, with screenshots, GIFs, and video clips at each milestone. The build process itself generates content and audience.

---

## Platform Context

Unfog is Product #1 of the WorkflowOS platform. Once a user finishes mapping their problems, the natural next step is: "You've identified what's holding you back. Want to see which tools can solve these?" — leading into Product #2 (Business Blueprint). But for v0.1, Unfog stands completely alone.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI generation quality is inconsistent | Medium | High | Tight prompt engineering, temperature 0.3, structured JSON schema, manual evaluation of 10+ test cases |
| Fonts don't load correctly | Low | Medium | Self-hosted .woff2 with fallback chain, verified in Spec 01 checklist |
| React Flow performance with many nodes | Low | Medium | Limit initial generation to 8-12 nodes, lazy rendering for large graphs |
| 2-week timeline is too aggressive | Medium | High | Strict scope boundaries, "out of scope" list prevents feature creep, daily build-in-public accountability |
| No persistence frustrates users | Medium | Medium | JSON export/import as stopgap, clear messaging that accounts come in v0.2 |
| Claude API costs during development | Low | Low | Low temperature reduces token usage, development uses small test inputs |

---

## Appendices

### A. AI Response Schema

```typescript
interface AnalysisResponse {
  summary: string;
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
}

interface AnalysisNode {
  id: string;
  type: 'problem' | 'cause' | 'solution' | 'context';
  label: string;
  description: string;
}

interface AnalysisEdge {
  source: string;
  target: string;
  label?: string;
}
```

### B. Spec Plan Index

| # | Spec | Coverage |
|---|---|---|
| 01 | Canvas + Layout + Theme Setup | Days 1–2 |
| 02 | Node System + Edges | Days 3–4 |
| 03 | AI Analysis + Auto-Layout | Days 5–6 |
| 04 | Editing + Re-Analysis Loop | Days 7–9 |
| 05 | Sound + Polish + Ship | Days 10–14 |

---

*Document version 1.0 — March 15, 2026*
*Author: Mohammad Shamchi*
*Product: Unfog (WorkflowOS Product #1)*
