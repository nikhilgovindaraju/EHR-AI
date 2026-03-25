import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import AuditChatbot from "./AuditChatbot";

const ACTION_COLOR = { CREATE: "green", MODIFY: "blue", DELETE: "red" };

function WeekChart({ logs }) {
  const weeks = useMemo(() => {
    const now = new Date();
    const cols = [];
    for (let w = 7; w >= 0; w--) {
      const d = new Date(now);
      d.setDate(d.getDate() - w * 7);
      const label = ["8w","7w","6w","5w","4w","3w","2w","This"][7 - w];
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
      const count = logs.filter(l => { const t = new Date(l.timestamp); return t >= weekStart && t < weekEnd; }).length;
      cols.push({ label, count, isCurrent: w === 0 });
    }
    return cols;
  }, [logs]);

  const max = Math.max(...weeks.map(w => w.count), 1);
  return (
    <div className="ehr-week-chart">
      {weeks.map((w, i) => (
        <div key={i} className="ehr-week-col">
          <div className="ehr-week-val">{w.count || ""}</div>
          <div className="ehr-week-bar-wrap">
            <div className={`ehr-week-bar${w.isCurrent ? " current" : ""}`} style={{ height: `${Math.max((w.count / max) * 100, 5)}%` }} />
          </div>
          <div className="ehr-week-label">{w.label}</div>
        </div>
      ))}
    </div>
  );
}

function HBarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="ehr-chart-bar-wrap">
      {data.map((d, i) => (
        <div key={i} className="ehr-chart-bar-row">
          <div className="ehr-chart-bar-label" title={d.label}>{d.label}</div>
          <div className="ehr-chart-bar-track">
            <div className="ehr-chart-bar-fill" style={{ width: `${(d.count / max) * 100}%`, background: color }} />
          </div>
          <div className="ehr-chart-bar-val">{d.count}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate  = useNavigate();
  const userId    = localStorage.getItem("user_id");
  const role      = localStorage.getItem("role");

  const [logs, setLogs]           = useState([]);
  const [chainOk, setChainOk]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!userId) { navigate("/"); return; }
    Promise.all([
      api.get("/api/audit/logs", { params: { role, user_id: userId } }),
      api.get("/api/audit/validate"),
    ]).then(([logsRes, valRes]) => {
      setLogs(logsRes.data.logs || []);
      setChainOk(valRes.data.status === "valid");
    }).catch(err => {
      setLoadError(err.response?.data?.detail || "Failed to load dashboard data.");
    }).finally(() => setLoading(false));
  }, [navigate, userId, role]);

  const uniquePatients = useMemo(() => new Set(logs.map(l => l.patient_id)).size, [logs]);
  const recent         = useMemo(() => [...logs].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp)).slice(0,5), [logs]);

  const topDiagnoses = useMemo(() => {
    const counts = {};
    logs.forEach(l => { if (l.diagnosis) counts[l.diagnosis] = (counts[l.diagnosis]||0)+1; });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([label,count])=>({label,count}));
  }, [logs]);

  const topMeds = useMemo(() => {
    const counts = {};
    logs.forEach(l => { if (l.medication) counts[l.medication] = (counts[l.medication]||0)+1; });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([label,count])=>({label,count}));
  }, [logs]);

  const ACTION_CARDS = [
    { key:"logs",     label:"Audit Logs",     sub:"Browse and search all encrypted records", icon:"bi-journal-text",      iconBg:"var(--blue-light)",  iconColor:"var(--blue)",  path:"/logs" },
    { key:"add",      label:"Add Record",      sub:"Create a new encrypted patient visit",   icon:"bi-plus-circle-fill",  iconBg:"var(--green-light)", iconColor:"var(--green)", path:"/add",  doctorOnly:true },
    { key:"validate", label:"Validate Chain",  sub:"Verify SHA-256 hash chain integrity",    icon:"bi-shield-check",      iconBg:"var(--amber-light)", iconColor:"var(--amber)", path:"/validate" },
  ].filter(c => !c.doctorOnly || role==="doctor");

  return (
    <div className="ehr-shell">
      <Sidebar activeItem="dashboard" />
      <main className="ehr-main">
        <div className="ehr-topbar">
          <div className="ehr-breadcrumb">
            <i className="bi bi-grid-fill" />
            <span>Dashboard</span>
          </div>
          <div className="ehr-topbar-title" />
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span className={`ehr-badge ${chainOk===true?"ehr-badge-green":chainOk===false?"ehr-badge-red":"ehr-badge-gray"}`}>
              <i className={`bi ${chainOk===true?"bi-shield-fill-check":chainOk===false?"bi-shield-fill-exclamation":"bi-shield"}`} style={{ marginRight:4 }} />
              {chainOk===true?"Chain Valid":chainOk===false?"Chain Broken":"Checking chain…"}
            </span>
          </div>
        </div>

        <div className="ehr-content">
          {loadError && <div className="ehr-alert ehr-alert-error"><i className="bi bi-exclamation-circle-fill" />{loadError}</div>}
          <div className="ehr-page-header">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div className="ehr-page-title">Clinical Dashboard</div>
                <div className="ehr-page-sub">Welcome back, {userId} · {role}</div>
              </div>
              {role === "doctor" && (
                <button className="ehr-btn ehr-btn-primary" onClick={() => navigate("/add")}>
                  <i className="bi bi-plus-lg" /> Add Record
                </button>
              )}
            </div>
          </div>

          {/* Stat tiles */}
          <div className="ehr-grid-3" style={{ marginBottom:24 }}>
            <div className="ehr-stat-tile">
              <div className="ehr-stat-label">Total Records</div>
              <div className="ehr-stat-value">{loading ? "—" : logs.length}</div>
              <div className="ehr-stat-sub">All encrypted audit entries</div>
              <div className="ehr-stat-icon" style={{ background:"var(--blue-light)", color:"var(--blue)" }}>
                <i className="bi bi-journal-medical" />
              </div>
            </div>
            <div className="ehr-stat-tile">
              <div className="ehr-stat-label">Unique Patients</div>
              <div className="ehr-stat-value">{loading ? "—" : uniquePatients}</div>
              <div className="ehr-stat-sub">Distinct patient IDs</div>
              <div className="ehr-stat-icon" style={{ background:"var(--teal-light)", color:"var(--teal)" }}>
                <i className="bi bi-people-fill" />
              </div>
            </div>
            <div className="ehr-stat-tile">
              <div className="ehr-stat-label">Chain Status</div>
              <div className="ehr-stat-value" style={{ fontSize:22, marginTop:4, color: chainOk===true?"var(--green)":chainOk===false?"var(--red)":"var(--text-muted)" }}>
                {chainOk===null ? "Checking…" : chainOk ? "✓ Valid" : "✗ Broken"}
              </div>
              <div className="ehr-stat-sub">SHA-256 hash chain integrity</div>
              <div className="ehr-stat-icon" style={{ background: chainOk===true?"var(--green-light)":chainOk===false?"var(--red-light)":"var(--bg)", color: chainOk===true?"var(--green)":chainOk===false?"var(--red)":"var(--text-muted)" }}>
                <i className={`bi ${chainOk===true?"bi-shield-fill-check":chainOk===false?"bi-shield-fill-exclamation":"bi-shield"}`} />
              </div>
            </div>
          </div>

          {/* Action cards */}
          <div className={`ehr-grid-${ACTION_CARDS.length}`} style={{ marginBottom:28 }}>
            {ACTION_CARDS.map(card => (
              <div key={card.key} className="ehr-action-card" onClick={() => navigate(card.path)}>
                <div className="ehr-action-card-icon" style={{ background:card.iconBg, color:card.iconColor }}>
                  <i className={`bi ${card.icon}`} />
                </div>
                <div className="ehr-action-card-label">{card.label}</div>
                <div className="ehr-action-card-sub">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="ehr-grid-3" style={{ marginBottom:28 }}>
            <div className="ehr-card" style={{ gridColumn: "span 1" }}>
              <div className="ehr-card-header">
                <i className="bi bi-bar-chart-fill" style={{ color:"var(--blue)" }} />
                <span className="ehr-card-title">Visit Volume (8 weeks)</span>
              </div>
              <div className="ehr-card-body">
                {loading ? <div style={{ color:"var(--text-muted)", fontSize:14 }}>Loading…</div> : <WeekChart logs={logs} />}
              </div>
            </div>

            <div className="ehr-card">
              <div className="ehr-card-header">
                <i className="bi bi-activity" style={{ color:"var(--teal)" }} />
                <span className="ehr-card-title">Top Diagnoses</span>
              </div>
              <div className="ehr-card-body">
                {loading ? <div style={{ color:"var(--text-muted)", fontSize:14 }}>Loading…</div>
                  : topDiagnoses.length ? <HBarChart data={topDiagnoses} color="var(--teal)" />
                  : <div style={{ color:"var(--text-muted)", fontSize:14 }}>No data yet</div>}
              </div>
            </div>

            <div className="ehr-card">
              <div className="ehr-card-header">
                <i className="bi bi-capsule-pill" style={{ color:"var(--amber)" }} />
                <span className="ehr-card-title">Top Medications</span>
              </div>
              <div className="ehr-card-body">
                {loading ? <div style={{ color:"var(--text-muted)", fontSize:14 }}>Loading…</div>
                  : topMeds.length ? <HBarChart data={topMeds} color="var(--amber)" />
                  : <div style={{ color:"var(--text-muted)", fontSize:14 }}>No data yet</div>}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="ehr-card">
            <div className="ehr-card-header">
              <i className="bi bi-clock-history" style={{ color:"var(--text-muted)" }} />
              <span className="ehr-card-title">Recent Activity</span>
              <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={() => navigate("/logs")}>
                View All <i className="bi bi-arrow-right" />
              </button>
            </div>
            <div>
              {loading ? (
                <div style={{ padding:24, color:"var(--text-muted)", fontSize:14 }}>Loading records…</div>
              ) : recent.length === 0 ? (
                <div className="ehr-empty">
                  <div className="ehr-empty-icon"><i className="bi bi-journal-x" /></div>
                  <div className="ehr-empty-title">No records yet</div>
                  <div className="ehr-empty-sub">Records you add will appear here.</div>
                  {role === "doctor" && <button className="ehr-btn ehr-btn-primary" onClick={() => navigate("/add")}><i className="bi bi-plus-lg" /> Add First Record</button>}
                </div>
              ) : (
                <table className="ehr-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Action</th>
                      <th>Diagnosis</th>
                      <th>Doctor</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(log => (
                      <tr key={log.id} onClick={() => navigate("/logs")}>
                        <td>
                          <div style={{ fontWeight:500 }}>{log.patient_name || "—"}</div>
                          <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{log.patient_id}</div>
                        </td>
                        <td>
                          <span className={`ehr-badge ehr-badge-${ACTION_COLOR[log.action]||"gray"}`}>{log.action}</span>
                        </td>
                        <td>{log.diagnosis || <span style={{ color:"var(--text-disabled)" }}>—</span>}</td>
                        <td style={{ fontSize:13, color:"var(--text-muted)" }}>{log.user_id}</td>
                        <td style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"var(--font-mono)", whiteSpace:"nowrap" }}>
                          {new Date(log.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
      <AuditChatbot />
    </div>
  );
}
