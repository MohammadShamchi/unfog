import { NextRequest, NextResponse } from "next/server";
import { generateOptions } from "@/lib/ai/generate-options";
import type { OptionsRequest, AIConfig } from "@/types/analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const aiConfig: AIConfig | undefined = body.aiConfig;
    const optionsBody: OptionsRequest = body;

    if (!optionsBody.nodeId || !optionsBody.nodeLabel) {
      return NextResponse.json(
        { error: "Missing node data" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const result = await generateOptions(optionsBody, aiConfig);
    const duration = Date.now() - startTime;

    console.log(
      `[Unfog AI Options] ${result.options.length} options, ${result.edges.length} edges, ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        model: aiConfig?.model || process.env.AI_MODEL || "gemini-2.5-flash",
        durationMs: duration,
      },
    });
  } catch (error) {
    console.error("[Unfog AI Options] Error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("API_KEY") || message.includes("api_key") || message.includes("authentication")) {
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
      { error: "Failed to generate options. Please try again." },
      { status: 500 }
    );
  }
}
