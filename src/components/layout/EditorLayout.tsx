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
