import { NextRequest, NextResponse } from "next/server";
import { suggestGhosts } from "@/lib/ai/suggest-ghosts";
import type { SuggestGhostsRequest } from "@/types/analysis";

export async function POST(request: NextRequest) {
  try {
    const body: SuggestGhostsRequest = await request.json();

    const startTime = Date.now();
    const result = await suggestGhosts(body);
    const duration = Date.now() - startTime;

    console.log(
      `[Unfog AI Ghosts] ${result.suggestions.length} suggestions, ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        model: process.env.AI_MODEL || "gemini-2.5-flash",
        durationMs: duration,
      },
    });
  } catch {
    // Silent failure per spec
    return NextResponse.json({
      success: true,
      data: { suggestions: [] },
    });
  }
}
