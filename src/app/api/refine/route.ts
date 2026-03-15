import { NextRequest, NextResponse } from "next/server";
import { refineProblem } from "@/lib/ai/refine-problem";
import { formatEditHistory } from "@/lib/format-edit-history";
import type { EditEvent } from "@/types/canvas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.originalPrompt || typeof body.originalPrompt !== "string") {
      return NextResponse.json(
        { error: "Missing original prompt" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.currentNodes) || body.currentNodes.length === 0) {
      return NextResponse.json(
        { error: "Missing current nodes" },
        { status: 400 }
      );
    }

    const editSummary =
      typeof body.userEdits === "string"
        ? body.userEdits
        : Array.isArray(body.editHistory)
          ? formatEditHistory(body.editHistory as EditEvent[])
          : "User made edits to the diagram.";

    const startTime = Date.now();
    const result = await refineProblem({
      originalPrompt: body.originalPrompt,
      currentNodes: body.currentNodes,
      currentEdges: body.currentEdges || [],
      editSummary,
    });
    const duration = Date.now() - startTime;

    console.log(
      `[Unfog AI Refine] +${result.addNodes.length} nodes, ~${result.updateNodes.length} updates, -${result.removeNodeIds.length} removed, ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        model: process.env.AI_MODEL || "gemini-2.5-flash",
        durationMs: duration,
      },
    });
  } catch (error) {
    console.error("[Unfog AI Refine] Error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (message.includes("API_KEY")) {
      return NextResponse.json(
        { error: "AI service not configured. Check your API key." },
        { status: 503 }
      );
    }

    if (message.includes("quota") || message.includes("rate")) {
      return NextResponse.json(
        { error: "AI service rate limited. Try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to refine. Please try again." },
      { status: 500 }
    );
  }
}
