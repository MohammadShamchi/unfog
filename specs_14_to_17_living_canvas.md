# Specs 14–17: Living Canvas Features

> **Project:** Unfog
> **Depends on:** Specs 01–13 complete
> **Goal:** Transform Unfog from a static diagram generator into a living thinking environment where the user and AI collaborate continuously on the canvas.
> **Approach:** No code in these specs. Behavior, rules, files, and verification only.

---
---

# Spec 14: Dynamic Sidebar (Node Inspector)

> **Goal:** When a node is selected, the left sidebar transforms into a contextual inspector for that node. When nothing is selected, it shows the default prompt/history view.

---

## Concept

The sidebar has two modes:

| Mode | When | What Shows |
|---|---|---|
| **Default mode** | No node selected | Prompt textarea, "Unfog this" button, summary, intake trail, history, re-analyze |
| **Inspector mode** | One node selected | Node details, "Explore" button, contextual chat input, related nodes list, quick actions |

Switching between modes should be instant — no page transition, just a smooth content swap (fade or slide).

---

## Inspector Mode — What It Shows

### Section 1: Node Header
- Type badge (colored: Problem / Cause / Solution / Context)
- Node label (large, editable inline — click to edit)
- Node description (smaller, editable — click to edit)
- Type changer: row of 4 small buttons to switch type (same as current, but more accessible here)

### Section 2: Explore Button
- A prominent button: "Explore this deeper"
- When clicked: AI generates 2-4 child nodes specifically about this topic and connects them as sub-branches
- The new nodes appear below/around the selected node on the canvas
- This is the "Dig Deeper" functionality but without the fancy zoom effect — just smart sub-branching

### Section 3: Contextual Chat Input
- A small text input: "Ask about this node..."
- Whatever the user types here, AI receives with full context: the selected node's label, description, type, its connections, AND the overall map state
- AI response can be: new child nodes, updated description, new edges, or a text insight shown in the sidebar
- This is NOT a general chatbot — it's scoped to the selected node

### Section 4: Connections
- List of connected nodes (incoming and outgoing edges)
- Each shows: direction arrow (→ or ←), node label, edge label if exists
- Clicking a connected node selects it (navigates inspector to that node)

### Section 5: Quick Actions
- Delete node (with confirm)
- Duplicate node
- Disconnect all edges

---

## Behavior Rules

1. **Single selection only.** Inspector shows for exactly one node. Multi-select shows default mode.
2. **Click canvas background = deselect.** Returns to default mode.
3. **Edits in inspector sync to canvas immediately.** Change the label in inspector → node on canvas updates live.
4. **"Explore" is throttled.** Disable for 3 seconds after click to prevent spam. Show "Exploring..." state.
5. **Contextual chat remembers the conversation** for the current node (in memory, not persisted). Navigating to a different node clears the chat. This is intentional — each node gets a fresh context.
6. **Inspector scrolls independently** from the canvas. It's a fixed sidebar with its own scroll.
7. **Mobile:** Inspector replaces the bottom drawer content when a node is selected. Back button or deselect returns to prompt drawer.

---

## Files

| Action | File | Purpose |
|---|---|---|
| Create | `src/components/panels/NodeInspector.tsx` | The inspector panel component |
| Create | `src/components/panels/NodeContextChat.tsx` | Small chat input + responses for selected node |
| Create | `src/components/panels/ConnectionsList.tsx` | List of connected nodes |
| Modify | `src/components/panels/PromptPanel.tsx` | Wrap in conditional: show inspector when node selected, default otherwise |
| Modify | `src/stores/canvas-store.ts` | Add `selectedNodeId` state (may already exist from React Flow), add `exploreNode(nodeId)` action |
| Create | `src/app/api/explore/route.ts` | API endpoint for "Explore deeper" — takes a node + context, returns child nodes |
| Modify | `src/lib/ai/prompts.ts` | Add EXPLORE_SYSTEM_PROMPT for generating sub-branches |

---

## Verify

- [ ] Select a node → sidebar smoothly switches to inspector
- [ ] Click canvas background → sidebar returns to default mode
- [ ] Edit label in inspector → canvas node updates live
- [ ] "Explore this deeper" → 2-4 new child nodes appear connected to selected node
- [ ] Contextual chat input sends message with node context → AI responds with nodes or text
- [ ] Connections list shows all incoming/outgoing edges with labels
- [ ] Click a connected node in list → selects that node, inspector updates
- [ ] Mobile: inspector shows in bottom drawer when node selected
- [ ] Double-click explore disabled (throttled 3s)

---
---

# Spec 15: Contextual Chat (Post-Generation Conversation)

> **Goal:** After the map is generated, the user can keep talking to AI about the map. Messages are contextual — AI always knows the current state of the canvas.

---

## Concept

Currently after generation, the user's only option is "re-analyze" which rebuilds the whole map. This spec adds a persistent chat that lets the user make targeted requests:

- "اینو بازتر کن" (expand this)
- "یه نود اضافه کن برای استراتژی قیمت‌گذاری" (add a node for pricing strategy)
- "رابطه بین فروش و بازاریابی رو توضیح بده" (explain the relationship between sales and marketing)
- "این شاخه رو حذف کن" (delete this branch)

AI understands these because it has the full canvas state as context.

---

## Where It Lives

**Default mode (no node selected):** Chat input appears below the summary card, above history. Label: "Talk to your map..."

**Inspector mode (node selected):** Chat input is inside the inspector (Spec 14, Section 3). Label: "Ask about this node..."

Same component, different context injection.

---

## How Context Works

Every chat message sent to AI includes:

1. **The user's message** (what they just typed)
2. **The full canvas state** — all nodes (id, type, label, description) and edges (source, target, label)
3. **Selected node context** (if a node is selected) — which node is focused
4. **Conversation history** — previous messages in this chat session (max last 5 messages for token efficiency)

The AI system prompt instructs it to return one of:

- **Node operations:** add nodes, update nodes, delete nodes, add edges, remove edges
- **Text response:** an insight or explanation (shown in the chat area, not on canvas)
- **Both:** operations + explanation

---

## AI Response Format

The AI returns a JSON object:

```
{
  "message": "توضیح یا insight (نمایش در چت)",
  "operations": {
    "addNodes": [...],
    "updateNodes": [...],
    "removeNodeIds": [...],
    "addEdges": [...],
    "removeEdges": [...]
  }
}
```

- If `operations` is empty/null → only show the text message in chat
- If `operations` has content → apply changes to canvas AND show the message
- If `message` is empty → just apply operations silently

---

## Chat UI

- Messages appear as a minimal thread in the sidebar: user messages right-aligned (or with "You" label), AI messages left-aligned (or with "AI" label)
- Max 10 messages visible, older ones scroll up
- AI messages that resulted in canvas changes show a small indicator: "✓ 3 nodes added"
- Input is a single-line text input with send button (Enter to send)
- While AI is thinking: show a subtle pulsing dot, disable input

---

## Behavior Rules

1. **Chat is session-only.** Refreshing the page or clicking "New map" clears the chat. No persistence.
2. **Chat context includes the CURRENT canvas state**, not the original. So if the user has manually edited nodes, AI sees the edits.
3. **Max 5 messages in AI context window.** Older messages drop off. This prevents token cost from growing unbounded.
4. **Language follows the map.** If nodes are in Persian, AI responds in Persian. If English, English.
5. **Operations are applied with animation.** New nodes fade in, deleted nodes fade out — same as current re-analysis behavior.
6. **Each operation triggers an undo snapshot.** So Cmd+Z can reverse a chat-driven change.
7. **"Re-analyze" button stays as-is.** Chat is for targeted changes, re-analyze is for full rebuild. Both are useful.
8. **Rate limit: max 1 message per 3 seconds.** Prevent spam-clicking.

---

## Files

| Action | File | Purpose |
|---|---|---|
| Create | `src/components/panels/CanvasChat.tsx` | Chat thread UI + input |
| Create | `src/stores/chat-store.ts` | Chat messages state, history management |
| Create | `src/app/api/chat/route.ts` | Chat API endpoint — receives message + canvas state, returns operations + text |
| Create | `src/lib/ai/canvas-chat.ts` | AI function for conversational canvas manipulation |
| Modify | `src/lib/ai/prompts.ts` | Add CANVAS_CHAT_SYSTEM_PROMPT |
| Modify | `src/components/panels/PromptPanel.tsx` | Render CanvasChat below summary card when nodes exist |
| Modify | `src/stores/canvas-store.ts` | Add `applyChatOperations(ops)` action that handles add/update/remove from chat |

---

## Verify

- [ ] After generation, chat input appears in sidebar
- [ ] Type "add a node about pricing" → new node appears on canvas
- [ ] Type "اینو بازتر کن" with a node selected → child nodes added to that node
- [ ] Type "explain why these are connected" → text response in chat, no canvas changes
- [ ] AI responds in same language as the map
- [ ] Chat messages show in a thread with user/AI distinction
- [ ] Canvas changes from chat are undoable (Cmd+Z)
- [ ] Page refresh clears chat
- [ ] Max 5 messages sent as context to AI
- [ ] "New map" clears chat

---
---

# Spec 16: Ghost Nodes (AI Suggestions)

> **Goal:** After generating the map, AI proactively suggests additional nodes as faint "ghost" elements on the canvas edges. The user can accept or dismiss them with one click.

---

## Concept

After the initial map generates (and optionally after each re-analysis or chat operation), AI looks at the map and thinks: "What's missing? What hasn't the user considered?"

It generates 2-4 ghost nodes that appear as semi-transparent cards at the periphery of the canvas. Each ghost node has:

- A faint version of the normal node card (opacity ~0.4)
- A short question instead of a label: "آیا مشکل نقدینگی هم دارید؟" (Do you also have a cash flow problem?)
- Two buttons: ✓ (accept → becomes a real node) and ✕ (dismiss → fades away)

---

## When Ghosts Appear

| Trigger | Behavior |
|---|---|
| After initial generation | 2-4 ghosts appear around the edges of the map after a 1-second delay |
| After re-analysis | Existing ghosts cleared, new 2-3 ghosts generated |
| After chat adds nodes | 0-2 new ghosts if AI sees new gaps |
| User accepts a ghost | That ghost becomes real. AI may generate 1 replacement ghost. |
| User dismisses a ghost | Ghost fades out. No replacement. |

---

## Ghost Node Appearance

- Same card shape as regular nodes but with opacity 0.3-0.4
- Dashed border instead of solid
- Type is pre-assigned by AI (problem, cause, solution, context) — shown as faint badge
- Text is a question format: "Is [suggested topic] also a factor?" or "Have you considered [suggestion]?"
- Positioned by dagre in available space around existing nodes — should not overlap real nodes

---

## Accept Flow

1. User clicks ✓ on ghost node
2. Ghost animates: opacity 0.4 → 1.0, border dashed → solid, over 300ms
3. Node becomes a regular editable node with AI-generated label and description
4. AI auto-connects it to the most relevant existing node (with edge)
5. Sound: the "node created" tone plays
6. Undo snapshot taken before acceptance

---

## Dismiss Flow

1. User clicks ✕ on ghost node
2. Ghost fades out: opacity 0.4 → 0, scale 1.0 → 0.95, over 200ms
3. Node removed from canvas
4. Sound: soft dismiss sound (if one exists) or no sound
5. Dismissed ghost IDs stored in memory so AI doesn't suggest the same thing again in this session

---

## AI Prompt for Ghost Generation

The AI receives:
- Current canvas state (all nodes + edges)
- The original prompt
- List of previously dismissed ghost topics (to avoid repeats)

And returns:
- 2-4 suggested nodes with: suggested type, question text, full label (used if accepted), full description (used if accepted), and which existing node it would connect to

---

## Behavior Rules

1. **Max 4 ghosts visible at any time.** If 4 exist and user accepts one, AI may generate 1 more (up to 4 total).
2. **Ghosts don't block interaction.** They have lower z-index than real nodes. Clicking "through" a ghost to a real node behind it should work.
3. **Ghosts are NOT included in re-analysis context.** Only accepted (real) nodes are sent to AI for re-analysis.
4. **Ghosts are NOT included in export.** JSON export only includes real nodes.
5. **"New map" clears all ghosts.**
6. **Ghost generation is async and non-blocking.** The main map renders first, ghosts appear 1-2 seconds later. If ghost generation fails, nothing happens — no error shown.
7. **Ghost suggestions should be genuinely insightful**, not generic. The AI prompt should emphasize: suggest things the user probably hasn't thought of, based on patterns in their specific situation.
8. **Mobile:** Ghosts still appear but smaller. Accept/dismiss buttons must be touch-friendly (min 44px tap targets).

---

## Files

| Action | File | Purpose |
|---|---|---|
| Create | `src/components/nodes/GhostNode.tsx` | Ghost node component (faint card, ✓/✕ buttons) |
| Create | `src/stores/ghost-store.ts` | Ghost nodes state, accept/dismiss actions, dismissed IDs tracking |
| Create | `src/lib/ai/suggest-ghosts.ts` | AI function to generate ghost suggestions |
| Create | `src/app/api/suggest/route.ts` | API endpoint for ghost generation |
| Modify | `src/lib/ai/prompts.ts` | Add GHOST_SUGGESTION_PROMPT |
| Modify | `src/components/canvas/ProblemCanvas.tsx` | Render ghost nodes alongside real nodes, register GhostNode type |
| Modify | `src/stores/canvas-store.ts` | Add `acceptGhost(ghostId)` that converts ghost to real node + connects it |

---

## Verify

- [ ] After generation, 2-4 ghost nodes appear at canvas edges after 1s delay
- [ ] Ghosts are visually distinct: faint, dashed border, question text
- [ ] Click ✓ → ghost becomes real node with smooth animation + sound
- [ ] Click ✕ → ghost fades out
- [ ] Accepted ghost auto-connects to relevant existing node
- [ ] Ghost not included in export or re-analysis context
- [ ] Dismissed topic not suggested again in same session
- [ ] Max 4 ghosts visible at once
- [ ] Ghost generation failure = silent, no error shown
- [ ] "New map" clears all ghosts
- [ ] Mobile: accept/dismiss buttons are tappable (44px+)
- [ ] Undo reverses ghost acceptance

---
---

# Spec 17: Focus Mode

> **Goal:** When the canvas gets complex, let the user focus on one branch by dimming everything else. Chat and inspector scope to the focused branch only.

---

## Concept

User clicks a node and activates "Focus" (via a button in the inspector, or a keyboard shortcut like `F`). Everything not in that node's branch fades to very low opacity. The branch = the selected node + all nodes reachable by following edges in both directions (ancestors and descendants).

---

## What "Branch" Means

Starting from the focused node, traverse:
- **Upstream:** Follow edges backward (who connects TO this node?) — recursively
- **Downstream:** Follow edges forward (what does this node connect TO?) — recursively
- **Result:** A set of node IDs that form the "branch"

Everything NOT in this set gets dimmed.

---

## Visual Treatment

| Element | In Branch | Outside Branch |
|---|---|---|
| Nodes | Normal (opacity 1.0) | Opacity 0.15, no pointer events (can't click/drag) |
| Edges | Normal | Opacity 0.08 |
| Ghost nodes | Hidden entirely | Hidden entirely |
| Canvas background | Normal | Normal |

The focused node itself gets a subtle highlight — a teal glow ring (same as the current selected state, but slightly more prominent).

---

## Entering Focus Mode

Three ways to enter:
1. **Inspector button:** "Focus on this branch" button in Node Inspector (Spec 14)
2. **Keyboard shortcut:** Select a node + press `F`
3. **Right-click context menu (future):** Not in v0.1

When entering:
- Smooth transition: non-branch elements fade to dim over 300ms
- Sidebar switches to inspector for the focused node
- Chat input label changes to: "Talk about this branch..."
- Chat context only includes branch nodes (not the full map)

---

## Exiting Focus Mode

Three ways to exit:
1. **Press `Escape`**
2. **Click the "Exit focus" button** that appears in the top-center of the canvas (a small floating pill)
3. **Click "New map"**

When exiting:
- All elements fade back to full opacity over 300ms
- Sidebar returns to its previous state (inspector if node still selected, default otherwise)
- Chat context returns to full map

---

## Focus + Chat Integration

While in focus mode, the contextual chat (Spec 15) scopes to the branch:
- AI only receives nodes and edges within the branch
- User says "add more detail here" → AI adds nodes to the focused branch, not random parts of the map
- New nodes added during focus automatically become part of the branch (they're connected to branch nodes)

---

## Focus + Ghost Nodes

- Existing ghost nodes outside the branch are hidden during focus
- AI may generate 1-2 focus-specific ghosts: "In this branch, have you considered...?"
- These focus-ghosts disappear when exiting focus mode if not accepted

---

## Behavior Rules

1. **Only one focus at a time.** Focusing on a different node replaces the current focus.
2. **Dimmed nodes are non-interactive.** Can't select, drag, edit, or connect to them while in focus mode.
3. **Adding a new node during focus** automatically connects it to the focused branch (AI decides the best connection point).
4. **Focus state is not persisted.** Refresh = focus cleared.
5. **If the focused node is deleted**, exit focus mode automatically.
6. **Focus mode is indicated in the header**: a small "Focused: [node label]" pill badge, with an ✕ to exit.
7. **Keyboard shortcut `F`** only works when a node is selected and user is not typing in an input/textarea.
8. **Undo/redo works normally** during focus. If an undo removes a node that was part of the focused branch, recalculate the branch. If the focused node itself is undone, exit focus.

---

## Files

| Action | File | Purpose |
|---|---|---|
| Create | `src/stores/focus-store.ts` | Focus state: focusedNodeId, branchNodeIds, enter/exit actions |
| Create | `src/lib/graph/get-branch.ts` | Utility: given a nodeId and edges, return all reachable node IDs (up + downstream) |
| Modify | `src/components/canvas/ProblemCanvas.tsx` | Apply dim styles to non-branch nodes/edges when focus active |
| Modify | `src/components/nodes/BaseNode.tsx` | Accept `dimmed` prop, apply opacity + pointer-events-none |
| Modify | `src/components/canvas/LabeledEdge.tsx` | Accept `dimmed` prop, apply opacity |
| Modify | `src/components/panels/NodeInspector.tsx` | Add "Focus on this branch" button |
| Modify | `src/components/layout/Header.tsx` | Show "Focused: [label]" pill with exit button when focus active |
| Modify | `src/hooks/use-keyboard-shortcuts.ts` | Add `F` shortcut for focus toggle |
| Modify | `src/stores/chat-store.ts` | Filter canvas context to branch nodes when focus active |

---

## Verify

- [ ] Select node → click "Focus on this branch" → non-branch elements dim smoothly
- [ ] Only upstream + downstream connected nodes stay bright
- [ ] Dimmed nodes can't be clicked, dragged, or edited
- [ ] Press Escape → everything returns to normal
- [ ] Header shows "Focused: [label]" pill with ✕ button
- [ ] Chat during focus only sends branch context to AI
- [ ] New nodes added during focus connect to the branch
- [ ] `F` shortcut toggles focus when node selected
- [ ] Delete focused node → auto-exit focus
- [ ] Focus cleared on "New map"
- [ ] Ghost nodes outside branch hidden during focus
- [ ] Smooth 300ms transition in and out
- [ ] Mobile: "Focus on this branch" accessible in bottom drawer inspector

---
---

# Implementation Order

```
Spec 14 (Dynamic Sidebar)  →  Spec 15 (Contextual Chat)  →  Spec 16 (Ghost Nodes)  →  Spec 17 (Focus Mode)
```

**Why this order:**
- Spec 14 is the foundation — Inspector is needed for Explore, Chat, and Focus UI
- Spec 15 needs Inspector to scope chat to selected node
- Spec 16 is independent but benefits from chat (ghost acceptance can trigger chat context update)
- Spec 17 needs everything: Inspector (focus button), Chat (scoped context), and stable node interaction

**Critical shared files:**

| File | Specs |
|---|---|
| `canvas-store.ts` | 14, 15, 16 |
| `ProblemCanvas.tsx` | 14, 16, 17 |
| `PromptPanel.tsx` | 14, 15 |
| `prompts.ts` | 14, 15, 16 |
| `Header.tsx` | 17 |
| `use-keyboard-shortcuts.ts` | 17 |

---

*These 4 specs together transform Unfog from "generate a diagram" to "think with AI on a living canvas." The ghost nodes are the wow factor. The contextual chat is the utility. Focus mode is the philosophy.*
