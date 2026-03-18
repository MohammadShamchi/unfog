import { NextRequest, NextResponse } from "next/server";
import { clarifyIntake } from "@/lib/ai/clarify-intake";
import type { AIConfig } from "@/types/analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, conversation } = body;
    const aiConfig: AIConfig | undefined = body.aiConfig;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 },
      );
    }

    const result = await clarifyIntake(
      prompt,
      conversation ?? [],
      aiConfig,
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[Unfog Clarify] Error:", error);
    return NextResponse.json({
      success: true,
      data: { question: null, ready: true },
    });
  }
}
