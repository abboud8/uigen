import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const WORKOUT_PROMPT = (form: {
  goal: string;
  fitnessLevel: string;
  daysPerWeek: string;
  equipment: string;
  age: string;
  limitations: string;
}) => `You are an expert personal trainer and certified strength & conditioning specialist.

Create a detailed, personalized weekly workout plan based on:
- Primary goal: ${form.goal.replace(/_/g, " ")}
- Fitness level: ${form.fitnessLevel}
- Days per week: ${form.daysPerWeek}
- Available equipment: ${form.equipment.replace(/_/g, " ")}
${form.age ? `- Age: ${form.age}` : ""}
${form.limitations ? `- Injuries/limitations: ${form.limitations}` : ""}

Generate a complete plan with EXACTLY ${form.daysPerWeek} workout days.

Respond ONLY with this JSON (no markdown, no code blocks):
{
  "title": "Plan name, e.g. '4-Day Muscle Building Program'",
  "overview": "2-3 sentence description of the program philosophy and what to expect",
  "daysPerWeek": ${form.daysPerWeek},
  "difficulty": "Beginner | Intermediate | Advanced",
  "estimatedCaloriesPerSession": 350,
  "weeks": [
    {
      "day": "Day 1",
      "focus": "e.g. Upper Body Push",
      "duration": "e.g. 45-55 min",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "8-12",
          "rest": "60-90 sec",
          "notes": "Optional form tip or modification"
        }
      ]
    }
  ],
  "tips": [
    "Actionable tip 1",
    "Actionable tip 2",
    "Actionable tip 3",
    "Actionable tip 4"
  ]
}

Rules:
- Each day should have 5-8 exercises appropriate for the equipment
- Include warm-up note in first exercise or as a separate entry
- Adapt exercises to any limitations mentioned
- For weight_loss: include cardio elements and supersets
- For muscle_gain: focus on compound movements with progressive overload
- For endurance: mix cardio and circuit training
- For strength: heavy compound lifts with longer rest periods
- For flexibility: yoga/mobility focused movements
- Reps should be appropriate ranges (e.g. "3-5" for strength, "12-15" for endurance)
- Rest times should match the goal`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "No API key configured. Add ANTHROPIC_API_KEY to .env" }, { status: 503 });
    }

    const form = await req.json();

    if (!form.goal || !form.fitnessLevel || !form.equipment) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      messages: [
        {
          role: "user",
          content: WORKOUT_PROMPT(form),
        },
      ],
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: "AI did not return valid JSON", raw: text }, { status: 500 });
    }

    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    console.error("workout-plan error:", err);
    return Response.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
