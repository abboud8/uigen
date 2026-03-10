"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload, Camera, Loader2, RotateCcw, Utensils,
  AlertCircle, CheckCircle2, XCircle, Info, HelpCircle,
  PlusCircle, Trash2, TrendingUp,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface DailyValues {
  totalFat?: number; saturatedFat?: number; cholesterol?: number;
  sodium?: number; totalCarbs?: number; fiber?: number; protein?: number;
}

interface Dietary {
  vegan?: boolean; vegetarian?: boolean; glutenFree?: boolean;
  dairyFree?: boolean; nutFree?: boolean; halal?: boolean; kosher?: boolean;
}

interface NutritionResult {
  mode: "results";
  restaurant: string | null; dish: string; menuCategory?: string;
  confidence: "high" | "medium" | "low"; servingSize: string;
  calories: number; totalFat: number; saturatedFat?: number; transFat?: number;
  cholesterol?: number; sodium: number; totalCarbs: number; fiber: number;
  sugar: number; addedSugar?: number; protein: number;
  calcium?: number; iron?: number; potassium?: number;
  allergens: string[]; dietary: Dietary; ingredients: string[];
  dailyValues?: DailyValues; dataSource?: string; notes: string;
}

interface QuestionsResponse {
  mode: "questions";
  partialDish: string;
  questions: Question[];
}

interface NotFoodResponse {
  mode: "not_food";
  notes: string;
}

type ApiResponse = NutritionResult | QuestionsResponse | NotFoodResponse;

type Phase =
  | { kind: "idle" }
  | { kind: "image_ready" }
  | { kind: "loading"; label: string }
  | { kind: "questions"; partialDish: string; questions: Question[] }
  | { kind: "result"; data: NutritionResult }
  | { kind: "not_food"; notes: string }
  | { kind: "error"; message: string };


// ── Daily log types & hook ────────────────────────────────────────────────────

interface LoggedMeal {
  id: string;
  timestamp: number;
  dish: string;
  restaurant: string | null;
  calories: number;
  protein: number;
  totalCarbs: number;
  totalFat: number;
  servingSize: string;
}

function todayKey() {
  return "meal-log-" + new Date().toISOString().slice(0, 10);
}

function useDailyLog() {
  const [meals, setMeals] = useState<LoggedMeal[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(todayKey()) ?? "[]");
    } catch { return []; }
  });

  const addMeal = (data: NutritionResult) => {
    const entry: LoggedMeal = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dish: data.dish,
      restaurant: data.restaurant,
      calories: data.calories,
      protein: data.protein,
      totalCarbs: data.totalCarbs,
      totalFat: data.totalFat,
      servingSize: data.servingSize,
    };
    setMeals((prev) => {
      const next = [...prev, entry];
      localStorage.setItem(todayKey(), JSON.stringify(next));
      return next;
    });
    return entry.id;
  };

  const removeMeal = (id: string) => {
    setMeals((prev) => {
      const next = prev.filter((m) => m.id !== id);
      localStorage.setItem(todayKey(), JSON.stringify(next));
      return next;
    });
  };

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      totalCarbs: acc.totalCarbs + (m.totalCarbs || 0),
      totalFat: acc.totalFat + (m.totalFat || 0),
    }),
    { calories: 0, protein: 0, totalCarbs: 0, totalFat: 0 }
  );

  return { meals, addMeal, removeMeal, totals };
}

// ── Constants ────────────────────────────────────────────────────────────────

const CONFIDENCE_COLORS = {
  high: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-red-100 text-red-700 border-red-200",
};

const ALLERGEN_ICONS: Record<string, string> = {
  wheat: "🌾", milk: "🥛", eggs: "🥚", fish: "🐟", shellfish: "🦐",
  "tree nuts": "🌰", peanuts: "🥜", sesame: "🫙", soy: "🫘",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function NutritionRow({ label, value, unit, dv, bold, indent }: {
  label: string; value: number | null | undefined; unit: string;
  dv?: number; bold?: boolean; indent?: boolean;
}) {
  if (value == null) return null;
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0 ${indent ? "pl-4" : ""}`}>
      <span className={`text-sm text-neutral-700 ${bold ? "font-bold" : ""}`}>{label}</span>
      <div className="flex items-center gap-3">
        <span className={`text-sm text-neutral-900 ${bold ? "font-bold" : ""}`}>{value}{unit}</span>
        {dv != null && <span className="text-xs text-neutral-400 w-10 text-right">{dv}%</span>}
      </div>
    </div>
  );
}

function DietaryBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-neutral-50 text-neutral-400 border-neutral-200"}`}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  );
}

function QuestionCard({ q, selected, onSelect }: {
  q: Question; selected: string | undefined; onSelect: (val: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <p className="text-sm font-semibold text-neutral-800 mb-3 flex items-start gap-2">
        <HelpCircle className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
        {q.question}
      </p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`text-left text-sm px-3 py-2.5 rounded-lg border transition-all ${
              selected === opt
                ? "border-neutral-900 bg-neutral-900 text-white font-medium"
                : "border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}


function DailyProgress({
  meals,
  totals,
  onRemove,
}: {
  meals: LoggedMeal[];
  totals: { calories: number; protein: number; totalCarbs: number; totalFat: number };
  onRemove: (id: string) => void;
}) {
  const GOAL = 2000;
  const pct = Math.min((totals.calories / GOAL) * 100, 100);

  if (meals.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="bg-neutral-900 px-5 py-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-white" />
        <h3 className="text-white font-bold text-sm tracking-tight">Today’s Progress</h3>
        <span className="ml-auto text-neutral-400 text-xs">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </span>
      </div>

      {/* Calorie bar */}
      <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-3xl font-black text-neutral-900">{totals.calories}</span>
            <span className="text-sm text-neutral-400 ml-1">/ {GOAL} kcal</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${pct >= 100 ? "bg-red-100 text-red-600" : pct >= 80 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
            {Math.round(pct)}% of goal
          </span>
        </div>
        <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Macro row */}
      <div className="grid grid-cols-3 divide-x divide-neutral-100 border-b border-neutral-100">
        {[
          { label: "Protein", value: totals.protein, unit: "g", color: "text-blue-600" },
          { label: "Carbs", value: totals.totalCarbs, unit: "g", color: "text-amber-600" },
          { label: "Fat", value: totals.totalFat, unit: "g", color: "text-rose-600" },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="px-4 py-3 text-center">
            <p className={`text-lg font-bold ${color}`}>{value}<span className="text-xs font-medium ml-0.5 text-neutral-400">{unit}</span></p>
            <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Meal list */}
      <div className="divide-y divide-neutral-50">
        {meals.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-800 truncate">{m.dish}</p>
              {m.restaurant && <p className="text-xs text-neutral-400 truncate">{m.restaurant}</p>}
            </div>
            <span className="text-sm font-bold text-neutral-700 shrink-0">{m.calories} kcal</span>
            <button
              onClick={() => onRemove(m.id)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsView({ data, onReset, onAdd, added }: { data: NutritionResult; onReset: () => void; onAdd: () => void; added: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {data.restaurant && (
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                {data.restaurant}{data.menuCategory ? ` · ${data.menuCategory}` : ""}
              </p>
            )}
            <h2 className="text-xl font-bold text-neutral-900 leading-snug">{data.dish}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">Serving size: {data.servingSize}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${CONFIDENCE_COLORS[data.confidence] ?? CONFIDENCE_COLORS.medium}`}>
            {data.confidence} confidence
          </span>
        </div>
        <div className="flex items-end gap-1.5 pb-4 border-b border-neutral-100">
          <span className="text-6xl font-black text-neutral-900 leading-none tracking-tight">{data.calories}</span>
          <span className="text-base font-medium text-neutral-400 pb-1">Calories</span>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-4">
          {[
            { label: "Protein", value: data.protein, unit: "g", color: "text-blue-600 bg-blue-50 border-blue-100" },
            { label: "Total Carbs", value: data.totalCarbs, unit: "g", color: "text-amber-600 bg-amber-50 border-amber-100" },
            { label: "Total Fat", value: data.totalFat, unit: "g", color: "text-rose-600 bg-rose-50 border-rose-100" },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
              <p className="text-2xl font-bold leading-none">{value}<span className="text-sm font-medium ml-0.5">{unit}</span></p>
              <p className="text-xs font-medium mt-1 opacity-70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition Facts Panel */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="bg-neutral-900 px-5 py-3 flex items-center justify-between">
          <h3 className="text-white font-black text-base tracking-tight">Nutrition Facts</h3>
          {data.dataSource && (
            <span className="text-neutral-400 text-xs flex items-center gap-1">
              <Info className="h-3 w-3" />{data.dataSource}
            </span>
          )}
        </div>
        <div className="px-5 py-3">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 mb-1 border-b-4 border-neutral-900">
            <span className="font-semibold uppercase tracking-wide">Nutrient</span>
            <div className="flex gap-3">
              <span className="font-semibold uppercase tracking-wide">Amount</span>
              <span className="font-semibold uppercase tracking-wide w-10 text-right">%DV*</span>
            </div>
          </div>
          <NutritionRow label="Total Fat" value={data.totalFat} unit="g" dv={data.dailyValues?.totalFat} bold />
          <NutritionRow label="Saturated Fat" value={data.saturatedFat} unit="g" dv={data.dailyValues?.saturatedFat} indent />
          <NutritionRow label="Trans Fat" value={data.transFat} unit="g" indent />
          <NutritionRow label="Cholesterol" value={data.cholesterol} unit="mg" dv={data.dailyValues?.cholesterol} bold />
          <NutritionRow label="Sodium" value={data.sodium} unit="mg" dv={data.dailyValues?.sodium} bold />
          <NutritionRow label="Total Carbohydrate" value={data.totalCarbs} unit="g" dv={data.dailyValues?.totalCarbs} bold />
          <NutritionRow label="Dietary Fiber" value={data.fiber} unit="g" dv={data.dailyValues?.fiber} indent />
          <NutritionRow label="Total Sugars" value={data.sugar} unit="g" indent />
          {data.addedSugar != null && <NutritionRow label="Added Sugars" value={data.addedSugar} unit="g" indent />}
          <NutritionRow label="Protein" value={data.protein} unit="g" dv={data.dailyValues?.protein} bold />
          <div className="border-t-4 border-neutral-900 mt-1 pt-3 grid grid-cols-2 gap-x-4 gap-y-1">
            <NutritionRow label="Calcium" value={data.calcium} unit="mg" />
            <NutritionRow label="Iron" value={data.iron} unit="mg" />
            <NutritionRow label="Potassium" value={data.potassium} unit="mg" />
          </div>
          <p className="text-xs text-neutral-400 pt-3 border-t border-neutral-100 mt-2">
            * % Daily Values based on a 2,000 calorie diet.
          </p>
        </div>
      </div>

      {/* Dietary Flags */}
      {data.dietary && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-widest">Dietary Info</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries({
              Vegan: data.dietary.vegan, Vegetarian: data.dietary.vegetarian,
              "Gluten-Free": data.dietary.glutenFree, "Dairy-Free": data.dietary.dairyFree,
              "Nut-Free": data.dietary.nutFree, Halal: data.dietary.halal, Kosher: data.dietary.kosher,
            }).filter(([, v]) => v != null).map(([label, ok]) => (
              <DietaryBadge key={label} label={label} ok={!!ok} />
            ))}
          </div>
        </div>
      )}

      {/* Allergens */}
      {data.allergens?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Allergen Warning
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.allergens.map((a) => (
              <span key={a} className="text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg capitalize">
                {ALLERGEN_ICONS[a.toLowerCase()] ?? "⚠️"} {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients */}
      {data.ingredients?.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-widest">Ingredients</h3>
          <p className="text-sm text-neutral-600 leading-relaxed">{data.ingredients.join(", ")}.</p>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="flex gap-3 bg-neutral-100 rounded-2xl p-4 text-sm text-neutral-600 leading-relaxed">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-neutral-400" />
          <span>{data.notes}</span>
        </div>
      )}

      {!added ? (
        <Button className="gap-2 w-full" onClick={onAdd}>
          <PlusCircle className="h-4 w-4" /> Add to Today’s Progress
        </Button>
      ) : (
        <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-semibold py-2">
          <CheckCircle2 className="h-4 w-4" /> Added to today’s progress
        </div>
      )}
      <Button variant="outline" onClick={onReset} className="gap-2 w-full">
        <RotateCcw className="h-4 w-4" /> Scan Another Item
      </Button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function MealAnalyzer({ embedded = false }: { embedded?: boolean }) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [addedId, setAddedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { meals, addMeal, removeMeal, totals } = useDailyLog();

  // ── Image compression ────────────────────────────────────────────────────
  const compressImage = useCallback((dataUrl: string): Promise<{ dataUrl: string; mimeType: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX_PX = 1920;
        const MAX_B64 = 3_800_000;
        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          const scale = MAX_PX / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        let out = canvas.toDataURL("image/jpeg", quality);
        while (out.length * 0.75 > MAX_B64 && quality > 0.2) {
          quality -= 0.1;
          out = canvas.toDataURL("image/jpeg", quality);
        }
        resolve({ dataUrl: out, mimeType: "image/jpeg" });
      };
      img.src = dataUrl;
    });
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const { dataUrl, mimeType: mt } = await compressImage(e.target?.result as string);
      setImageDataUrl(dataUrl);
      setMimeType(mt);
      setAnswers({});
      setPhase({ kind: "image_ready" });
    };
    reader.readAsDataURL(file);
  }, [compressImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) processFile(file);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0]; if (file) processFile(file);
  };

  // ── API call helper ──────────────────────────────────────────────────────
  const callApi = useCallback(async (ans: Record<string, string> = {}): Promise<ApiResponse> => {
    const base64 = imageDataUrl!.split(",")[1];
    const res = await fetch("/api/analyze-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, mimeType, answers: ans }),
    });
    const raw = await res.text();
    try { return JSON.parse(raw) as ApiResponse; }
    catch { throw new Error("Server error — please try again"); }
  }, [imageDataUrl, mimeType]);

  // ── Pass 1: identify ─────────────────────────────────────────────────────
  const handleIdentify = async () => {
    setPhase({ kind: "loading", label: "Analyzing image…" });
    try {
      const resp = await callApi();
      if (resp.mode === "not_food") {
        setPhase({ kind: "not_food", notes: resp.notes });
      } else if (resp.mode === "questions") {
        setAnswers({});
        setPhase({ kind: "questions", partialDish: resp.partialDish, questions: resp.questions });
      } else {
        setPhase({ kind: "result", data: resp });
      }
    } catch (err: any) {
      setPhase({ kind: "error", message: err.message ?? "Something went wrong" });
    }
  };

  // ── Pass 2: calculate with answers ───────────────────────────────────────
  const handleCalculate = async () => {
    setPhase({ kind: "loading", label: "Calculating nutrition facts…" });
    try {
      const resp = await callApi(answers);
      if (resp.mode === "results") {
        setPhase({ kind: "result", data: resp });
      } else {
        setPhase({ kind: "error", message: "Unexpected response from server" });
      }
    } catch (err: any) {
      setPhase({ kind: "error", message: err.message ?? "Something went wrong" });
    }
  };

  const reset = () => {
    setImageDataUrl(null);
    setAnswers({});
    setAddedId(null);
    setPhase({ kind: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const questionsAnswered =
    phase.kind === "questions" &&
    phase.questions.every((q) => answers[q.id] != null);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={embedded ? "h-full overflow-y-auto bg-neutral-50" : "min-h-screen bg-neutral-50"}>
      <div className={`max-w-2xl mx-auto px-4 flex flex-col gap-5 ${embedded ? "py-6" : "py-10"}`}>

        <DailyProgress meals={meals} totals={totals} onRemove={removeMeal} />

        {/* Upload zone — always visible until result */}
        {phase.kind !== "result" && (
          !imageDataUrl ? (
            <div
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${isDragging ? "border-neutral-400 bg-neutral-100" : "border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50"}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="h-16 w-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <Camera className="h-8 w-8 text-neutral-400" />
              </div>
              <div className="text-center">
                <p className="text-neutral-900 font-semibold">Scan a menu item or dish</p>
                <p className="text-neutral-500 text-sm mt-1">Drag & drop or click — JPG, PNG, WebP</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 pointer-events-none">
                <Upload className="h-4 w-4" /> Choose Photo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="relative">
                <img src={imageDataUrl} alt="Meal" className="w-full max-h-64 object-cover" />
                <button onClick={reset} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors">
                  <RotateCcw className="h-4 w-4 text-white" />
                </button>
              </div>
              {phase.kind === "image_ready" && (
                <div className="p-4">
                  <Button className="w-full gap-2" onClick={handleIdentify}>
                    <Utensils className="h-4 w-4" /> Analyze Nutrition
                  </Button>
                </div>
              )}
            </div>
          )
        )}

        {/* Loading */}
        {phase.kind === "loading" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 flex flex-col items-center gap-3 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <p className="text-sm font-medium">{phase.label}</p>
          </div>
        )}

        {/* Not food */}
        {phase.kind === "not_food" && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center flex flex-col items-center gap-3">
            <AlertCircle className="h-10 w-10 text-neutral-300" />
            <div>
              <p className="font-semibold text-neutral-700">No food detected</p>
              <p className="text-sm text-neutral-400 mt-1">{phase.notes}</p>
            </div>
            <Button variant="outline" onClick={reset} size="sm" className="gap-2 mt-2">
              <RotateCcw className="h-4 w-4" /> Try Another Photo
            </Button>
          </div>
        )}

        {/* Error */}
        {phase.kind === "error" && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <span>{phase.message}</span>
              <button onClick={handleIdentify} className="ml-2 underline font-medium">Retry</button>
            </div>
          </div>
        )}

        {/* Questions */}
        {phase.kind === "questions" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Identified as</p>
              <h2 className="text-lg font-bold text-neutral-900">{phase.partialDish}</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Answer a few questions so we can calculate accurate nutrition facts.
              </p>
            </div>

            {phase.questions.map((q) => (
              <QuestionCard
                key={q.id}
                q={q}
                selected={answers[q.id]}
                onSelect={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
              />
            ))}

            <Button
              className="w-full gap-2"
              disabled={!questionsAnswered}
              onClick={handleCalculate}
            >
              <Utensils className="h-4 w-4" />
              {questionsAnswered ? "Calculate Nutrition Facts" : `Answer all ${phase.questions.length} questions to continue`}
            </Button>
          </div>
        )}

        {/* Results */}
        {phase.kind === "result" && (
          <ResultsView
            data={phase.data}
            onReset={reset}
            onAdd={() => { const id = addMeal(phase.data); setAddedId(id); }}
            added={addedId !== null}
          />
        )}

      </div>
    </div>
  );
}
