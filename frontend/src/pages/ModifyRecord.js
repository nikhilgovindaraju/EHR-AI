import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

const GENDERS = ["Male","Female","Non-binary","Prefer not to say"];

export default function ModifyRecord() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const userId    = localStorage.getItem("user_id");
  const role      = localStorage.getItem("role");

  const [logs, setLogs]         = useState([]);
  const [selected, setSelected] = useState(location.state?.log || null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const [form, setForm] = useState({
    patient_name:"", age:"", gender:"Male",
    visit_date:"", vitals:"", diagnosis:"", medication:"", notes:""
  });

  useEffect(() => {
    if (!userId) { navigate("/"); return; }
    api.get("/api/audit/logs", { params: { role, user_id: userId } })
      .then(r => setLogs(r.data.logs || []))
      .catch(() => setError("Failed to load records."))
      .finally(() => setLoading(false));
  }, [userId, role, navigate]);

  useEffect(() => {
    if (selected) {
      setForm({
        patient_name: selected.patient_name || "",
        age:          selected.age != null ? String(selected.age) : "",
        gender:       selected.gender   || "Male",
        visit_date:   selected.visit_date || "",
        vitals:       selected.vitals    || "",
        diagnosis:    selected.diagnosis || "",
        medication:   selected.medication|| "",
        notes:        selected.notes     || "",
      });
    }
  }, [selected]);

  function setF(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.diagnosis) { setError("Diagnosis is required."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.put(`/api/audit/modify-log/${selected.id}`, {
        patient_name: form.patient_name || undefined,
        age:          form.age ? parseInt(form.age) : undefined,
        gender:       form.gender       || undefined,
        visit_date:   form.visit_date   || undefined,
        vitals:       form.vitals       || undefined,
        diagnosis:    form.diagnosis    || undefined,
        medication:   form.medication   || undefined,
        notes:        form.notes        || undefined,
      });
      setSuccess("Record updated successfully.");
      setTimeout(() => navigate("/logs"), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed.");
    } finally { setSaving(false); }
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
            <span>Modify Record</span>
          </div>
          <div className="ehr-topbar-title" />
        </div>

        <div className="ehr-content">
          <div className="ehr-page-header">
            <div className="ehr-page-title">Modify Record</div>
            <div className="ehr-page-sub">Select a record from the table, then edit its fields</div>
          </div>

          {error   && <div className="ehr-alert ehr-alert-error"><i className="bi bi-exclamation-circle-fill" />{error}</div>}
          {success && <div className="ehr-alert ehr-alert-success"><i className="bi bi-check-circle-fill" />{success}</div>}

          {!selected ? (
            /* Record picker */
            loading ? (
              <div style={{ textAlign:"center", padding:48, color:"var(--text-muted)" }}>
                <div className="ehr-spinner ehr-spinner-dark" style={{ margin:"0 auto 12px" }} /> Loading records…
              </div>
            ) : sortedLogs.length === 0 ? (
              <div className="ehr-empty">
                <div className="ehr-empty-icon"><i className="bi bi-journal-x" /></div>
                <div className="ehr-empty-title">No records found</div>
                <div className="ehr-empty-sub">Add a record first before modifying.</div>
                <button className="ehr-btn ehr-btn-primary" onClick={() => navigate("/add")}><i className="bi bi-plus-lg" /> Add Record</button>
              </div>
            ) : (
              <div className="ehr-table-wrap">
                <table className="ehr-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Diagnosis</th>
                      <th>Doctor</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontWeight:500 }}>{log.patient_name || "—"}</div>
                          <div style={{ fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{log.patient_id}</div>
                        </td>
                        <td>{log.diagnosis || "—"}</td>
                        <td style={{ fontSize:13, color:"var(--text-muted)" }}>{log.user_id}</td>
                        <td style={{ fontSize:13, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
                          {new Date(log.timestamp).toLocaleDateString()}
                        </td>
                        <td>
                          <button className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={() => setSelected(log)}>
                            <i className="bi bi-pencil" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Edit form */
            <form onSubmit={handleSave}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <button type="button" className="ehr-btn ehr-btn-ghost ehr-btn-sm" onClick={() => setSelected(null)}>
                  <i className="bi bi-arrow-left" /> Back to list
                </button>
                <div style={{ fontSize:14, color:"var(--text-muted)" }}>
                  Editing record for <strong>{selected.patient_name || selected.patient_id}</strong>
                  <span style={{ fontFamily:"var(--font-mono)", marginLeft:8, fontSize:12 }}>#{selected.id}</span>
                </div>
              </div>

              <div className="ehr-grid-2" style={{ gap:24, alignItems:"start" }}>
                <div className="ehr-card">
                  <div className="ehr-card-header">
                    <i className="bi bi-person-vcard" style={{ color:"var(--blue)" }} />
                    <span className="ehr-card-title">Patient Demographics</span>
                  </div>
                  <div className="ehr-card-body">
                    <div className="ehr-form-group">
                      <label className="ehr-label">Full Name</label>
                      <input className="ehr-input" value={form.patient_name} onChange={e => setF("patient_name",e.target.value)} placeholder="Jane Doe" />
                    </div>
                    <div className="ehr-grid-2">
                      <div className="ehr-form-group">
                        <label className="ehr-label">Age</label>
                        <input className="ehr-input" type="number" min="0" max="150" value={form.age} onChange={e => setF("age",e.target.value)} placeholder="42" />
                      </div>
                      <div className="ehr-form-group">
                        <label className="ehr-label">Gender</label>
                        <select className="ehr-select" value={form.gender} onChange={e => setF("gender",e.target.value)}>
                          {GENDERS.map(g => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="ehr-form-group">
                      <label className="ehr-label">Visit Date</label>
                      <input className="ehr-input" type="date" value={form.visit_date} onChange={e => setF("visit_date",e.target.value)} />
                    </div>
                    <div className="ehr-form-group" style={{ marginBottom:0 }}>
                      <label className="ehr-label">Vitals</label>
                      <input className="ehr-input" value={form.vitals} onChange={e => setF("vitals",e.target.value)} placeholder="BP 120/80, HR 72" />
                    </div>
                  </div>
                </div>

                <div className="ehr-card">
                  <div className="ehr-card-header">
                    <i className="bi bi-clipboard2-pulse" style={{ color:"var(--teal)" }} />
                    <span className="ehr-card-title">Clinical Details</span>
                  </div>
                  <div className="ehr-card-body">
                    <div className="ehr-form-group">
                      <label className="ehr-label">Diagnosis <span className="req">*</span></label>
                      <input className="ehr-input" value={form.diagnosis} onChange={e => setF("diagnosis",e.target.value)} placeholder="e.g. Hypertension" />
                    </div>
                    <div className="ehr-form-group">
                      <label className="ehr-label">Medication</label>
                      <input className="ehr-input" value={form.medication} onChange={e => setF("medication",e.target.value)} placeholder="e.g. Lisinopril 10mg" />
                    </div>
                    <div className="ehr-form-group" style={{ marginBottom:0 }}>
                      <label className="ehr-label">Doctor's Notes</label>
                      <textarea className="ehr-textarea" value={form.notes} onChange={e => setF("notes",e.target.value)} style={{ minHeight:120 }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", gap:12, marginTop:20 }}>
                <button type="button" className="ehr-btn ehr-btn-ghost" onClick={() => setSelected(null)}>
                  <i className="bi bi-x" /> Cancel
                </button>
                <button type="submit" className="ehr-btn ehr-btn-primary" disabled={saving}>
                  {saving
                    ? <><div className="ehr-spinner" /> Saving…</>
                    : <><i className="bi bi-check-lg" /> Save Changes</>
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
