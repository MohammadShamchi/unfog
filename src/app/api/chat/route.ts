import { NextRequest, NextResponse } from "next/server";
import { canvasChat } from "@/lib/ai/canvas-chat";
import type { ChatRequest } from "@/types/analysis";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    if (body.message.trim().length === 0) {
      return NextResponse.json(
        { error: "Empty message" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const result = await canvasChat(body);
    const duration = Date.now() - startTime;

    const opCount =
      result.operations.addNodes.length +
      result.operations.updateNodes.length +
      result.operations.removeNodeIds.length;

    console.log(
      `[Unfog AI Chat] "${body.message.slice(0, 50)}" → ${opCount} ops, ${duration}ms`
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
    console.error("[Unfog AI Chat] Error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("API_KEY")) {
      return NextResponse.json(
        { error: "AI service not configured." },
        { status: 503 }
      );
    }

    if (message.includes("quota") || message.includes("rate") || message.includes("429")) {
      const retryMatch = message.match(/retryDelay.*?(\d+)s/);
      const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 30;
      return NextResponse.json(
        { error: `Rate limited. Try again in ~${retryAfter}s.`, retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    return NextResponse.json(
      { error: "Chat failed. Please try again." },
      { status: 500 }
    );
  }
}
