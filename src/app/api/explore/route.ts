import { NextRequest, NextResponse } from "next/server";
import { exploreNode } from "@/lib/ai/explore-node";
import type { ExploreRequest } from "@/types/analysis";

export async function POST(request: NextRequest) {
  try {
    const body: ExploreRequest = await request.json();

    if (!body.nodeId || !body.nodeLabel) {
      return NextResponse.json(
        { error: "Missing node data" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const result = await exploreNode(body);
    const duration = Date.now() - startTime;

    console.log(
      `[Unfog AI Explore] ${result.nodes.length} nodes, ${result.edges.length} edges, ${duration}ms`
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
    console.error("[Unfog AI Explore] Error:", error);

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
      { error: "Failed to explore node. Please try again." },
      { status: 500 }
    );
  }
}
