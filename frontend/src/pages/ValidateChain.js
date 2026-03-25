import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

export default function ValidateChain() {
  const navigate = useNavigate();
  const userId   = localStorage.getItem("user_id");

  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState("");
  const [error,     setError]     = useState("");

  function runValidation() {
    setLoading(true); setError(""); setResult(null);
    api.get("/api/audit/validate")
      .then(r => setResult(r.data))
      .catch(() => setError("Failed to run chain validation. Is the backend running?"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!userId) { navigate("/"); return; }
    runValidation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, navigate]);

  async function handleRebuild() {
    setRebuilding(true); setRebuildMsg(""); setError("");
    try {
      const res = await api.post("/api/audit/rechain");
      setRebuildMsg(res.data.message || "Chain rebuilt successfully.");
      // Re-validate so the banner updates
      runValidation();
    } catch {
      setError("Chain rebuild failed. Please try again.");
    } finally {
      setRebuilding(false);
    }
  }

  const isValid = result?.status === "valid";
  const broken  = result?.invalid_log_ids || [];
  const total   = result?.total_records ?? null;

  return (
    <div className="ehr-shell">
      <Sidebar activeItem="validate" />
      <main className="ehr-main">
        <div className="ehr-topbar">
          <div className="ehr-breadcrumb">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <i className="bi bi-chevron-right" style={{ fontSize: 10 }} />
            <span>Validate Chain</span>
          </div>
          <div className="ehr-topbar-title" />
          <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={runValidation} disabled={loading || rebuilding}>
            <i className="bi bi-arrow-clockwise" /> Re-run Validation
          </button>
        </div>

        <div className="ehr-content">
          <div className="ehr-page-header">
            <div className="ehr-page-title">Audit Chain Validation</div>
            <div className="ehr-page-sub">Verify SHA-256 hash chain integrity across all encrypted records</div>
          </div>

          {error      && <div className="ehr-alert ehr-alert-error"><i className="bi bi-exclamation-circle-fill" />{error}</div>}
          {rebuildMsg && <div className="ehr-alert ehr-alert-success"><i className="bi bi-check-circle-fill" />{rebuildMsg}</div>}

          {loading ? (
            <div style={{ textAlign: "center", padding: 64 }}>
              <div className="ehr-spinner ehr-spinner-dark" style={{ margin: "0 auto 16px", width: 32, height: 32, borderWidth: 3 }} />
              <div style={{ fontSize: 15, color: "var(--text-muted)" }}>Checking hash chain integrity…</div>
              <div style={{ fontSize: 13, color: "var(--text-disabled)", marginTop: 6 }}>Computing SHA-256 hashes across all records</div>
            </div>
          ) : result && (
            <>
              {/* ── Status banner ── */}
              <div className={`ehr-chain-status ${isValid ? "valid" : "broken"}`} style={{ marginBottom: 24 }}>
                <div className="ehr-chain-status-icon">
                  <i className={`bi ${isValid ? "bi-shield-fill-check" : "bi-shield-fill-exclamation"}`} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ehr-chain-status-title">
                    {isValid ? "Audit Chain Verified" : "Chain Integrity Violation Detected"}
                  </div>
                  <div className="ehr-chain-status-sub">
                    {isValid
                      ? `All ${total != null ? total + " " : ""}records pass SHA-256 hash verification. No tampering detected.`
                      : `${broken.length} record${broken.length !== 1 ? "s" : ""} failed hash verification. Use Rebuild Chain to restore integrity.`
                    }
                  </div>
                </div>

                {/* Rebuild button lives inside the banner when broken */}
                {!isValid && (
                  <button
                    className="ehr-btn ehr-btn-primary"
                    onClick={handleRebuild}
                    disabled={rebuilding}
                    style={{ flexShrink: 0, marginLeft: 8 }}
                  >
                    {rebuilding
                      ? <><div className="ehr-spinner" />Rebuilding…</>
                      : <><i className="bi bi-wrench-adjustable-circle-fill" />Rebuild Chain</>
                    }
                  </button>
                )}
              </div>

              {/* ── What does "Rebuild Chain" actually do? ── */}
              {!isValid && (
                <div className="ehr-alert ehr-alert-info" style={{ marginBottom: 24 }}>
                  <i className="bi bi-info-circle-fill" />
                  <div>
                    <strong>What Rebuild Chain does:</strong> It recomputes the SHA-256 hash for every record in chronological order, re-linking them into a valid chain. This is safe — it only updates the <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, background: "var(--blue-mid)", padding: "1px 5px", borderRadius: 3 }}>record_hash</code> field and does not modify any clinical data, encryption keys, or timestamps. Records added through SecureEHR going forward will chain correctly automatically.
                  </div>
                </div>
              )}

              {/* ── Stat tiles ── */}
              <div className="ehr-grid-3" style={{ marginBottom: 28 }}>
                <div className="ehr-stat-tile">
                  <div className="ehr-stat-label">Records Checked</div>
                  <div className="ehr-stat-value">{total ?? "—"}</div>
                  <div className="ehr-stat-sub">Total audit log entries</div>
                  <div className="ehr-stat-icon" style={{ background: "var(--blue-light)", color: "var(--blue)" }}>
                    <i className="bi bi-journal-check" />
                  </div>
                </div>
                <div className="ehr-stat-tile">
                  <div className="ehr-stat-label">Hash Algorithm</div>
                  <div className="ehr-stat-value" style={{ fontSize: 20, marginTop: 6, fontFamily: "var(--font-mono)" }}>SHA-256</div>
                  <div className="ehr-stat-sub">Blockchain-style chaining</div>
                  <div className="ehr-stat-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}>
                    <i className="bi bi-link-45deg" />
                  </div>
                </div>
                <div className="ehr-stat-tile">
                  <div className="ehr-stat-label">Violations Found</div>
                  <div className="ehr-stat-value" style={{ color: broken.length > 0 ? "var(--red)" : "var(--green)" }}>
                    {broken.length}
                  </div>
                  <div className="ehr-stat-sub">{broken.length === 0 ? "No tampering detected" : "Records with invalid hashes"}</div>
                  <div className="ehr-stat-icon" style={{ background: broken.length > 0 ? "var(--red-light)" : "var(--green-light)", color: broken.length > 0 ? "var(--red)" : "var(--green)" }}>
                    <i className={`bi ${broken.length > 0 ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"}`} />
                  </div>
                </div>
              </div>

              {/* ── Broken record IDs ── */}
              {broken.length > 0 && (
                <div className="ehr-card" style={{ marginBottom: 24 }}>
                  <div className="ehr-card-header">
                    <i className="bi bi-exclamation-triangle-fill" style={{ color: "var(--red)" }} />
                    <span className="ehr-card-title" style={{ color: "var(--red)" }}>Records with Invalid Hashes</span>
                    <span className="ehr-badge ehr-badge-red">{broken.length} violation{broken.length !== 1 ? "s" : ""}</span>
                    <button className="ehr-btn ehr-btn-primary ehr-btn-sm" onClick={handleRebuild} disabled={rebuilding}>
                      {rebuilding ? <><div className="ehr-spinner" />Rebuilding…</> : <><i className="bi bi-wrench-adjustable-circle-fill" />Rebuild Chain</>}
                    </button>
                  </div>
                  <div className="ehr-card-body">
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                      The records below failed SHA-256 hash verification. This typically happens when records were added before the chain-linking logic was in place (a known migration issue), or if data was modified outside SecureEHR. Click <strong>Rebuild Chain</strong> to restore a valid chain without touching any clinical data.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {broken.map(id => (
                        <div key={id} style={{ padding: "6px 14px", background: "var(--red-light)", border: "1px solid #F5B7B1", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--red)" }}>
                          #{id}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── How it works ── */}
              <div className="ehr-card" style={{ marginBottom: 24 }}>
                <div className="ehr-card-header">
                  <i className="bi bi-info-circle" style={{ color: "var(--blue)" }} />
                  <span className="ehr-card-title">How Hash Chaining Works</span>
                </div>
                <div className="ehr-card-body">
                  <div className="ehr-grid-3">
                    {[
                      { icon: "bi-shield-lock-fill", title: "Encryption at Rest",    desc: "Every record is encrypted with AES-128 + RSA-2048 before storage. No plaintext ever touches the database.",          color: "var(--blue)"  },
                      { icon: "bi-link-45deg",        title: "SHA-256 Hash Chain",   desc: "Each record stores the SHA-256 hash of its predecessor's fields, forming a tamper-evident chain from genesis.",          color: "var(--teal)"  },
                      { icon: "bi-search",            title: "Tamper Detection",     desc: "Any modification to a past record invalidates every subsequent hash. This page detects and surfaces those breaks.",      color: "var(--amber)" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: item.color, flexShrink: 0 }}>
                          <i className={`bi ${item.icon}`} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Valid confirmation ── */}
              {isValid && (
                <div className="ehr-alert ehr-alert-success">
                  <i className="bi bi-shield-fill-check" />
                  <div>
                    <strong>Chain integrity confirmed.</strong> All {total != null ? total : ""} audit records have valid SHA-256 hashes linking back to the genesis record. No records have been altered, deleted, or injected outside of SecureEHR.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
