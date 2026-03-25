import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import AuditChatbot from "./AuditChatbot";

const ACTION_COLOR = { CREATE:"green", MODIFY:"blue", DELETE:"red" };

export default function PatientProfile() {
  const navigate   = useNavigate();
  const { patientId } = useParams();
  const userId     = localStorage.getItem("user_id");
  const role       = localStorage.getItem("role");

  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!userId) { navigate("/"); return; }
    api.get("/api/audit/logs", { params: { role, user_id: userId, patient_id: patientId } })
      .then(r => setLogs(r.data.logs || []))
      .catch(() => setError("Failed to load patient records."))
      .finally(() => setLoading(false));
  }, [userId, role, patientId, navigate]);

  const sorted = useMemo(() =>
    [...logs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)), [logs]);

  const summary = useMemo(() => {
    if (!sorted.length) return null;
    const latest = sorted[0];
    const diagnoses  = [...new Set(sorted.map(l => l.diagnosis).filter(Boolean))];
    const meds       = [...new Set(sorted.map(l => l.medication).filter(Boolean))];
    const lastVisit  = sorted.find(l => l.visit_date)?.visit_date;
    return { latest, diagnoses, meds, lastVisit, totalVisits: sorted.length };
  }, [sorted]);

  return (
    <div className="ehr-shell">
      <Sidebar activeItem="logs" />
      <main className="ehr-main">
        <div className="ehr-topbar">
          <div className="ehr-breadcrumb">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <i className="bi bi-chevron-right" style={{ fontSize:10 }} />
            <button type="button" onClick={() => navigate("/logs")}>Audit Logs</button>
            <i className="bi bi-chevron-right" style={{ fontSize:10 }} />
            <span>Patient: {patientId}</span>
          </div>
          <div className="ehr-topbar-title" />
          {role === "doctor" && (
            <button className="ehr-btn ehr-btn-primary ehr-btn-sm"
              onClick={() => navigate("/add", { state: { prefillPatientId: patientId } })}>
              <i className="bi bi-plus-lg" /> Add New Visit
            </button>
          )}
        </div>

        <div className="ehr-content">
          {error && <div className="ehr-alert ehr-alert-error"><i className="bi bi-exclamation-circle-fill" />{error}</div>}

          {loading ? (
            <div style={{ textAlign:"center", padding:64, color:"var(--text-muted)" }}>
              <div className="ehr-spinner ehr-spinner-dark" style={{ margin:"0 auto 12px" }} />
              Loading patient records…
            </div>
          ) : !summary ? (
            <div className="ehr-empty">
              <div className="ehr-empty-icon"><i className="bi bi-person-x" /></div>
              <div className="ehr-empty-title">No records found</div>
              <div className="ehr-empty-sub">No records exist for patient ID: {patientId}</div>
              {role === "doctor" && (
                <button className="ehr-btn ehr-btn-primary" onClick={() => navigate("/add")}><i className="bi bi-plus-lg" /> Add Record</button>
              )}
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
                <div style={{ display:"flex", gap:18, alignItems:"center" }}>
                  <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--blue)", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, flexShrink:0 }}>
                    {(summary.latest.patient_name || patientId).slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:22, fontWeight:700, color:"var(--text-primary)", letterSpacing:"-0.02em" }}>
                      {summary.latest.patient_name || patientId}
                    </div>
                    <div style={{ fontSize:14, color:"var(--text-muted)", marginTop:2 }}>
                      ID: <span style={{ fontFamily:"var(--font-mono)" }}>{patientId}</span>
                      {summary.latest.age && <> · Age {summary.latest.age}</>}
                      {summary.latest.gender && <> · {summary.latest.gender}</>}
                    </div>
                  </div>
                </div>
                {role === "doctor" && (
                  <button className="ehr-btn ehr-btn-primary"
                    onClick={() => navigate("/add", { state: { prefillPatientId: patientId } })}>
                    <i className="bi bi-plus-lg" /> Add New Visit
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="ehr-grid-4" style={{ marginBottom:28 }}>
                <div className="ehr-stat-tile">
                  <div className="ehr-stat-label">Total Visits</div>
                  <div className="ehr-stat-value">{summary.totalVisits}</div>
                  <div className="ehr-stat-sub">Audit log entries</div>
                  <div className="ehr-stat-icon" style={{ background:"var(--blue-light)", color:"var(--blue)" }}>
                    <i className="bi bi-journal-medical" />
                  </div>
                </div>
                <div className="ehr-stat-tile">
                  <div className="ehr-stat-label">Last Visit</div>
                  <div className="ehr-stat-value" style={{ fontSize:18, marginTop:6 }}>
                    {summary.lastVisit || "—"}
                  </div>
                  <div className="ehr-stat-sub">Most recent encounter</div>
                  <div className="ehr-stat-icon" style={{ background:"var(--teal-light)", color:"var(--teal)" }}>
                    <i className="bi bi-calendar-check" />
                  </div>
                </div>
                <div className="ehr-stat-tile">
                  <div className="ehr-stat-label">Diagnoses</div>
                  <div className="ehr-stat-value">{summary.diagnoses.length}</div>
                  <div className="ehr-stat-sub">Unique conditions</div>
                  <div className="ehr-stat-icon" style={{ background:"var(--amber-light)", color:"var(--amber)" }}>
                    <i className="bi bi-activity" />
                  </div>
                </div>
                <div className="ehr-stat-tile">
                  <div className="ehr-stat-label">Medications</div>
                  <div className="ehr-stat-value">{summary.meds.length}</div>
                  <div className="ehr-stat-sub">Unique medications</div>
                  <div className="ehr-stat-icon" style={{ background:"var(--green-light)", color:"var(--green)" }}>
                    <i className="bi bi-capsule-pill" />
                  </div>
                </div>
              </div>

              <div className="ehr-grid-3" style={{ alignItems:"start" }}>
                {/* Timeline */}
                <div className="ehr-card" style={{ gridColumn:"span 2" }}>
                  <div className="ehr-card-header">
                    <i className="bi bi-clock-history" style={{ color:"var(--blue)" }} />
                    <span className="ehr-card-title">Visit Timeline</span>
                    <span style={{ fontSize:12, color:"var(--text-muted)" }}>{sorted.length} entries</span>
                  </div>
                  <div className="ehr-card-body">
                    <div className="ehr-timeline">
                      {sorted.map((log, i) => (
                        <div key={log.id} className="ehr-timeline-item">
                          <div className="ehr-timeline-left">
                            <div className="ehr-timeline-dot" style={{ background: log.action==="DELETE" ? "var(--red)" : log.action==="MODIFY" ? "var(--blue)" : "var(--green)" }} />
                            {i < sorted.length - 1 && <div className="ehr-timeline-line" />}
                          </div>
                          <div className="ehr-timeline-body">
                            <div className="ehr-timeline-date">
                              {log.visit_date || new Date(log.timestamp).toLocaleDateString()} · {new Date(log.timestamp).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                            </div>
                            <div className="ehr-timeline-card">
                              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                                <span className={`ehr-badge ehr-badge-${ACTION_COLOR[log.action]||"gray"}`}>{log.action}</span>
                                <span style={{ fontSize:13, color:"var(--text-muted)" }}>by {log.user_id}</span>
                              </div>
                              {log.diagnosis && (
                                <div style={{ marginBottom:6 }}>
                                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Diagnosis </span>
                                  <span style={{ fontSize:14 }}>{log.diagnosis}</span>
                                </div>
                              )}
                              {log.medication && (
                                <div style={{ marginBottom:6 }}>
                                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Medication </span>
                                  <span style={{ fontSize:14 }}>{log.medication}</span>
                                </div>
                              )}
                              {log.vitals && (
                                <div style={{ marginBottom:6 }}>
                                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Vitals </span>
                                  <span style={{ fontSize:14 }}>{log.vitals}</span>
                                </div>
                              )}
                              {log.notes && (
                                <div style={{ marginTop:8, fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, background:"var(--bg)", borderRadius:6, padding:"8px 10px" }}>
                                  {log.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Side panels */}
                <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                  <div className="ehr-card">
                    <div className="ehr-card-header">
                      <i className="bi bi-activity" style={{ color:"var(--teal)" }} />
                      <span className="ehr-card-title">Diagnosis History</span>
                    </div>
                    <div className="ehr-card-body" style={{ padding:"16px 20px" }}>
                      {summary.diagnoses.length ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {summary.diagnoses.map((d,i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--teal)", flexShrink:0 }} />
                              <span style={{ fontSize:14 }}>{d}</span>
                            </div>
                          ))}
                        </div>
                      ) : <span style={{ fontSize:14, color:"var(--text-disabled)" }}>No diagnoses recorded</span>}
                    </div>
                  </div>

                  <div className="ehr-card">
                    <div className="ehr-card-header">
                      <i className="bi bi-capsule-pill" style={{ color:"var(--amber)" }} />
                      <span className="ehr-card-title">Medication History</span>
                    </div>
                    <div className="ehr-card-body" style={{ padding:"16px 20px" }}>
                      {summary.meds.length ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {summary.meds.map((m,i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--amber)", flexShrink:0 }} />
                              <span style={{ fontSize:14 }}>{m}</span>
                            </div>
                          ))}
                        </div>
                      ) : <span style={{ fontSize:14, color:"var(--text-disabled)" }}>No medications recorded</span>}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <AuditChatbot />
    </div>
  );
}
