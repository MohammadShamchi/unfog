import { GoogleGenAI } from "@google/genai";
import { INTAKE_ASSESSMENT_PROMPT } from "./prompts";
import type { IntakeAssessment } from "@/types/analysis";

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

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey"
    );
  }
  return new GoogleGenAI({ apiKey });
}

async function callAssessment(
  client: GoogleGenAI,
  model: string,
  userPrompt: string,
): Promise<IntakeAssessment> {
  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    config: {
      systemInstruction: INTAKE_ASSESSMENT_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: assessmentSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Empty assessment response");

  return JSON.parse(text);
}

export async function assessIntake(
  userPrompt: string,
): Promise<IntakeAssessment> {
  const client = getClient();
  const model = process.env.AI_MODEL || "gemini-2.5-flash";

  try {
    return await callAssessment(client, model, userPrompt);
  } catch (firstError) {
    // Retry once on JSON parse failure (Gemini occasionally truncates)
    console.warn("[Unfog Intake] First attempt failed, retrying:", firstError);
    return await callAssessment(client, model, userPrompt);
  }
}
