# Spec 12: Guided Intake — AI-Powered Conversation Before Canvas

> **Project:** Unfog
> **Depends on:** Specs 01–11 complete
> **Goal:** When user input is vague or short, AI asks 2–3 targeted questions with selectable answers before generating the map. Detailed inputs skip straight to generation. Conversation trail shows in sidebar as a visible "thinking path."
> **Success Criteria:** Vague prompt → AI asks focused questions → user selects/types answers → sharper map. Detailed prompt → instant map (no change from current behavior). Entire conversation visible as a path in the sidebar.

---

## 1. The Concept

### Current Flow (Stays for Detailed Input)
```
User types detailed text → "Unfog this" → AI generates map
```

### New Flow (For Vague/Short Input)
```
User types vague text → "Unfog this" → AI assesses context
  → Enough context? → Generate map immediately (current behavior)
  → Not enough?     → Show 1–3 questions with selectable options
                      → User picks answers (or types custom)
                      → AI may ask 1 more round (max 2 rounds)
                      → Generate map with enriched context
```

### Key Rules
- **Max 2 rounds of questions.** Never more. The user came to see a map, not chat.
- **Max 3 questions per round.** Keep it fast.
- **Each question has 2–4 selectable options + a free-text "Other" option.** Reduce friction.
- **Detailed inputs (>100 words or AI deems sufficient) skip intake entirely.** Preserves the "wow in 5 seconds" moment.
- **The full conversation trail is visible in the sidebar** as a vertical path showing the progression.

---

## 2. Types

### 2.1 New Types

Add to `src/types/analysis.ts`:

```typescript
// ─── Intake question from AI ───
export interface IntakeQuestion {
  id: string;              // "q_1", "q_2", etc.
  question: string;        // The question text
  options: string[];       // 2-4 selectable answers
  allowCustom: boolean;    // Show "Other" text input
}

// ─── User's answer to a question ───
export interface IntakeAnswer {
  questionId: string;
  question: string;        // Store the question text for display
  answer: string;          // Selected option or custom text
  isCustom: boolean;       // Was this a custom "Other" answer
}

// ─── AI assessment response ───
export interface IntakeAssessment {
  sufficient: boolean;           // true = skip to generation
  questions?: IntakeQuestion[];  // 1-3 questions if not sufficient
  reasoning?: string;            // Why AI needs more info (internal, not shown)
}

// ─── Intake conversation state ───
export interface IntakeState {
  status: "idle" | "assessing" | "asking" | "answering" | "generating";
  rounds: IntakeRound[];         // Conversation history
  enrichedPrompt: string | null; // Final combined prompt for generation
}

export interface IntakeRound {
  questions: IntakeQuestion[];
  answers: IntakeAnswer[];
}
```

### 2.2 Extend AnalyzeRequest

```typescript
export interface AnalyzeRequest {
  prompt: string;
  intakeAnswers?: IntakeAnswer[];  // Attached context from intake
  language?: string;
}
```

---

## 3. AI Prompts

### 3.1 Assessment Prompt

Add to `src/lib/ai/prompts.ts`:

```typescript
export const INTAKE_ASSESSMENT_PROMPT = `You are an expert problem analyst preparing to create a visual clarity map. 

The user has described their situation. Your job: decide if you have enough context to create a useful, specific diagram, or if you need to ask 1-3 focused questions first.

RULES FOR DECIDING:
1. If the input is detailed enough to identify at least 3 specific problems/causes/solutions → mark as sufficient.
2. If the input is vague, uses general terms like "bad" or "mess" without specifics → mark as NOT sufficient.
3. If the input has fewer than 20 words → almost always NOT sufficient.
4. If the input mentions specific metrics, names, or concrete situations → likely sufficient.

RULES FOR QUESTIONS (when not sufficient):
1. Ask 1-3 questions maximum. Prefer fewer.
2. Each question must dig into a SPECIFIC gap in context — not generic.
3. Provide 2-4 concrete answer options per question. These should be realistic guesses based on what the user said.
4. Set allowCustom to true on every question (user can always type their own).
5. Questions must be in the SAME LANGUAGE as the user's input.
6. Options must be short (under 10 words each).
7. Questions should uncover: root causes, scale/severity, what they've already tried, or key constraints.

DO NOT ask:
- Generic questions like "Can you tell me more?"
- Questions about things they already clearly stated
- More than 3 questions

RESPOND IN THE SAME LANGUAGE AS THE USER'S INPUT.

OUTPUT FORMAT (JSON):
{
  "sufficient": false,
  "questions": [
    {
      "id": "q_1",
      "question": "What does 'bad sales' actually mean for you?",
      "options": ["No new leads coming in", "Leads come but don't convert", "Existing customers churning", "Price is too high"],
      "allowCustom": true
    }
  ],
  "reasoning": "User mentioned sales are bad but didn't specify whether the issue is lead generation, conversion, or retention."
}`;
```

### 3.2 Enriched Analysis Prompt

When generating after intake, prepend the conversation context:

```typescript
export function buildEnrichedPrompt(
  originalPrompt: string,
  rounds: IntakeRound[]
): string {
  let enriched = originalPrompt;

  if (rounds.length > 0) {
    enriched += "\n\n--- Additional context from clarifying questions ---\n";
    for (const round of rounds) {
      for (const answer of round.answers) {
        enriched += `\nQ: ${answer.question}\nA: ${answer.answer}\n`;
      }
    }
  }

  return enriched;
}
```

---

## 4. AI Functions

### 4.1 Assessment Function

Create `src/lib/ai/assess-intake.ts`:

```typescript
import { GoogleGenAI } from "@google/genai";
import { INTAKE_ASSESSMENT_PROMPT } from "./prompts";
import type { IntakeAssessment } from "@/types/analysis";

const assessmentSchema = {
  type: "object" as const,
  properties: {
    sufficient: { type: "boolean" as const },
    questions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          question: { type: "string" as const },
          options: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          allowCustom: { type: "boolean" as const },
        },
        required: ["id", "question", "options", "allowCustom"],
      },
    },
    reasoning: { type: "string" as const },
  },
  required: ["sufficient"],
};

export async function assessIntake(
  userPrompt: string
): Promise<IntakeAssessment> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not set");

  const client = new GoogleGenAI({ apiKey });
  const model = process.env.AI_MODEL || "gemini-2.5-flash";

  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    config: {
      systemInstruction: INTAKE_ASSESSMENT_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
      responseSchema: assessmentSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty assessment response");

  return JSON.parse(text);
}
```

### 4.2 API Route

Create `src/app/api/assess/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { assessIntake } from "@/lib/ai/assess-intake";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    // Short-circuit: if prompt is long enough, skip assessment
    const wordCount = prompt.trim().split(/\s+/).length;
    if (wordCount >= 50) {
      return NextResponse.json({
        success: true,
        data: { sufficient: true },
      });
    }

    const assessment = await assessIntake(prompt);

    // Cap questions at 3
    if (assessment.questions && assessment.questions.length > 3) {
      assessment.questions = assessment.questions.slice(0, 3);
    }

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error("[Unfog Intake] Error:", error);
    // On error, default to sufficient (don't block the user)
    return NextResponse.json({
      success: true,
      data: { sufficient: true },
    });
  }
}
```

**Key decision:** If assessment fails for any reason, default to `sufficient: true` and let the user generate immediately. Never block the core flow.

---

## 5. Store

### 5.1 Intake Store

Create `src/stores/intake-store.ts`:

```typescript
import { create } from "zustand";
import type {
  IntakeState,
  IntakeQuestion,
  IntakeAnswer,
  IntakeRound,
} from "@/types/analysis";

interface IntakeStore extends IntakeState {
  // Actions
  startAssessment: () => void;
  setQuestions: (questions: IntakeQuestion[]) => void;
  submitAnswers: (answers: IntakeAnswer[]) => void;
  setGenerating: () => void;
  setEnrichedPrompt: (prompt: string) => void;
  reset: () => void;

  // Computed
  getAllAnswers: () => IntakeAnswer[];
  isInIntake: () => boolean;
}

const initialState: IntakeState = {
  status: "idle",
  rounds: [],
  enrichedPrompt: null,
};

export const useIntakeStore = create<IntakeStore>((set, get) => ({
  ...initialState,

  startAssessment: () => set({ status: "assessing" }),

  setQuestions: (questions) =>
    set({
      status: "asking",
      rounds: [
        ...get().rounds,
        { questions, answers: [] },
      ],
    }),

  submitAnswers: (answers) => {
    const rounds = [...get().rounds];
    const currentRound = rounds[rounds.length - 1];
    if (currentRound) {
      currentRound.answers = answers;
    }
    set({ status: "answering", rounds });
  },

  setGenerating: () => set({ status: "generating" }),

  setEnrichedPrompt: (prompt) => set({ enrichedPrompt: prompt }),

  reset: () => set({ ...initialState }),

  getAllAnswers: () =>
    get().rounds.flatMap((r) => r.answers),

  isInIntake: () => {
    const s = get().status;
    return s === "assessing" || s === "asking" || s === "answering";
  },
}));
```

---

## 6. UI Components

### 6.1 IntakeQuestions Component

Create `src/components/panels/IntakeQuestions.tsx`:

```typescript
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronRight, MessageCircle } from "lucide-react";
import type { IntakeQuestion, IntakeAnswer } from "@/types/analysis";

interface IntakeQuestionsProps {
  questions: IntakeQuestion[];
  onSubmit: (answers: IntakeAnswer[]) => void;
  isSubmitting: boolean;
}

export function IntakeQuestions({
  questions,
  onSubmit,
  isSubmitting,
}: IntakeQuestionsProps) {
  // Track selected option per question (index or "custom")
  const [selections, setSelections] = useState<
    Record<string, { option: string | null; custom: string; showCustom: boolean }>
  >(
    Object.fromEntries(
      questions.map((q) => [
        q.id,
        { option: null, custom: "", showCustom: false },
      ])
    )
  );

  const allAnswered = questions.every(
    (q) =>
      selections[q.id]?.option !== null ||
      (selections[q.id]?.showCustom && selections[q.id]?.custom.trim())
  );

  function selectOption(questionId: string, option: string) {
    setSelections((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        option,
        showCustom: false,
      },
    }));
  }

  function toggleCustom(questionId: string) {
    setSelections((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        option: null,
        showCustom: true,
      },
    }));
  }

  function setCustomText(questionId: string, text: string) {
    setSelections((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        custom: text,
      },
    }));
  }

  function handleSubmit() {
    const answers: IntakeAnswer[] = questions.map((q) => {
      const sel = selections[q.id];
      const isCustom = sel.showCustom;
      return {
        questionId: q.id,
        question: q.question,
        answer: isCustom ? sel.custom.trim() : sel.option || "",
        isCustom,
      };
    });
    onSubmit(answers);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle size={14} className="text-accent" />
        <p className="text-xs font-display font-semibold text-accent">
          A few quick questions to sharpen your map
        </p>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => (
        <motion.div
          key={q.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qi * 0.1 + 0.1 }}
          className="flex flex-col gap-2"
        >
          <p className="text-xs font-body text-text-primary font-medium">
            {q.question}
          </p>

          {/* Selectable options */}
          <div className="flex flex-col gap-1.5">
            {q.options.map((opt) => {
              const isSelected = selections[q.id]?.option === opt;
              return (
                <button
                  key={opt}
                  onClick={() => selectOption(q.id, opt)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-body text-left transition-all duration-micro"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--accent-muted)"
                      : "var(--bg-elevated)",
                    border: `1px solid ${
                      isSelected ? "var(--accent)" : "var(--border)"
                    }`,
                    color: isSelected
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                  }}
                >
                  {isSelected && <Check size={12} />}
                  {opt}
                </button>
              );
            })}

            {/* "Other" option */}
            {q.allowCustom && (
              <>
                {!selections[q.id]?.showCustom ? (
                  <button
                    onClick={() => toggleCustom(q.id)}
                    className="px-3 py-2 rounded-md text-xs font-body text-text-muted text-left transition-all duration-micro"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px dashed var(--border)",
                    }}
                  >
                    Something else...
                  </button>
                ) : (
                  <Textarea
                    autoFocus
                    placeholder="Type your answer..."
                    value={selections[q.id]?.custom || ""}
                    onChange={(e) => setCustomText(q.id, e.target.value)}
                    className="min-h-[60px] resize-none text-xs"
                    style={{
                      backgroundColor: "var(--bg-elevated)",
                      borderColor: "var(--accent)",
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                )}
              </>
            )}
          </div>
        </motion.div>
      ))}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!allAnswered || isSubmitting}
        className="w-full gap-2 font-display text-sm font-semibold"
        style={{
          backgroundColor: allAnswered ? "var(--accent)" : "var(--bg-hover)",
          color: allAnswered ? "var(--bg-canvas)" : "var(--text-muted)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        <ChevronRight size={16} />
        {isSubmitting ? "Thinking..." : "Continue"}
      </Button>
    </motion.div>
  );
}
```

### 6.2 IntakeTrail Component

The conversation trail — shows in the sidebar as a vertical path of the Q&A progression.

Create `src/components/panels/IntakeTrail.tsx`:

```typescript
"use client";

import { motion } from "framer-motion";
import { MessageCircle, User, Check } from "lucide-react";
import { useIntakeStore } from "@/stores/intake-store";

export function IntakeTrail() {
  const rounds = useIntakeStore((s) => s.rounds);

  if (rounds.length === 0) return null;

  // Flatten all Q&A pairs into a linear trail
  const trail: Array<{
    type: "question" | "answer";
    text: string;
    roundIndex: number;
  }> = [];

  for (let ri = 0; ri < rounds.length; ri++) {
    const round = rounds[ri];
    for (let qi = 0; qi < round.questions.length; qi++) {
      trail.push({
        type: "question",
        text: round.questions[qi].question,
        roundIndex: ri,
      });
      if (round.answers[qi]) {
        trail.push({
          type: "answer",
          text: round.answers[qi].answer,
          roundIndex: ri,
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-0 relative">
      {/* Vertical line */}
      <div
        className="absolute left-[11px] top-3 bottom-3 w-px"
        style={{ backgroundColor: "var(--border)" }}
      />

      {trail.map((item, i) => (
        <motion.div
          key={`${item.type}-${i}`}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 py-1.5 relative"
        >
          {/* Dot on the line */}
          <div
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 z-10"
            style={{
              backgroundColor:
                item.type === "question"
                  ? "var(--bg-surface)"
                  : "var(--accent-muted)",
              border: `1px solid ${
                item.type === "question"
                  ? "var(--border)"
                  : "var(--accent)"
              }`,
            }}
          >
            {item.type === "question" ? (
              <MessageCircle size={10} className="text-text-muted" />
            ) : (
              <Check size={10} className="text-accent" />
            )}
          </div>

          {/* Text */}
          <p
            className="text-xs font-body leading-relaxed pt-0.5"
            style={{
              color:
                item.type === "question"
                  ? "var(--text-secondary)"
                  : "var(--text-primary)",
              fontWeight: item.type === "answer" ? 500 : 400,
            }}
          >
            {item.text}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
```

---

## 7. Integration into PromptPanel

### 7.1 Modified Flow in PromptPanel

The `handleSubmit` function changes from:

```
submit → call /api/analyze → render nodes
```

To:

```
submit → call /api/assess → sufficient?
  → yes: call /api/analyze → render nodes (same as before)
  → no:  show IntakeQuestions → user answers → assess again or generate
```

### 7.2 PromptPanel Changes

In `src/components/panels/PromptPanel.tsx`, add:

```typescript
import { useIntakeStore } from "@/stores/intake-store";
import { IntakeQuestions } from "./IntakeQuestions";
import { IntakeTrail } from "./IntakeTrail";
import { buildEnrichedPrompt } from "@/lib/ai/prompts";

// Inside the component:
const intakeStatus = useIntakeStore((s) => s.status);
const intakeRounds = useIntakeStore((s) => s.rounds);
const currentQuestions = intakeRounds[intakeRounds.length - 1]?.questions;
const isInIntake = useIntakeStore((s) => s.isInIntake());

// Modified handleSubmit:
async function handleSubmit() {
  if (!prompt.trim()) return;

  const intakeStore = useIntakeStore.getState();
  intakeStore.reset();
  intakeStore.startAssessment();

  try {
    // Step 1: Assess if we need intake
    const assessRes = await fetchWithRetry("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });
    const assessData = await assessRes.json();

    if (assessData.success && !assessData.data.sufficient && assessData.data.questions?.length) {
      // Show questions
      intakeStore.setQuestions(assessData.data.questions);
      return; // Wait for user answers
    }

    // Sufficient — generate directly
    intakeStore.setGenerating();
    await generateMap(prompt.trim());
    intakeStore.reset();

  } catch (error) {
    // On error, generate directly (don't block)
    intakeStore.setGenerating();
    await generateMap(prompt.trim());
    intakeStore.reset();
  }
}

// Handle intake answers
async function handleIntakeAnswers(answers: IntakeAnswer[]) {
  const intakeStore = useIntakeStore.getState();
  intakeStore.submitAnswers(answers);

  const rounds = intakeStore.rounds;
  const roundCount = rounds.length;

  // Max 2 rounds — after that, always generate
  if (roundCount >= 2) {
    const enriched = buildEnrichedPrompt(prompt.trim(), rounds);
    intakeStore.setEnrichedPrompt(enriched);
    intakeStore.setGenerating();
    await generateMap(enriched);
    intakeStore.reset();
    return;
  }

  // Assess again with enriched context
  intakeStore.startAssessment();
  try {
    const enriched = buildEnrichedPrompt(prompt.trim(), rounds);
    const assessRes = await fetchWithRetry("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: enriched }),
    });
    const assessData = await assessRes.json();

    if (assessData.success && !assessData.data.sufficient && assessData.data.questions?.length) {
      intakeStore.setQuestions(assessData.data.questions);
      return;
    }

    // Sufficient now — generate
    intakeStore.setEnrichedPrompt(enriched);
    intakeStore.setGenerating();
    await generateMap(enriched);
    intakeStore.reset();

  } catch {
    const enriched = buildEnrichedPrompt(prompt.trim(), rounds);
    intakeStore.setGenerating();
    await generateMap(enriched);
    intakeStore.reset();
  }
}

// Extract current generation logic into reusable function
async function generateMap(finalPrompt: string) {
  // ... existing generation logic from handleSubmit
  // Uses finalPrompt instead of prompt.trim()
}
```

### 7.3 Render in PromptPanel

Below the "Unfog this" button and summary card, add:

```tsx
{/* Intake trail — shows conversation path */}
{intakeRounds.length > 0 && (
  <div className="mt-3">
    <IntakeTrail />
  </div>
)}

{/* Intake questions — active Q&A */}
{intakeStatus === "asking" && currentQuestions && (
  <div className="mt-3">
    <IntakeQuestions
      questions={currentQuestions}
      onSubmit={handleIntakeAnswers}
      isSubmitting={intakeStatus === "answering"}
    />
  </div>
)}

{/* Assessment loading */}
{intakeStatus === "assessing" && (
  <div className="mt-3 flex items-center gap-2">
    <div
      className="w-2 h-2 rounded-full animate-pulse"
      style={{ backgroundColor: "var(--accent)" }}
    />
    <p className="text-xs text-text-muted font-body">
      Analyzing your input...
    </p>
  </div>
)}
```

---

## 8. Files Summary

### New Files

| File | Purpose |
|---|---|
| `src/types/analysis.ts` | Add IntakeQuestion, IntakeAnswer, IntakeAssessment, IntakeState, IntakeRound types |
| `src/lib/ai/assess-intake.ts` | AI assessment function |
| `src/lib/ai/prompts.ts` | Add INTAKE_ASSESSMENT_PROMPT, buildEnrichedPrompt() |
| `src/app/api/assess/route.ts` | Assessment API endpoint |
| `src/stores/intake-store.ts` | Conversation state management |
| `src/components/panels/IntakeQuestions.tsx` | Selectable Q&A UI |
| `src/components/panels/IntakeTrail.tsx` | Visual conversation path |

### Modified Files

| File | Changes |
|---|---|
| `src/components/panels/PromptPanel.tsx` | New handleSubmit flow, intake integration, render trail + questions |

---

## 9. Edge Cases

| Scenario | Behavior |
|---|---|
| User types 200 words of detail | Assessment returns `sufficient: true`, skips intake, generates immediately |
| User types "help me" | Assessment asks 2-3 questions |
| Assessment API fails | Default to `sufficient: true`, generate with what we have |
| User ignores options, clicks "Something else" for all | Works — custom text gets used |
| User submits empty "Other" text | "Continue" button stays disabled until all questions answered |
| Assessment returns 5 questions | Capped to 3 in API route |
| User clicks "New map" during intake | `intakeStore.reset()` + `resetCanvas()` clears everything |
| Second round assessment also says "not sufficient" | Generate anyway (max 2 rounds enforced) |
| Persian/Turkish input | Questions and options come back in the same language |

---

## 10. Cost Impact

Each intake adds 1 extra AI call (assessment). For the ~40% of inputs that are vague:

| Metric | Without Intake | With Intake |
|---|---|---|
| AI calls per generation | 1 | 1.4 average (0.4 × 1 extra assessment) |
| Cost per 1K generations | $2.60 | $3.16 |
| Quality improvement | Baseline | Significantly sharper maps for vague inputs |

The assessment call is small (~200 input tokens, ~300 output tokens) — about $0.001 per call. Negligible.

---

## 11. Verify

### Happy Path
- [ ] Type "sales are bad" → AI asks 2-3 focused questions
- [ ] Select answers for each question → click "Continue"
- [ ] Map generates with richer, more specific nodes than current behavior
- [ ] Conversation trail shows in sidebar as Q → A → Q → A path

### Skip Path
- [ ] Type detailed 100+ word description → generates immediately, no questions
- [ ] No intake trail visible

### Error Path
- [ ] Kill API → assessment fails → generates directly (no block)
- [ ] Slow network → assessment retries once → continues

### Multi-Language
- [ ] Type in Persian → questions come back in Persian, options in Persian
- [ ] Trail shows Persian text correctly (RTL handled by browser)

### Reset
- [ ] Click "New map" during intake → everything clears
- [ ] Start new prompt after intake → previous trail cleared

---

## 12. What NOT to Build Yet

- ❌ Branching question paths (always linear)
- ❌ Saving intake conversations to history
- ❌ Image/file upload as context
- ❌ Voice input
- ❌ Typing indicator animation for AI
- ❌ "Skip" button to bypass intake (user can just add more text and resubmit)

---

## 13. Future: Guided Mode Toggle

In v0.2, consider adding a toggle in settings:
- **Quick mode:** Always skip assessment, generate immediately
- **Guided mode:** Always assess first (current spec)

For v0.1, the hybrid approach (auto-detect based on input quality) is the right default.

---

*This transforms Unfog from "paste and hope" to "AI actually understands your problem before mapping it."*
*The key constraint: never more than 2 rounds, never more than 3 questions, never block the user from generating.*
