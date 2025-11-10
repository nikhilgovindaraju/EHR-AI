import React, { useState, useEffect, useRef } from "react";
import "../styles/chatbot.css";
import axios from "../services/api";
import swoosh from "../assets/woosh.wav";

function AuditChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", text: "👋 Hi! I’m your SecureEHR Assistant. Ask about a patient or your recent cases." }
  ]);
  const [input, setInput] = useState("");
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContextIdx, setShowContextIdx] = useState(null);

  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  const storedPatientId = (localStorage.getItem("patient_id") || "").trim();

useEffect(() => {
  if (role === "patient") {
    setPatientId(storedPatientId || userId || "");
  }
}, [role, storedPatientId, userId]);

  const quickQuestions = [
    "Show Patient1’s last visit summary",
    "List the most common diagnosis in my last 10 cases",
    "Summarize medications for Patient1",
    "When was the last visit?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const playSound = () => audioRef.current?.play();

  const sendMessage = async (preset) => {
    const content = preset || input.trim();
    if (!content) return;

    setMessages((prev) => [...prev, { type: "user", text: content }]);
    setInput("");
    playSound();
    setLoading(true);

    try {
      const { data } = await axios.post("/api/audit/chat", {
        user_id: userId,
        role,
        question: content,
        patient_id: role === "patient" ? (patientId || userId) : (patientId || undefined),
        patient_name: role === "patient" ? userId : undefined,
      });

      const botMsg = {
        type: "bot",
        text: data?.answer || "🤖 I couldn't find the answer to that.",
        stats: data?.stats || null,
        rows: Array.isArray(data?.rows) ? data.rows : [],
      };
      setMessages((prev) => [...prev, botMsg]);
      playSound();
    } catch (err) {
      console.error("Chat error:", err?.response?.data || err.message);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "❌ Error processing your request." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const StatChips = ({ stats }) => {
    if (!stats) return null;
    const diag = (stats.top_diagnoses || []).map(([d, c]) => `${d} (${c})`).join(", ");
    const meds = (stats.top_medications || []).map(([m, c]) => `${m} (${c})`).join(", ");
    return (
      <div className="chatbot-stats">
        <span className="chip">Total logs: {stats.total_logs}</span>
        {stats.last_visit && <span className="chip">Last visit: {new Date(stats.last_visit).toLocaleString()}</span>}
        {diag && <span className="chip">Top Dx: {diag}</span>}
        {meds && <span className="chip">Top Meds: {meds}</span>}
      </div>
    );
  };

  const ContextTable = ({ rows }) => {
    if (!rows || rows.length === 0) return <div className="text-muted">No context records.</div>;
    return (
      <div className="ctx-table-wrap">
        <table className="ctx-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Patient</th>
              <th>Age</th>
              <th>Diagnosis</th>
              <th>Medication</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.timestamp ? new Date(r.timestamp).toLocaleString() : "—"}</td>
                <td>{r.patient_name || r.patient_id || "—"}</td>
                <td>{r.age ?? "—"}</td>
                <td>{r.diagnosis || "—"}</td>
                <td>{r.medication || "—"}</td>
                <td>{(r.notes || "").toString().trim() || "—"}</td>
                <td>{r.action || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <audio ref={audioRef} src={swoosh} preload="auto" />
      {!open && (
        <div className="chatbot-button" onClick={() => setOpen(true)}>
          <i className="bi bi-chat-dots-fill"></i>
        </div>
      )}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>SecureEHR Assistant</span>
            <button className="close-btn" onClick={() => setOpen(false)}>
              &times;
            </button>
          </div>

          {/* Optional target patient */}
          <div className="chatbot-toolbar">
            <input
              className="chatbot-patient"
              placeholder="(Optional) Patient ID, e.g., Patient1"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
          </div>

          <div className="chatbot-body">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.type}`}>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>

                {/* Render stats + toggle for context when present */}
                {m.type === "bot" && (!/^(last visit:|medications mentioned|your doctor|recent visits summary)/i.test(m.text)) && (m.stats || (m.rows && m.rows.length > 0)) && (
                  <>
                    <StatChips stats={m.stats} />
                    <button
                      className="ctx-toggle"
                      onClick={() => setShowContextIdx(showContextIdx === i ? null : i)}
                    >
                      {showContextIdx === i ? "Hide context ▲" : "Show context ▼"}
                    </button>
                    {showContextIdx === i && <ContextTable rows={m.rows} />}
                  </>
                )}
              </div>
            ))}
            {loading && <div className="message bot">⏳ Thinking…</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-faq">
            {quickQuestions.map((q, idx) => (
              <button key={idx} onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              placeholder='Try: "Show Patient1’s last visit summary"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={() => sendMessage()}>
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AuditChatbot;

