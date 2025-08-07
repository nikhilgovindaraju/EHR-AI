import React, { useState, useEffect, useRef } from "react";
import "../styles/chatbot.css";
import axios from "../services/api";
import swoosh from "../assets/woosh.wav"; // 🛠️ Add this sound file in src/assets/

function AuditChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: "bot", text: "👋 Hi! I’m your SecureEHR Assistant. How can I help today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  const quickQuestions = [
    "How many patients are there?",
    "List patient IDs.",
    "When was the last visit?",
    "Show all diagnoses."
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const playSound = () => {
    audioRef.current?.play();
  };

  const sendMessage = async (msg) => {
    const content = msg || input.trim();
    if (!content) return;
  
    const userMessage = { type: "user", text: content };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    playSound();
    setLoading(true);
  
    const lower = content.toLowerCase();
  
    // 🧠 Handle via backend SQL-based FAQs
    const isFAQ = lower.includes("how many") ||
                  lower.includes("list patient") ||
                  lower.includes("last visit") ||
                  lower.includes("diagnoses") ||
                  lower.includes("summary") ||
                  lower.includes("patient detail") ||
                  lower.includes("recent visit");
  
    try {
      let res;
  
      if (isFAQ) {
        // If asking for patient summary, optionally add patient ID
        const payload = { question: content };
        const pid = content.match(/patient\s+(\w+)/i)?.[1];
        if (pid) payload.patient_id = pid;
  
        res = await axios.post("/api/audit/faq-query", payload);
      } else {
        // Fallback to OpenAI if it's a general question
        res = await axios.post("/api/audit/chatbot", { message: content });
      }
  
      const reply = res.data.reply || "🤖 I couldn't find the answer to that.";
      setMessages((prev) => [...prev, { type: "bot", text: reply }]);
      playSound();
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "❌ Error processing your request." }
      ]);
    } finally {
      setLoading(false);
    }
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

          <div className="chatbot-body">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.type}`}>{msg.text}</div>
            ))}
            {loading && <div className="message bot">⏳ Typing...</div>}
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
              placeholder="Type a message..."
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
