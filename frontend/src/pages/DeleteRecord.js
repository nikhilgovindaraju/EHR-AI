import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

const ACTION_COLOR = { CREATE:"green", MODIFY:"blue", DELETE:"red" };

export default function DeleteRecord() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const userId    = localStorage.getItem("user_id");
  const role      = localStorage.getItem("role");

  const [logs, setLogs]           = useState([]);
  const [selected, setSelected]   = useState(location.state?.log || null);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    if (!userId) { navigate("/"); return; }
    api.get("/api/audit/logs", { params: { role, user_id: userId } })
      .then(r => setLogs(r.data.logs || []))
      .catch(() => setError("Failed to load records."))
      .finally(() => setLoading(false));
  }, [userId, role, navigate]);

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true); setError("");
    try {
      await api.delete(`/api/audit/delete-log/${selected.id}`);
      setSuccess("Record permanently deleted.");
      setTimeout(() => navigate("/logs"), 1400);
    } catch (err) {
      setError(err.response?.data?.detail || "Delete failed.");
      setDeleting(false);
    }
  }

  const sortedLogs = [...logs].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp));

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
            <span>Delete Record</span>
          </div>
          <div className="ehr-topbar-title" />
        </div>

        <div className="ehr-content">
          <div className="ehr-page-header">
            <div className="ehr-page-title">Delete Record</div>
            <div className="ehr-page-sub">Permanently remove an audit log entry</div>
          </div>

          {error   && <div className="ehr-alert ehr-alert-error"><i className="bi bi-exclamation-circle-fill" />{error}</div>}
          {success && <div className="ehr-alert ehr-alert-success"><i className="bi bi-check-circle-fill" />{success}</div>}

          {!selected ? (
            loading ? (
              <div style={{ textAlign:"center", padding:48, color:"var(--text-muted)" }}>
                <div className="ehr-spinner ehr-spinner-dark" style={{ margin:"0 auto 12px" }} /> Loading records…
              </div>
            ) : sortedLogs.length === 0 ? (
              <div className="ehr-empty">
                <div className="ehr-empty-icon"><i className="bi bi-journal-x" /></div>
                <div className="ehr-empty-title">No records found</div>
                <div className="ehr-empty-sub">There are no records to delete.</div>
              </div>
            ) : (
              <div className="ehr-table-wrap">
                <table className="ehr-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Action</th>
                      <th>Diagnosis</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontWeight:500 }}>{log.patient_name || "—"}</div>
                          <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{log.patient_id}</div>
                        </td>
                        <td><span className={`ehr-badge ehr-badge-${ACTION_COLOR[log.action]||"gray"}`}>{log.action}</span></td>
                        <td>{log.diagnosis || "—"}</td>
                        <td style={{ fontSize:13, color:"var(--text-muted)" }}>{log.user_id}</td>
                        <td style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
                          {new Date(log.timestamp).toLocaleDateString()}
                        </td>
                        <td>
                          <button className="ehr-btn ehr-btn-danger ehr-btn-sm" onClick={() => setSelected(log)}>
                            <i className="bi bi-trash" /> Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Confirmation */
            <div style={{ maxWidth:600 }}>
              <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" style={{ marginBottom:20 }} onClick={() => setSelected(null)}>
                <i className="bi bi-arrow-left" /> Back to list
              </button>

              <div className="ehr-danger-card" style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:"var(--red)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#fff", flexShrink:0 }}>
                    <i className="bi bi-exclamation-triangle-fill" />
                  </div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:"var(--red)" }}>Confirm Permanent Deletion</div>
                    <div style={{ fontSize:13, color:"var(--text-muted)", marginTop:2 }}>This action cannot be undone. The record will be removed from the audit chain.</div>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, background:"rgba(255,255,255,0.6)", borderRadius:8, padding:16, border:"1px solid #F5B7B1" }}>
                  {[
                    ["Patient ID",   selected.patient_id],
                    ["Patient Name", selected.patient_name || "—"],
                    ["Action Type",  selected.action],
                    ["Doctor",       selected.user_id],
                    ["Diagnosis",    selected.diagnosis || "—"],
                    ["Medication",   selected.medication || "—"],
                    ["Visit Date",   selected.visit_date || "—"],
                    ["Recorded",     new Date(selected.timestamp).toLocaleString()],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:14 }}>{val}</div>
                    </div>
                  ))}
                  {selected.notes && (
                    <div style={{ gridColumn:"span 2" }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>Notes</div>
                      <div style={{ fontSize:14, whiteSpace:"pre-wrap" }}>{selected.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:"flex", gap:12 }}>
                <button className="ehr-btn ehr-btn-ghost" onClick={() => setSelected(null)}>
                  <i className="bi bi-x-circle" /> Cancel
                </button>
                <button className="ehr-btn ehr-btn-danger ehr-btn-lg" onClick={handleDelete} disabled={deleting}>
                  {deleting
                    ? <><div className="ehr-spinner" style={{ borderTopColor:"var(--red)", borderColor:"rgba(192,57,43,0.2)" }} /> Deleting…</>
                    : <><i className="bi bi-trash-fill" /> Yes, permanently delete</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
