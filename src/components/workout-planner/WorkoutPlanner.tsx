"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Dumbbell, Loader2, ChevronDown, ChevronUp,
  RefreshCw, CheckCircle2, Circle, Clock, Flame, Target, Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

interface WorkoutDay {
  day: string;
  focus: string;
  duration: string;
  exercises: Exercise[];
}

interface WorkoutPlan {
  title: string;
  overview: string;
  daysPerWeek: number;
  difficulty: string;
  estimatedCaloriesPerSession: number;
  weeks: WorkoutDay[];
  tips: string[];
}

interface FormData {
  goal: string;
  fitnessLevel: string;
  daysPerWeek: string;
  equipment: string;
  age: string;
  limitations: string;
}

const GOALS = [
  { value: "weight_loss", label: "Weight Loss", icon: "🔥" },
  { value: "muscle_gain", label: "Muscle Gain", icon: "💪" },
  { value: "endurance", label: "Endurance", icon: "🏃" },
  { value: "strength", label: "Strength", icon: "🏋️" },
  { value: "general_fitness", label: "General Fitness", icon: "⚡" },
  { value: "flexibility", label: "Flexibility & Mobility", icon: "🧘" },
];

const FITNESS_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "New to working out" },
  { value: "intermediate", label: "Intermediate", desc: "6+ months experience" },
  { value: "advanced", label: "Advanced", desc: "2+ years experience" },
];

const EQUIPMENT_OPTIONS = [
  { value: "none", label: "No Equipment", desc: "Bodyweight only" },
  { value: "minimal", label: "Minimal", desc: "Dumbbells & bands" },
  { value: "home_gym", label: "Home Gym", desc: "Bench, barbells, rack" },
  { value: "full_gym", label: "Full Gym", desc: "All machines & free weights" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function WorkoutPlanner() {
  const [form, setForm] = useState<FormData>({
    goal: "",
    fitnessLevel: "",
    daysPerWeek: "3",
    equipment: "",
    age: "",
    limitations: "",
  });
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const canGenerate = form.goal && form.fitnessLevel && form.equipment;

  const generatePlan = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    setCompletedExercises(new Set());
    setExpandedDays(new Set([0]));

    try {
      const res = await fetch("/api/workout-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      setPlan(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (i: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleExercise = (key: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  const selectionCard = (
    selected: boolean,
    onClick: () => void,
    children: React.ReactNode,
    activeColor = "#60a5fa"
  ) => ({
    style: {
      background: selected ? `${activeColor}15` : "var(--surface-2)",
      border: selected ? `1.5px solid ${activeColor}` : "1.5px solid var(--border)",
      borderRadius: 12,
      padding: "12px 16px",
      cursor: "pointer",
      transition: "all 0.15s",
      color: "var(--text)",
      textAlign: "left" as const,
      width: "100%",
    },
    onClick,
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
            background: "rgba(96,165,250,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Dumbbell size={20} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Workout Planner</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>AI-powered personalized plans</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>

        {/* Form */}
        {!plan && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: 28,
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Build Your Plan</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
              Tell us about your goals and we'll generate a personalized workout plan.
            </p>

            {/* Goal */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Target size={15} color="#60a5fa" /> Primary Goal *
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    {...selectionCard(form.goal === g.value, () => setForm((f) => ({ ...f, goal: g.value })))}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{g.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fitness Level */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={15} color="#4ade80" /> Fitness Level *
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {FITNESS_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    {...selectionCard(form.fitnessLevel === lvl.value, () => setForm((f) => ({ ...f, fitnessLevel: lvl.value })), null, "#4ade80")}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{lvl.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Dumbbell size={15} color="#fb923c" /> Available Equipment *
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <button
                    key={eq.value}
                    {...selectionCard(form.equipment === eq.value, () => setForm((f) => ({ ...f, equipment: eq.value })), null, "#fb923c")}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{eq.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{eq.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Days & Age */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={15} color="#a78bfa" /> Days per Week
                </div>
                <select
                  value={form.daysPerWeek}
                  onChange={(e) => setForm((f) => ({ ...f, daysPerWeek: e.target.value }))}
                  style={inputStyle}
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} days / week</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Age (optional)</div>
                <input
                  type="number"
                  placeholder="e.g. 28"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Limitations */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Injuries / Limitations (optional)</div>
              <textarea
                placeholder="e.g. bad knees, lower back pain, shoulder injury..."
                value={form.limitations}
                onChange={(e) => setForm((f) => ({ ...f, limitations: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 14,
                color: "#f87171",
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={generatePlan}
              disabled={!canGenerate || loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                border: "none",
                background: canGenerate && !loading
                  ? "linear-gradient(135deg, #60a5fa, #3b82f6)"
                  : "var(--surface-2)",
                color: canGenerate && !loading ? "#fff" : "var(--text-muted)",
                fontWeight: 700,
                fontSize: 15,
                cursor: canGenerate && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Generating your plan...</>
              ) : (
                <><Zap size={18} /> Generate Workout Plan</>
              )}
            </button>
          </div>
        )}

        {/* Plan display */}
        {plan && (
          <div>
            {/* Plan header */}
            <div style={{
              background: "linear-gradient(135deg, rgba(96,165,250,0.15), rgba(167,139,250,0.15))",
              border: "1px solid rgba(96,165,250,0.3)",
              borderRadius: 20,
              padding: 24,
              marginBottom: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{plan.title}</h2>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 500 }}>{plan.overview}</p>
                </div>
                <button
                  onClick={() => { setPlan(null); setError(null); }}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: "8px 14px",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <RefreshCw size={13} /> New Plan
                </button>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { icon: Clock, label: `${plan.daysPerWeek} days/week`, color: "#60a5fa" },
                  { icon: Zap, label: plan.difficulty, color: "#4ade80" },
                  { icon: Flame, label: `~${plan.estimatedCaloriesPerSession} kcal/session`, color: "#fb923c" },
                ].map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div key={badge.label} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: `${badge.color}15`,
                      border: `1px solid ${badge.color}30`,
                      borderRadius: 8,
                      padding: "6px 12px",
                    }}>
                      <Icon size={13} color={badge.color} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: badge.color }}>{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Days */}
            {plan.weeks.map((day, i) => {
              const expanded = expandedDays.has(i);
              const completedCount = day.exercises.filter((_, ei) => completedExercises.has(`${i}-${ei}`)).length;
              return (
                <div key={i} style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  marginBottom: 12,
                  overflow: "hidden",
                }}>
                  <button
                    onClick={() => toggleDay(i)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "rgba(96,165,250,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800, color: "#60a5fa",
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{day.day}</div>
                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{day.focus} · {day.duration}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {completedCount > 0 && (
                        <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
                          {completedCount}/{day.exercises.length} done
                        </span>
                      )}
                      {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </button>

                  {expanded && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      {day.exercises.map((ex, ei) => {
                        const key = `${i}-${ei}`;
                        const done = completedExercises.has(key);
                        return (
                          <div
                            key={ei}
                            onClick={() => toggleExercise(key)}
                            style={{
                              padding: "14px 20px",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 14,
                              borderBottom: "1px solid var(--border)",
                              cursor: "pointer",
                              background: done ? "rgba(74,222,128,0.05)" : "transparent",
                              transition: "background 0.15s",
                            }}
                          >
                            <div style={{ marginTop: 2, flexShrink: 0 }}>
                              {done
                                ? <CheckCircle2 size={18} color="#4ade80" />
                                : <Circle size={18} color="var(--border)" />
                              }
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: 14, fontWeight: 600,
                                color: done ? "var(--text-muted)" : "var(--text)",
                                textDecoration: done ? "line-through" : "none",
                                marginBottom: 4,
                              }}>
                                {ex.name}
                              </div>
                              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <span style={{
                                  fontSize: 12, color: "#60a5fa", fontWeight: 600,
                                  background: "rgba(96,165,250,0.1)", borderRadius: 6, padding: "2px 8px",
                                }}>
                                  {ex.sets} sets × {ex.reps}
                                </span>
                                <span style={{
                                  fontSize: 12, color: "var(--text-muted)", fontWeight: 500,
                                  background: "var(--surface-2)", borderRadius: 6, padding: "2px 8px",
                                }}>
                                  Rest: {ex.rest}
                                </span>
                              </div>
                              {ex.notes && (
                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontStyle: "italic" }}>
                                  {ex.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tips */}
            {plan.tips && plan.tips.length > 0 && (
              <div style={{
                background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.25)",
                borderRadius: 16,
                padding: 20,
                marginTop: 8,
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#a78bfa" }}>
                  💡 Pro Tips
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.tips.map((tip, i) => (
                    <li key={i} style={{ fontSize: 14, color: "var(--text-muted)", display: "flex", gap: 8 }}>
                      <span style={{ color: "#a78bfa", flexShrink: 0 }}>•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
