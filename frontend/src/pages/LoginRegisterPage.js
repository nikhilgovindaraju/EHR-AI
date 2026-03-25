import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

/* ─── Animated floating particles ─────────────────────────────────────────── */
function Particle({ style }) {
  return <div style={{ position: "absolute", borderRadius: "50%", pointerEvents: "none", ...style }} />;
}

const PARTICLES = [
  { width: 180, height: 180, top: "-60px", left: "-60px",   background: "rgba(77,158,255,0.08)", animation: "floatA 8s ease-in-out infinite" },
  { width: 120, height: 120, top: "30%",   right: "-30px",  background: "rgba(0,82,204,0.12)",   animation: "floatB 11s ease-in-out infinite" },
  { width: 80,  height: 80,  bottom: "15%",left: "20%",     background: "rgba(77,158,255,0.06)", animation: "floatA 9s ease-in-out infinite 2s" },
  { width: 220, height: 220, bottom: "-80px",right: "-80px", background: "rgba(0,52,120,0.25)",  animation: "floatB 13s ease-in-out infinite 1s" },
  { width: 60,  height: 60,  top: "55%",   left: "10%",     background: "rgba(77,158,255,0.10)", animation: "floatA 7s ease-in-out infinite 3s" },
];

const STATS = [
  { value: "128-bit", label: "AES Key" },
  { value: "2048-bit", label: "RSA Key" },
  { value: "SHA-256", label: "Hash Chain" },
  { value: "RBAC", label: "Access Control" },
];

const FEATURES = [
  { icon: "bi-shield-lock-fill", label: "End-to-end AES-128 + RSA-2048 encryption" },
  { icon: "bi-link-45deg",       label: "Blockchain-style SHA-256 audit chain" },
  { icon: "bi-people-fill",      label: "Doctor · Auditor · Patient role scoping" },
  { icon: "bi-robot",            label: "GPT-4o clinical AI over encrypted records" },
];

/* ─── Hex grid decoration (pure CSS) ──────────────────────────────────────── */
function HexGrid() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: 0.07 }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 40, height: 46,
          left: `${(i % 8) * 60 + ((Math.floor(i / 8) % 2) * 30)}px`,
          top:  `${Math.floor(i / 8) * 52}px`,
          border: "1px solid #4D9EFF",
          clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        }} />
      ))}
    </div>
  );
}

export default function LoginRegisterPage() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState("login");
  const [userId, setUserId]     = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("doctor");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!userId || !password) { setError("Please enter your User ID and password."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.post("/api/login", { user_id: userId, password, role });
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("role",    res.data.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally { setLoading(false); }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!userId || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.post("/api/register", { user_id: userId, password, role });
      setSuccess("Account created! You can now sign in.");
      setTab("login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. User ID may already exist.");
    } finally { setLoading(false); }
  }

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes floatA { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-18px) scale(1.06)} }
        @keyframes floatB { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,10px) scale(0.94)} }
        @keyframes pulse  { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(77,158,255,0.3)} 50%{box-shadow:0 0 40px rgba(77,158,255,0.6)} }
        .login-feature-row { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:10px; background:rgba(77,158,255,0.06); border:1px solid rgba(77,158,255,0.12); transition:background 0.2s; }
        .login-feature-row:hover { background:rgba(77,158,255,0.12); }
        .login-stat { text-align:center; flex:1; }
        .ehr-input-styled:focus { border-color:#0052CC !important; box-shadow:0 0 0 3px rgba(0,82,204,0.15) !important; }
        .login-tab-btn { flex:1; padding:10px 0; border-radius:8px; border:none; cursor:pointer; font-size:14px; font-weight:500; transition:all 0.18s; font-family:var(--font-body); }
        .login-tab-active { background:#fff; color:#0D1117; box-shadow:0 1px 6px rgba(0,0,0,0.12); }
        .login-tab-inactive { background:transparent; color:#718096; }
        .signin-btn { background:linear-gradient(135deg,#0052CC 0%,#0A6EFF 100%); color:#fff; border:none; border-radius:10px; padding:14px 24px; font-size:15px; font-weight:600; width:100%; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.18s; font-family:var(--font-body); }
        .signin-btn:hover:not(:disabled) { background:linear-gradient(135deg,#0043A8 0%,#0052CC 100%); transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,82,204,0.35); }
        .signin-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", background: "#F0F2F5" }}>

        {/* ── LEFT BRAND PANEL ───────────────────────────────────────────────── */}
        <div style={{
          width: 480, flexShrink: 0,
          background: "linear-gradient(160deg, #0A0F1E 0%, #0F1724 45%, #0D1A3A 100%)",
          display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden",
        }}>
          <HexGrid />
          {PARTICLES.map((p, i) => <Particle key={i} style={p} />)}

          {/* Glowing top accent line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #4D9EFF, #0052CC, transparent)" }} />

          <div style={{ position: "relative", zIndex: 2, padding: "48px 44px", display: "flex", flexDirection: "column", flex: 1 }}>

            {/* Logo */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16, marginBottom: 52,
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp 0.5s ease forwards" : "none",
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, #0052CC, #4D9EFF)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, color: "#fff",
                boxShadow: "0 4px 20px rgba(0,82,204,0.45)",
                animation: "glowPulse 3s ease-in-out infinite",
              }}>
                <i className="bi bi-shield-fill-check" />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>SecureEHR</div>
                <div style={{ fontSize: 12, color: "#4D9EFF", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>Clinical Records Platform</div>
              </div>
            </div>

            {/* Hero headline */}
            <div style={{
              marginBottom: 36,
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp 0.5s ease 0.1s forwards" : "none",
            }}>
              <h1 style={{ fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 14, letterSpacing: "-0.03em" }}>
                Secure.<br />
                <span style={{ background: "linear-gradient(90deg, #4D9EFF, #6BB8FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Auditable.</span><br />
                Intelligent.
              </h1>
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7, maxWidth: 320 }}>
                Enterprise-grade medical records with military-strength encryption and AI-powered clinical intelligence.
              </p>
            </div>

            {/* Encryption stats strip */}
            <div style={{
              display: "flex", gap: 0,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, overflow: "hidden",
              marginBottom: 32,
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp 0.5s ease 0.2s forwards" : "none",
            }}>
              {STATS.map((s, i) => (
                <div key={i} className="login-stat" style={{
                  padding: "14px 8px",
                  borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4D9EFF", fontFamily: "var(--font-mono)", marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 8, flex: 1,
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp 0.5s ease 0.3s forwards" : "none",
            }}>
              {FEATURES.map((f, i) => (
                <div key={i} className="login-feature-row">
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(0,82,204,0.6), rgba(77,158,255,0.4))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: "#4D9EFF",
                  }}>
                    <i className={`bi ${f.icon}`} />
                  </div>
                  <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 400, lineHeight: 1.4 }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* Bottom badge row */}
            <div style={{
              marginTop: 32, paddingTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex", gap: 8, flexWrap: "wrap",
              opacity: mounted ? 1 : 0,
              animation: mounted ? "fadeUp 0.5s ease 0.4s forwards" : "none",
            }}>
              {["HIPAA Ready", "256-bit AES", "Chain Audited", "GPT-4o"].map(tag => (
                <div key={tag} style={{
                  fontSize: 11, fontWeight: 600, color: "#4D9EFF",
                  background: "rgba(77,158,255,0.1)",
                  border: "1px solid rgba(77,158,255,0.25)",
                  borderRadius: 100, padding: "4px 12px",
                  letterSpacing: "0.03em",
                }}>{tag}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "48px 40px", position: "relative", overflow: "hidden",
        }}>
          {/* Subtle background accent */}
          <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,82,204,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(77,158,255,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{
            width: "100%", maxWidth: 420, position: "relative", zIndex: 1,
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeUp 0.5s ease 0.15s forwards" : "none",
          }}>
            {/* Card */}
            <div style={{
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}>
              {/* Card header accent */}
              <div style={{ height: 4, background: "linear-gradient(90deg, #0052CC, #4D9EFF, #0052CC)", backgroundSize: "200% 100%", animation: "none" }} />

              <div style={{ padding: "36px 36px 32px" }}>
                {/* Heading */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0052CC", boxShadow: "0 0 8px rgba(0,82,204,0.6)", animation: "pulse 2s ease-in-out infinite" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0052CC", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {tab === "login" ? "Secure Access" : "New Account"}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: "#0D1117", letterSpacing: "-0.02em", marginBottom: 4 }}>
                    {tab === "login" ? "Welcome back" : "Create account"}
                  </h2>
                  <p style={{ fontSize: 14, color: "#718096" }}>
                    {tab === "login"
                      ? "Sign in to access your encrypted clinical workspace."
                      : "Register a new SecureEHR account to get started."}
                  </p>
                </div>

                {/* Tab toggle */}
                <div style={{ display: "flex", background: "#F0F2F5", borderRadius: 10, padding: 4, marginBottom: 28 }}>
                  {["login", "register"].map(t => (
                    <button
                      key={t}
                      onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                      className={`login-tab-btn ${tab === t ? "login-tab-active" : "login-tab-inactive"}`}
                    >
                      {t === "login" ? "Sign In" : "Register"}
                    </button>
                  ))}
                </div>

                {/* Alerts */}
                {error   && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 14px", background: "#FDECEA", border: "1px solid #F5B7B1", borderRadius: 10, marginBottom: 20, fontSize: 14, color: "#7B241C" }}>
                    <i className="bi bi-exclamation-circle-fill" style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 14px", background: "#D4EDDA", border: "1px solid #9BE4B0", borderRadius: 10, marginBottom: 20, fontSize: 14, color: "#1A5E38" }}>
                    <i className="bi bi-check-circle-fill" style={{ flexShrink: 0, marginTop: 1 }} />
                    {success}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={tab === "login" ? handleLogin : handleRegister}>
                  {/* User ID */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      User ID <span style={{ color: "#C0392B" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <i className="bi bi-person" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 16, pointerEvents: "none" }} />
                      <input
                        className="ehr-input-styled"
                        style={{ width: "100%", paddingLeft: 42, paddingRight: 14, paddingTop: 11, paddingBottom: 11, border: "1.5px solid #DDE3EA", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "var(--font-body)", color: "#0D1117", background: "#FAFBFC", boxSizing: "border-box", transition: "all 0.15s" }}
                        placeholder="e.g. dr_smith or patient_001"
                        value={userId}
                        onChange={e => setUserId(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Password <span style={{ color: "#C0392B" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <i className="bi bi-lock" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 16, pointerEvents: "none" }} />
                      <input
                        className="ehr-input-styled"
                        type="password"
                        style={{ width: "100%", paddingLeft: 42, paddingRight: 14, paddingTop: 11, paddingBottom: 11, border: "1.5px solid #DDE3EA", borderRadius: 10, fontSize: 15, outline: "none", fontFamily: "var(--font-body)", color: "#0D1117", background: "#FAFBFC", boxSizing: "border-box", transition: "all 0.15s" }}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Role <span style={{ color: "#C0392B" }}>*</span>
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["doctor", "auditor", "patient"].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          style={{
                            flex: 1, padding: "9px 4px", borderRadius: 10,
                            border: role === r ? "2px solid #0052CC" : "2px solid #DDE3EA",
                            background: role === r ? "#E8F0FE" : "#FAFBFC",
                            color: role === r ? "#0052CC" : "#718096",
                            fontWeight: role === r ? 600 : 400,
                            fontSize: 13, cursor: "pointer",
                            fontFamily: "var(--font-body)",
                            transition: "all 0.14s",
                            textTransform: "capitalize",
                          }}
                        >
                          <i className={`bi ${r === "doctor" ? "bi-hospital" : r === "auditor" ? "bi-clipboard-check" : "bi-person"}`} style={{ display: "block", fontSize: 18, marginBottom: 3 }} />
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button type="submit" className="signin-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        {tab === "login" ? "Signing in…" : "Creating account…"}
                      </>
                    ) : (
                      <>
                        <i className={`bi ${tab === "login" ? "bi-box-arrow-in-right" : "bi-person-plus-fill"}`} />
                        {tab === "login" ? "Sign In to SecureEHR" : "Create Account"}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Card footer */}
              <div style={{ padding: "16px 36px 24px", background: "#F8FAFC", borderTop: "1px solid #F0F2F5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="bi bi-shield-lock-fill" style={{ color: "#0052CC", fontSize: 14 }} />
                  <span style={{ fontSize: 12, color: "#718096", lineHeight: 1.5 }}>
                    Protected by AES-128 encryption · RSA-2048 key pairs · SHA-256 hash chain
                  </span>
                </div>
              </div>
            </div>

            {/* Below-card note */}
            <p style={{ textAlign: "center", fontSize: 12, color: "#A0AEC0", marginTop: 20 }}>
              By signing in you agree to our clinical data handling policy.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
