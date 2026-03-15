import { NextRequest, NextResponse } from "next/server";
import { assessIntake } from "@/lib/ai/assess-intake";

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