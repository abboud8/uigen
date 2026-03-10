import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const VALID_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type ImageMime = typeof VALID_MIME[number];

function safeMimeType(m: string): ImageMime {
  return VALID_MIME.includes(m as ImageMime) ? (m as ImageMime) : "image/jpeg";
}

// ── Pass 1: identify the dish and decide if we need clarification ─────────────
const IDENTIFY_PROMPT = `You are an expert dietitian and food scientist.

Look at this food image carefully.

TASK A — Check if it is food at all.
If there is NO food visible, respond with exactly:
{"mode":"not_food","notes":"<what you see instead>"}

TASK B — If food IS visible, assess how much you already know:
• "confident" = you can see enough to calculate nutrition with ≤10% error
  (known restaurant branding, clearly labelled packaging, or very distinct dish with visible portions)
• "needs_info" = you need 1–4 clarifying answers to be accurate

If confident, respond:
{"mode":"results","restaurant":"Name or null","dish":"Full name","menuCategory":"Category","confidence":"high","servingSize":"e.g. 1 burger (201g)","calories":550,"totalFat":30,"saturatedFat":11,"transFat":1,"cholesterol":80,"sodium":1010,"totalCarbs":45,"fiber":3,"sugar":9,"addedSugar":6,"protein":25,"calcium":200,"iron":4,"potassium":410,"allergens":["wheat","milk"],"dietary":{"vegan":false,"vegetarian":false,"glutenFree":false,"dairyFree":false,"nutFree":true,"halal":false,"kosher":false},"ingredients":["item1","item2"],"dailyValues":{"totalFat":38,"saturatedFat":55,"cholesterol":27,"sodium":44,"totalCarbs":16,"fiber":11,"protein":50},"dataSource":"Source name","notes":"Any caveats"}

If needs_info, respond:
{"mode":"questions","partialDish":"Best guess at dish name, e.g. Pasta dish","questions":[{"id":"q1","question":"Question text?","options":["Option A","Option B","Option C","Other"]},{"id":"q2","question":"...","options":["..."]}]}

Ask only what you genuinely cannot determine from the image. Maximum 4 questions. Options should be specific and mutually exclusive. Always include "Other / not sure" as a final option.

Respond ONLY with valid JSON. No markdown. No explanation outside JSON.`;

// ── Pass 2: calculate with answers ───────────────────────────────────────────
function buildCalculatePrompt(answers: Record<string, string>): string {
  const answerText = Object.entries(answers)
    .map(([id, val]) => `  ${id}: ${val}`)
    .join("\n");
  return `You are an expert dietitian and food scientist. The user has answered your clarifying questions about this meal.

User's answers:
${answerText}

Using BOTH the image AND these answers, calculate the most accurate possible nutrition facts.

Rules:
- Use USDA food database values for each ingredient × estimated portion weight
- For known restaurants use official published nutrition data
- Be precise — do not round aggressively
- Allergens: list all present (wheat, milk, eggs, fish, shellfish, tree nuts, peanuts, sesame, soy)

Respond ONLY with this exact JSON (no markdown):
{"mode":"results","restaurant":"Name or null","dish":"Full dish name","menuCategory":"Category","confidence":"high | medium | low","servingSize":"e.g. 1 plate (350g)","calories":650,"totalFat":28,"saturatedFat":9,"transFat":0,"cholesterol":95,"sodium":820,"totalCarbs":52,"fiber":4,"sugar":7,"addedSugar":2,"protein":38,"calcium":180,"iron":5,"potassium":520,"allergens":["wheat","milk"],"dietary":{"vegan":false,"vegetarian":false,"glutenFree":false,"dairyFree":false,"nutFree":true,"halal":false,"kosher":false},"ingredients":["item1","item2"],"dailyValues":{"totalFat":36,"saturatedFat":45,"cholesterol":32,"sodium":36,"totalCarbs":19,"fiber":14,"protein":76},"dataSource":"USDA estimate based on user answers","notes":"Notes about accuracy"}

All numeric fields must be numbers. allergens must be lowercase strings.`;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "No API key configured. Add ANTHROPIC_API_KEY to .env" }, { status: 503 });
    }

    const body = await req.json();
    const { image, mimeType, answers } = body;

    if (!image || !mimeType) {
      return Response.json({ error: "Missing image or mimeType" }, { status: 400 });
    }

    const mime = safeMimeType(mimeType);
    const imageContent = {
      type: "image" as const,
      image: Buffer.from(image as string, "base64"),
      mimeType: mime,
    };

    const isSecondPass = answers && Object.keys(answers).length > 0;
    const prompt = isSecondPass ? buildCalculatePrompt(answers) : IDENTIFY_PROMPT;

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      messages: [
        {
          role: "user",
          content: [imageContent, { type: "text", text: prompt }],
        },
      ],
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid JSON", raw: text }, { status: 500 });
    }

    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    console.error("analyze-food error:", err);
    return Response.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
