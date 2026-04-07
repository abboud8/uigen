"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, MessageCircleHeart, Send, Loader2, User, Bot,
  Sparkles, RefreshCw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "How many calories should I eat to lose weight?",
  "What's the best time to work out?",
  "How much protein do I need daily?",
  "What foods help build muscle?",
  "How do I improve my sleep quality?",
  "What's the difference between cardio and strength training?",
  "How do I stay motivated to exercise?",
  "What should I eat before and after a workout?",
  "How much water should I drink per day?",
  "What are the benefits of intermittent fasting?",
];

function uid() {
  return Math.random().toString(36).slice(2);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      gap: 10,
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-end",
      marginBottom: 16,
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: isUser ? "rgba(96,165,250,0.2)" : "rgba(167,139,250,0.2)",
        border: `1.5px solid ${isUser ? "rgba(96,165,250,0.4)" : "rgba(167,139,250,0.4)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isUser
          ? <User size={15} color="#60a5fa" />
          : <Bot size={15} color="#a78bfa" />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div style={{
          padding: "12px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser
            ? "linear-gradient(135deg, rgba(96,165,250,0.2), rgba(59,130,246,0.15))"
            : "var(--surface-2)",
          border: `1px solid ${isUser ? "rgba(96,165,250,0.3)" : "var(--border)"}`,
          fontSize: 14,
          lineHeight: 1.65,
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, padding: "0 4px" }}>
          {formatTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function HealthGuide() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your personal health guide 👋\n\nI can answer questions about nutrition, exercise, sleep, recovery, mental wellness, and more. Ask me anything — I'm here to help you on your health journey!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: uid(), role: "user", content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/health-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response");

      const assistantMsg: Message = { id: uid(), role: "assistant", content: data.reply, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message);
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const clearConversation = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your personal health guide 👋\n\nI can answer questions about nutrition, exercise, sleep, recovery, mental wellness, and more. Ask me anything — I'm here to help you on your health journey!",
      timestamp: new Date(),
    }]);
    setError(null);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>
      {/* Header */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexShrink: 0,
        zIndex: 40,
      }}>
        <Link href="/" style={{ color: "var(--text-muted)", display: "flex" }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(167,139,250,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MessageCircleHeart size={20} color="#a78bfa" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Health Guide</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>AI Health Coach · Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearConversation}
          style={{
            marginLeft: "auto",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "7px 14px",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={13} /> Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 16px",
        maxWidth: 800,
        width: "100%",
        margin: "0 auto",
        alignSelf: "stretch",
      }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(167,139,250,0.2)",
              border: "1.5px solid rgba(167,139,250,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Bot size={15} color="#a78bfa" />
            </div>
            <div style={{
              padding: "14px 18px",
              borderRadius: "18px 18px 18px 4px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#a78bfa",
                animation: "bounce 1s infinite",
              }} />
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#a78bfa",
                animation: "bounce 1s 0.2s infinite",
              }} />
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: "#a78bfa",
                animation: "bounce 1s 0.4s infinite",
              }} />
            </div>
          </div>
        )}

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
            {error} — please try again.
          </div>
        )}

        {/* Suggested questions (show only at start) */}
        {messages.length === 1 && !loading && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={13} /> Suggested questions
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#a78bfa";
                    (e.currentTarget as HTMLElement).style.color = "#a78bfa";
                    (e.currentTarget as HTMLElement).style.background = "rgba(167,139,250,0.08)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "16px",
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 800,
          margin: "0 auto",
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
        }}>
          <div style={{
            flex: 1,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "10px 16px",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            transition: "border-color 0.15s",
          }}
            onFocus={(e) => (e.currentTarget as HTMLElement).style.borderColor = "#a78bfa"}
            onBlur={(e) => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about health, fitness, nutrition..."
              rows={1}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontSize: 14,
                lineHeight: 1.5,
                resize: "none",
                maxHeight: 120,
                overflowY: "auto",
                fontFamily: "inherit",
              }}
            />
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44,
              borderRadius: 12,
              border: "none",
              background: !input.trim() || loading
                ? "var(--surface-2)"
                : "linear-gradient(135deg, #a78bfa, #8b5cf6)",
              color: !input.trim() || loading ? "var(--text-muted)" : "#fff",
              cursor: !input.trim() || loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            {loading
              ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              : <Send size={18} />
            }
          </button>
        </div>
        <div style={{ maxWidth: 800, margin: "8px auto 0", textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Press Enter to send · Shift+Enter for new line · For medical issues, consult a doctor
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
