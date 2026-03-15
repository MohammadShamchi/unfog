import { INTAKE_ASSESSMENT_PROMPT } from "./prompts";
import { createProviderFromConfig, safeParseJSON, resolveTemperature } from "./client";
import type { IntakeAssessment, AIConfig } from "@/types/analysis";

const assessmentSchema = {
  type: "object" as const,
  properties: {
    sufficient: { type: "boolean" as const },
    questions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          question: { type: "string" as const },
          options: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          allowCustom: { type: "boolean" as const },
        },
        required: ["id", "question", "options", "allowCustom"],
      },
    },
    reasoning: { type: "string" as const },
  },
  required: ["sufficient"],
};

async function callAssessment(
  userPrompt: string,
  config?: AIConfig,
): Promise<IntakeAssessment> {
  const provider = createProviderFromConfig(config);
  const rawText = await provider.generate({
    systemPrompt: INTAKE_ASSESSMENT_PROMPT,
    userMessage: userPrompt,
    maxOutputTokens: 2048,
    temperature: resolveTemperature(config),
    responseSchema: assessmentSchema,
  });

  return safeParseJSON<IntakeAssessment>(rawText);
}

export async function assessIntake(
  userPrompt: string,
  config?: AIConfig,
): Promise<IntakeAssessment> {
  try {
    return await callAssessment(userPrompt, config);
  } catch (firstError) {
    console.warn("[Unfog Intake] First attempt failed, retrying:", firstError);
    return await callAssessment(userPrompt, config);
  }
}
