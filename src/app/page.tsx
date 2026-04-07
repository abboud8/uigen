"use client";

import Link from "next/link";
import { Activity, Utensils, Dumbbell, MessageCircleHeart, ArrowRight, Flame, Target, TrendingUp } from "lucide-react";

const features = [
  {
    href: "/calorie-tracker",
    icon: Utensils,
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
    title: "Calorie Tracker",
    description: "Log meals, track macros, and monitor your daily nutrition intake with smart food search.",
    stat: "Track every bite",
  },
  {
    href: "/workout-planner",
    icon: Dumbbell,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    title: "Workout Planner",
    description: "Generate AI-powered workout plans tailored to your goals, fitness level, and available equipment.",
    stat: "Personalized plans",
  },
  {
    href: "/health-guide",
    icon: MessageCircleHeart,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    title: "Health Guide",
    description: "Ask your personal AI health coach anything about nutrition, exercise, sleep, and wellness.",
    stat: "24/7 AI support",
  },
];

const stats = [
  { icon: Flame, label: "Calories Burned", value: "Start tracking", color: "#fb923c" },
  { icon: Target, label: "Goals Set", value: "Set your goals", color: "#4ade80" },
  { icon: TrendingUp, label: "Progress", value: "Begin today", color: "#60a5fa" },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--surface)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #4ade80, #60a5fa)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>FitTrack</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {features.map((f) => (
            <Link key={f.href} href={f.href} style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.15s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text)";
                (e.currentTarget as HTMLElement).style.borderColor = f.color;
                (e.currentTarget as HTMLElement).style.background = f.bg;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {f.title}
            </Link>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "80px 24px 48px", textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
          borderRadius: 100, padding: "6px 16px", marginBottom: 24,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 500 }}>Your Personal Health Companion</span>
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 6vw, 56px)",
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 20,
          background: "linear-gradient(135deg, #e8eaf6 0%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Track, Plan & Achieve<br />Your Health Goals
        </h1>

        <p style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 40 }}>
          A complete health toolkit — log your calories, generate personalized workout plans,
          and get instant answers from your AI health guide.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/calorie-tracker" style={{
            padding: "14px 28px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#0f1117",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            Get Started <ArrowRight size={16} />
          </Link>
          <Link href="/health-guide" style={{
            padding: "14px 28px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 15,
          }}>
            Ask Health Guide
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        maxWidth: 900, margin: "0 auto", padding: "0 24px 48px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16,
      }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${s.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={22} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature cards */}
      <div style={{
        maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20,
      }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.href} href={f.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 28,
                height: "100%",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = f.color;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = `0 12px 40px ${f.color}20`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--border)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: f.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <Icon size={26} color={f.color} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{f.title}</h3>
                  <ArrowRight size={16} color={f.color} />
                </div>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
                  {f.description}
                </p>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: f.color,
                  background: f.bg,
                  padding: "4px 12px",
                  borderRadius: 100,
                  display: "inline-block",
                }}>
                  {f.stat}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
