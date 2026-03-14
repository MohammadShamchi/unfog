import { NextRequest, NextResponse } from "next/server";
import { analyzeProblem } from "@/lib/ai/analyze-problem";
import type { AnalyzeRequest } from "@/types/analysis";

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    // Validate input
    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    if (body.prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt too long. Maximum 5000 characters." },
        { status: 400 }
      );
    }

    if (body.prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Prompt too short. Please describe your situation." },
        { status: 400 }
      );
    }

    // Call AI
    const startTime = Date.now();
    const analysis = await analyzeProblem(body.prompt);
    const duration = Date.now() - startTime;

    // Log for debugging (remove in production)
    console.log(
      `[Unfog AI] ${analysis.nodes.length} nodes, ${analysis.edges.length} edges, ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      meta: {
        model: process.env.AI_MODEL || "gemini-2.5-flash",
        durationMs: duration,
        nodeCount: analysis.nodes.length,
        edgeCount: analysis.edges.length,
      },
    });
  } catch (error) {
    console.error("[Unfog AI] Error:", error);

    // Determine error type
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
      { error: "Failed to analyze. Please try again." },
      { status: 500 }
    );
  }
}
