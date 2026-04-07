"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Search, Flame, Beef, Wheat, Droplets,
  ChevronDown, ChevronUp, X, Check, BarChart3,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  quantity: number;
  meal: MealType;
}

type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface CommonFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

// ── Common foods database ────────────────────────────────────────────────────

const COMMON_FOODS: CommonFood[] = [
  { name: "Chicken Breast (grilled)", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: "100g" },
  { name: "Brown Rice (cooked)", calories: 216, protein: 5, carbs: 45, fat: 1.8, servingSize: "1 cup (195g)" },
  { name: "Broccoli (steamed)", calories: 55, protein: 3.7, carbs: 11, fat: 0.6, servingSize: "1 cup (91g)" },
  { name: "Whole Egg (large)", calories: 78, protein: 6, carbs: 0.6, fat: 5, servingSize: "1 egg (50g)" },
  { name: "Greek Yogurt (plain)", calories: 100, protein: 17, carbs: 6, fat: 0.7, servingSize: "170g" },
  { name: "Oatmeal (cooked)", calories: 166, protein: 5.9, carbs: 28, fat: 3.6, servingSize: "1 cup (234g)" },
  { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: "1 medium (118g)" },
  { name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, servingSize: "28g" },
  { name: "Salmon (baked)", calories: 208, protein: 28, carbs: 0, fat: 10, servingSize: "100g" },
  { name: "Sweet Potato (baked)", calories: 103, protein: 2.3, carbs: 24, fat: 0.1, servingSize: "1 medium (114g)" },
  { name: "Spinach (raw)", calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, servingSize: "1 cup (30g)" },
  { name: "Cottage Cheese (low-fat)", calories: 163, protein: 28, carbs: 6, fat: 2.3, servingSize: "1 cup (226g)" },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: "100g" },
  { name: "White Rice (cooked)", calories: 206, protein: 4.3, carbs: 45, fat: 0.4, servingSize: "1 cup (186g)" },
  { name: "Tuna (canned in water)", calories: 109, protein: 25, carbs: 0, fat: 1, servingSize: "100g" },
  { name: "Milk (2%)", calories: 122, protein: 8, carbs: 12, fat: 5, servingSize: "1 cup (244ml)" },
  { name: "Cheddar Cheese", calories: 113, protein: 7, carbs: 0.4, fat: 9.3, servingSize: "28g" },
  { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: "1 medium (182g)" },
  { name: "Peanut Butter", calories: 188, protein: 8, carbs: 6, fat: 16, servingSize: "2 tbsp (32g)" },
  { name: "Whey Protein Shake", calories: 120, protein: 24, carbs: 3, fat: 2, servingSize: "1 scoop (30g)" },
  { name: "Pasta (cooked)", calories: 220, protein: 8, carbs: 43, fat: 1.3, servingSize: "1 cup (140g)" },
  { name: "Ground Beef (lean 93%)", calories: 196, protein: 22, carbs: 0, fat: 11, servingSize: "100g" },
  { name: "Orange", calories: 62, protein: 1.2, carbs: 15, fat: 0.2, servingSize: "1 medium (131g)" },
  { name: "Black Beans (cooked)", calories: 227, protein: 15, carbs: 41, fat: 0.9, servingSize: "1 cup (172g)" },
  { name: "Olive Oil", calories: 119, protein: 0, carbs: 0, fat: 13.5, servingSize: "1 tbsp (14g)" },
];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: "#fb923c",
  lunch: "#4ade80",
  dinner: "#60a5fa",
  snacks: "#a78bfa",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  const over = value > goal && goal > 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: over ? "#f87171" : "var(--text)" }}>
          {Math.round(value)}g / {goal}g
        </span>
      </div>
      <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: over ? "#f87171" : color,
          borderRadius: 4,
          transition: "width 0.3s ease",
        }} />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CalorieTracker() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [activeMeal, setActiveMeal] = useState<MealType>("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [customFood, setCustomFood] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", servingSize: "" });
  const [showCustom, setShowCustom] = useState(false);
  const [goals, setGoals] = useState<MacroGoals>({ calories: 2000, protein: 150, carbs: 250, fat: 65 });
  const [showGoals, setShowGoals] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(new Set(["breakfast"]));

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories * e.quantity,
      protein: acc.protein + e.protein * e.quantity,
      carbs: acc.carbs + e.carbs * e.quantity,
      fat: acc.fat + e.fat * e.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const filteredFoods = COMMON_FOODS.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFood = useCallback((food: CommonFood) => {
    setEntries((prev) => [...prev, { ...food, id: uid(), quantity: 1, meal: activeMeal }]);
    setShowSearch(false);
    setSearchQuery("");
  }, [activeMeal]);

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const updateQuantity = (id: string, delta: number) => {
    setEntries((prev) =>
      prev.map((e) => e.id === id ? { ...e, quantity: Math.max(0.5, e.quantity + delta) } : e)
    );
  };

  const addCustomFood = () => {
    if (!customFood.name || !customFood.calories) return;
    const entry: FoodEntry = {
      id: uid(),
      name: customFood.name,
      calories: Number(customFood.calories),
      protein: Number(customFood.protein) || 0,
      carbs: Number(customFood.carbs) || 0,
      fat: Number(customFood.fat) || 0,
      servingSize: customFood.servingSize || "1 serving",
      quantity: 1,
      meal: activeMeal,
    };
    setEntries((prev) => [...prev, entry]);
    setCustomFood({ name: "", calories: "", protein: "", carbs: "", fat: "", servingSize: "" });
    setShowCustom(false);
  };

  const toggleMeal = (meal: MealType) => {
    setExpandedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(meal)) next.delete(meal);
      else next.add(meal);
      return next;
    });
  };

  const calPct = Math.min(100, goals.calories > 0 ? (totals.calories / goals.calories) * 100 : 0);
  const calRemaining = goals.calories - Math.round(totals.calories);

  const inputStyle = {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    width: "100%",
  };

  const btnStyle = (color: string) => ({
    background: color,
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Header */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <Link href="/" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(251,146,60,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Flame size={20} color="#fb923c" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Calorie Tracker</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Log your daily nutrition</div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowGoals(!showGoals)}
            style={{ ...btnStyle("var(--surface-2)"), border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <BarChart3 size={15} /> Goals
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>

        {/* Goals editor */}
        {showGoals && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              Daily Goals
              <button onClick={() => setShowGoals(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
                <div key={key}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, textTransform: "capitalize" }}>
                    {key} {key === "calories" ? "(kcal)" : "(g)"}
                  </div>
                  <input
                    type="number"
                    value={goals[key]}
                    onChange={(e) => setGoals((g) => ({ ...g, [key]: Number(e.target.value) }))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calorie Ring Summary */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            {/* Ring */}
            <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={calPct >= 100 ? "#f87171" : "#4ade80"}
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - calPct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{Math.round(totals.calories)}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>kcal</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Goal</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{goals.calories} kcal</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Remaining</span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: calRemaining < 0 ? "#f87171" : "#4ade80",
                }}>
                  {calRemaining < 0 ? "+" : ""}{Math.abs(calRemaining)} kcal {calRemaining < 0 ? "over" : "left"}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="#60a5fa" />
                <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color="#fb923c" />
                <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color="#a78bfa" />
              </div>
            </div>

            {/* Macro pills */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 120 }}>
              {[
                { label: "Protein", val: totals.protein, color: "#60a5fa" },
                { label: "Carbs", val: totals.carbs, color: "#fb923c" },
                { label: "Fat", val: totals.fat, color: "#a78bfa" },
              ].map((m) => (
                <div key={m.label} style={{
                  background: `${m.color}15`,
                  border: `1px solid ${m.color}30`,
                  borderRadius: 10,
                  padding: "8px 14px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{Math.round(m.val)}g</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Meal tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {(["breakfast", "lunch", "dinner", "snacks"] as MealType[]).map((meal) => {
            const mealCals = entries
              .filter((e) => e.meal === meal)
              .reduce((acc, e) => acc + e.calories * e.quantity, 0);
            return (
              <button
                key={meal}
                onClick={() => { setActiveMeal(meal); setShowSearch(false); setShowCustom(false); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: activeMeal === meal
                    ? `1.5px solid ${MEAL_COLORS[meal]}`
                    : "1.5px solid var(--border)",
                  background: activeMeal === meal ? `${MEAL_COLORS[meal]}15` : "var(--surface)",
                  color: activeMeal === meal ? MEAL_COLORS[meal] : "var(--text-muted)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {MEAL_LABELS[meal]}
                {mealCals > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                    {Math.round(mealCals)} kcal
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add food */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: showSearch || showCustom ? 16 : 0 }}>
            <button
              onClick={() => { setShowSearch(!showSearch); setShowCustom(false); }}
              style={{ ...btnStyle(showSearch ? "#fb923c" : "var(--surface-2)"), border: "1px solid var(--border)", color: showSearch ? "#fff" : "var(--text)", flex: 1 }}
            >
              <Search size={15} /> Search Foods
            </button>
            <button
              onClick={() => { setShowCustom(!showCustom); setShowSearch(false); }}
              style={{ ...btnStyle(showCustom ? "#4ade80" : "var(--surface-2)"), border: "1px solid var(--border)", color: showCustom ? "#0f1117" : "var(--text)", flex: 1 }}
            >
              <Plus size={15} /> Custom Food
            </button>
          </div>

          {/* Search panel */}
          {showSearch && (
            <div>
              <input
                placeholder="Search food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }}
                autoFocus
              />
              <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {filteredFoods.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => addFood(food)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid transparent",
                      background: "var(--surface-2)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.1s",
                      color: "var(--text)",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#fb923c"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{food.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{food.servingSize}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fb923c" }}>{food.calories} kcal</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>P{food.protein}g C{food.carbs}g F{food.fat}g</div>
                    </div>
                  </button>
                ))}
                {filteredFoods.length === 0 && (
                  <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 14 }}>
                    No foods found. Try adding a custom entry.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom food panel */}
          {showCustom && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <input placeholder="Food name *" value={customFood.name} onChange={(e) => setCustomFood((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
                </div>
                <input placeholder="Calories (kcal) *" type="number" value={customFood.calories} onChange={(e) => setCustomFood((f) => ({ ...f, calories: e.target.value }))} style={inputStyle} />
                <input placeholder="Serving size" value={customFood.servingSize} onChange={(e) => setCustomFood((f) => ({ ...f, servingSize: e.target.value }))} style={inputStyle} />
                <input placeholder="Protein (g)" type="number" value={customFood.protein} onChange={(e) => setCustomFood((f) => ({ ...f, protein: e.target.value }))} style={inputStyle} />
                <input placeholder="Carbs (g)" type="number" value={customFood.carbs} onChange={(e) => setCustomFood((f) => ({ ...f, carbs: e.target.value }))} style={inputStyle} />
                <input placeholder="Fat (g)" type="number" value={customFood.fat} onChange={(e) => setCustomFood((f) => ({ ...f, fat: e.target.value }))} style={inputStyle} />
              </div>
              <button
                onClick={addCustomFood}
                disabled={!customFood.name || !customFood.calories}
                style={{ ...btnStyle("#4ade80"), color: "#0f1117", width: "100%", justifyContent: "center", opacity: !customFood.name || !customFood.calories ? 0.5 : 1 }}
              >
                <Check size={15} /> Add Food
              </button>
            </div>
          )}
        </div>

        {/* Meal sections */}
        {(["breakfast", "lunch", "dinner", "snacks"] as MealType[]).map((meal) => {
          const mealEntries = entries.filter((e) => e.meal === meal);
          if (mealEntries.length === 0) return null;
          const mealCals = mealEntries.reduce((acc, e) => acc + e.calories * e.quantity, 0);
          const expanded = expandedMeals.has(meal);
          return (
            <div key={meal} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              marginBottom: 12,
              overflow: "hidden",
            }}>
              <button
                onClick={() => toggleMeal(meal)}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: MEAL_COLORS[meal],
                  }} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{MEAL_LABELS[meal]}</span>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{mealEntries.length} items</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: MEAL_COLORS[meal] }}>{Math.round(mealCals)} kcal</span>
                  {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>
              </button>

              {expanded && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                  {mealEntries.map((entry) => (
                    <div key={entry.id} style={{
                      padding: "12px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      borderBottom: "1px solid var(--border)",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{entry.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {entry.servingSize} · P{Math.round(entry.protein * entry.quantity)}g C{Math.round(entry.carbs * entry.quantity)}g F{Math.round(entry.fat * entry.quantity)}g
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => updateQuantity(entry.id, -0.5)} style={{
                          width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)",
                          background: "var(--surface-2)", color: "var(--text)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: "center" }}>{entry.quantity}x</span>
                        <button onClick={() => updateQuantity(entry.id, 0.5)} style={{
                          width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border)",
                          background: "var(--surface-2)", color: "var(--text)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>+</button>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fb923c", minWidth: 60, textAlign: "right" }}>
                        {Math.round(entry.calories * entry.quantity)} kcal
                      </div>
                      <button onClick={() => removeEntry(entry.id)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", display: "flex",
                      }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {entries.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "var(--text-muted)", fontSize: 15,
          }}>
            <Utensils size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>No entries yet.</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Search or add a custom food above to get started.</div>
          </div>
        )}
      </div>
    </div>
  );
}
