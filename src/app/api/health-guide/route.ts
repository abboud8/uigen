import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const SYSTEM_PROMPT = `You are a knowledgeable, friendly, and supportive personal health coach and wellness guide.

Your expertise covers:
- Nutrition & meal planning (macros, calories, micronutrients, meal timing)
- Exercise science (strength training, cardio, flexibility, recovery)
- Sleep optimization and circadian rhythms
- Stress management and mental wellness
- Weight management (loss, gain, maintenance)
- Sports performance and athletic training
- Healthy habits and behavior change
- Understanding health biomarkers and lab values

Communication style:
- Be warm, encouraging, and non-judgmental
- Give specific, actionable advice — not vague platitudes
- Use numbers and evidence when helpful (e.g. "aim for 0.7-1g protein per pound of bodyweight")
- Keep responses concise but complete — 2-4 short paragraphs is usually ideal
- Format with bullet points when listing multiple items
- Always acknowledge individual variation ("this varies by person, but generally...")

Important boundaries:
- You can discuss general health information and lifestyle guidance
- Always recommend consulting a doctor for medical conditions, symptoms, medications, or anything requiring diagnosis
- Do not provide specific medical diagnoses or treatment plans
- Mention limitations of general advice when relevant

Today's date: ${new Date().toLocaleDateString()}`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "No API key configured. Add ANTHROPIC_API_KEY to .env" }, { status: 503 });
    }

    const { message, history } = await req.json();

    if (!message) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    type HistoryMessage = { role: "user" | "assistant"; content: string };
    const safeHistory: HistoryMessage[] = Array.isArray(history)
      ? (history as HistoryMessage[]).slice(-20).filter(
          (m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant")
        )
      : [];

    const messages = [
      ...safeHistory,
      { role: "user" as const, content: message },
    ];

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      messages,
    });

    return Response.json({ reply: text });
  } catch (err: any) {
    console.error("health-guide error:", err);
    return Response.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
