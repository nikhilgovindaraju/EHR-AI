import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";

/* ── Role-specific quick suggestions ─────────────────────────────────────── */
const ROLE_SUGGESTIONS = {
  doctor: [
    "Summarize today's patients",
    "List recent diagnoses",
    "Show medication trends",
    "Which patients were seen this week?",
    "Most common condition?",
  ],
  auditor: [
    "How many records are in the system?",
    "How many unique patients?",
    "Most common diagnosis?",
    "Show recent activity",
    "Any anomalies in records?",
  ],
  patient: [
    "What was my last visit?",
    "What medications am I on?",
    "Show my diagnosis history",
    "Summarize my health records",
    "When was I last seen?",
  ],
};

const ROLE_META = {
  doctor:  { label: "Clinical Assistant",   sub: "Patient records & clinical insights", icon: "bi-hospital",         color: "#0052CC" },
  auditor: { label: "Compliance Assistant", sub: "Audit trails & data integrity",       icon: "bi-clipboard-check",  color: "#006D6D" },
  patient: { label: "Health Assistant",     sub: "Your personal health summary",        icon: "bi-heart-pulse-fill", color: "#1A6B3C" },
};

/* ── Render bot message with bullet list support ──────────────────────────── */
function BotMessage({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let bullets = [];

  lines.forEach(line => {
    const t = line.trim();
    if (t.startsWith("•") || t.startsWith("-") || t.startsWith("*")) {
      bullets.push(t.replace(/^[•\-*]\s*/, ""));
    } else {
      if (bullets.length) { blocks.push({ type: "bullets", items: [...bullets] }); bullets = []; }
      if (t) blocks.push({ type: "text", content: t });
    }
  });
  if (bullets.length) blocks.push({ type: "bullets", items: bullets });

  return (
    <div>
      {blocks.map((b, i) =>
        b.type === "bullets" ? (
          <ul key={i} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
            {b.items.map((item, j) => (
              <li key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
                <span style={{ color: "var(--blue)", fontWeight: 700, flexShrink: 0 }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} style={{ margin: i === 0 ? 0 : "6px 0 0", lineHeight: 1.6 }}>{b.content}</p>
        )
      )}
    </div>
  );
}

function fmtDate(ts) {
  if (!ts) return null;
  try { return new Date(ts).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return ts; }
}

/* ── Role badge ───────────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const colors = { doctor: "#0052CC", auditor: "#006D6D", patient: "#1A6B3C" };
  const labels = { doctor: "Doctor view", auditor: "Auditor view", patient: "Patient view" };
  const c = colors[role] || "#0052CC";
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
      background: `${c}22`, color: c, border: `1px solid ${c}44`,
    }}>
      {labels[role] || role}
    </span>
  );
}

export default function AuditChatbot() {
  const userId = localStorage.getItem("user_id") || "";
  const role   = (localStorage.getItem("role") || "doctor").toLowerCase();

  const meta        = ROLE_META[role]   || ROLE_META.doctor;
  const suggestions = ROLE_SUGGESTIONS[role] || ROLE_SUGGESTIONS.doctor;

  const WELCOME = {
    doctor:  `Hi Dr. ${userId}! I can help you review patient records, diagnoses, medications, and visit history. What would you like to know?`,
    auditor: `Hello, ${userId}. I'm your compliance assistant. I can query record counts, flag anomalies, and summarize audit data. What do you need?`,
    patient: `Hi ${userId}! I'm here to help you understand your health records in plain language. Feel free to ask about your visits, medications, or diagnoses.`,
  };

  const [open, setOpen]           = useState(false);
  const [patientId, setPatientId] = useState("");
  const [messages, setMessages]   = useState([
    { role: "bot", text: WELCOME[role] || WELCOME.doctor },
  ]);
  const [input, setInput]     = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, thinking]);

  async function sendMessage(text) {
    const q = (text || input).trim();
    if (!q) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setThinking(true);
    try {
      const res = await api.post("/api/audit/chat", {
        user_id:    userId,
        role,
        question:   q,
        patient_id: patientId || undefined,
        limit:      20,
      });
      const data  = res.data;
      setMessages(m => [...m, {
        role:   "bot",
        text:   data.answer || "I couldn't find an answer to that.",
        stats:  data.stats || {},
      }]);
    } catch {
      setMessages(m => [...m, {
        role: "bot",
        text: "Sorry, I couldn't reach the AI service right now. Please check your connection and try again.",
      }]);
    } finally { setThinking(false); }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const headerColor = meta.color;

  return (
    <>
      {/* FAB */}
      <button
        className="ehr-chatbot-fab"
        onClick={() => setOpen(o => !o)}
        title={meta.label}
        style={{ background: `linear-gradient(135deg, ${headerColor}, ${headerColor}CC)` }}
      >
        <i className={`bi ${open ? "bi-x-lg" : meta.icon}`} />
      </button>

      {open && (
        <div className="ehr-chatbot-window">
          {/* Header — colour-coded by role */}
          <div className="ehr-chat-header" style={{ background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}CC 100%)` }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
            }}>
              <i className={`bi ${meta.icon}`} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="ehr-chat-header-title">{meta.label}</span>
                <RoleBadge role={role} />
              </div>
              <div className="ehr-chat-header-sub">{meta.sub}</div>
            </div>
            <button className="ehr-chat-close" onClick={() => setOpen(false)}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Patient filter — only for doctor / auditor */}
          {role !== "patient" && (
            <div className="ehr-chat-patient-bar">
              <input
                placeholder={role === "auditor" ? "Filter by patient ID to drill down…" : "Filter by patient ID (optional)…"}
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
              />
            </div>
          )}

          {/* Messages */}
          <div className="ehr-chat-body" ref={bodyRef}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div className={`ehr-chat-msg ${msg.role}`} style={msg.role === "user" ? { background: headerColor } : {}}>
                  {msg.role === "bot" ? <BotMessage text={msg.text} /> : msg.text}
                </div>

                {msg.role === "bot" && msg.stats && (
                  <div className="ehr-chat-stats">
                    {msg.stats.total_logs > 0 && (
                      <span className="ehr-chat-chip">
                        <i className="bi bi-journal" style={{ marginRight: 4 }} />
                        {msg.stats.total_logs} record{msg.stats.total_logs !== 1 ? "s" : ""}
                      </span>
                    )}
                    {msg.stats.last_visit && (
                      <span className="ehr-chat-chip">
                        <i className="bi bi-calendar3" style={{ marginRight: 4 }} />
                        {fmtDate(msg.stats.last_visit)}
                      </span>
                    )}
                    {(msg.stats.top_diagnoses || []).slice(0, 2).map(([dx], j) => (
                      <span key={j} className="ehr-chat-chip">{dx}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="ehr-chat-thinking">
                <span>●</span><span>●</span><span>●</span>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="ehr-chat-suggestions">
            {suggestions.map((s, i) => (
              <button key={i} className="ehr-chat-suggestion" onClick={() => sendMessage(s)}
                style={{ borderColor: `${headerColor}44`, color: headerColor, background: `${headerColor}12` }}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="ehr-chat-input-row">
            <input
              placeholder={
                role === "patient"  ? "Ask about your health records…" :
                role === "auditor"  ? "Query records, counts, anomalies…" :
                                     "Ask about patients or diagnoses…"
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={thinking}
            />
            <button
              className="ehr-chat-send"
              onClick={() => sendMessage()}
              disabled={thinking || !input.trim()}
              style={{ background: headerColor }}
            >
              <i className="bi bi-send-fill" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
