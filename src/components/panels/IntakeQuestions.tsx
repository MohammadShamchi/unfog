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