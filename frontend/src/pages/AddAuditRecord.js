import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";

const GENDERS = ["Male","Female","Non-binary","Prefer not to say"];

export default function AddAuditRecord() {
  const navigate = useNavigate();
  const userId   = localStorage.getItem("user_id");
  const role     = localStorage.getItem("role");

  // Step 1 state
  const [step, setStep]               = useState(1);
  const [searchMode, setSearchMode]   = useState("id"); // "id" | "name"
  const [searchVal, setSearchVal]     = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [patientFound, setPatientFound]   = useState(null); // null | false | object
  const [action, setAction]           = useState("CREATE"); // CREATE | MODIFY | DELETE

  // Step 2 state
  const [form, setForm] = useState({
    patient_id:"", patient_name:"", age:"", gender:"Male",
    visit_date: new Date().toISOString().split("T")[0],
    vitals:"", diagnosis:"", medication:"", notes:""
  });

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  useEffect(() => { if (!userId) navigate("/"); }, [userId, navigate]);

  function setF(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchVal.trim()) return;
    setSearchLoading(true); setPatientFound(null); setError("");
    try {
      const params = { role, user_id: userId };
      if (searchMode === "id")   params.patient_id   = searchVal.trim();
      else                       params.patient_name  = searchVal.trim();
      const res = await api.get("/api/audit/logs", { params });
      const logs = res.data.logs || [];
      if (logs.length > 0) {
        const latest = [...logs].sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))[0];
        setPatientFound(latest);
        setF("patient_id",   latest.patient_id   || "");
        setF("patient_name", latest.patient_name || "");
        setF("age",          latest.age != null   ? String(latest.age) : "");
        setF("gender",       latest.gender        || "Male");
      } else {
        setPatientFound(false);
        if (searchMode === "id") setF("patient_id", searchVal.trim());
        else                     setF("patient_name", searchVal.trim());
      }
    } catch { setError("Search failed. Please try again."); }
    finally  { setSearchLoading(false); }
  }

  function handleActionSelect(a) {
    setAction(a);
    if (a === "MODIFY" && patientFound) { navigate("/modify", { state: { patient: patientFound } }); return; }
    if (a === "DELETE" && patientFound) { navigate("/delete", { state: { patient: patientFound } }); return; }
  }

  function goToStep2() {
    if (!form.patient_id && !form.patient_name) { setError("Please search for a patient first."); return; }
    if (!form.patient_id) { setError("Patient ID is required."); return; }
    setError(""); setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.patient_id || !form.diagnosis) { setError("Patient ID and Diagnosis are required."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.post("/api/audit/add-log", {
        user_id: userId, role,
        patient_id:   form.patient_id,
        patient_name: form.patient_name,
        age:          form.age ? parseInt(form.age) : null,
        gender:       form.gender,
        visit_date:   form.visit_date,
        vitals:       form.vitals,
        diagnosis:    form.diagnosis,
        medication:   form.medication,
        notes:        form.notes,
        action:       "CREATE",
      });
      setSuccess("Record saved and encrypted successfully.");
      setTimeout(() => navigate("/logs"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save record.");
    } finally { setLoading(false); }
  }

  const actionBtnClass = (a) => {
    if (action !== a) return "ehr-action-btn";
    if (a === "CREATE") return "ehr-action-btn selected-create";
    if (a === "MODIFY") return "ehr-action-btn selected-modify";
    if (a === "DELETE") return "ehr-action-btn selected-delete";
    return "ehr-action-btn";
  };

  return (
    <div className="ehr-shell">
      <Sidebar activeItem="add" />
      <main className="ehr-main">
        <div className="ehr-topbar">
          <div className="ehr-breadcrumb">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <i className="bi bi-chevron-right" style={{ fontSize:10 }} />
            <span>Add Record</span>
          </div>
          <div className="ehr-topbar-title" />
        </div>

        <div className="ehr-content">
          <div className="ehr-page-header">
            <div className="ehr-page-title">Add Audit Record</div>
            <div className="ehr-page-sub">Create a new encrypted clinical entry with audit trail</div>
          </div>

          {/* Step indicator */}
          <div className="ehr-steps">
            <div className={`ehr-step${step >= 1 ? (step > 1 ? " done" : " active") : ""}`}>
              <div className="ehr-step-dot">{step > 1 ? <i className="bi bi-check" /> : "1"}</div>
              Patient Lookup
            </div>
            <div className="ehr-step-line" />
            <div className={`ehr-step${step >= 2 ? " active" : ""}`}>
              <div className="ehr-step-dot">2</div>
              Clinical Details
            </div>
          </div>

          {error   && <div className="ehr-alert ehr-alert-error"><i className="bi bi-exclamation-circle-fill" />{error}</div>}
          {success && <div className="ehr-alert ehr-alert-success"><i className="bi bi-check-circle-fill" />{success}</div>}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="ehr-grid-2" style={{ gap:24, alignItems:"start" }}>
              <div className="ehr-card">
                <div className="ehr-card-header">
                  <i className="bi bi-search" style={{ color:"var(--blue)" }} />
                  <span className="ehr-card-title">Patient Lookup</span>
                </div>
                <div className="ehr-card-body">
                  {/* Search mode toggle */}
                  <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                    {["id","name"].map(m => (
                      <button key={m} onClick={() => { setSearchMode(m); setSearchVal(""); setPatientFound(null); }}
                        className={`ehr-btn ehr-btn-sm ${searchMode===m ? "ehr-btn-primary" : "ehr-btn-ghost"}`}>
                        Search by {m === "id" ? "Patient ID" : "Name"}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSearch}>
                    <div className="ehr-form-group">
                      <label className="ehr-label">
                        {searchMode === "id" ? "Patient ID" : "Patient Name"}
                      </label>
                      <div className="ehr-input-wrap">
                        <i className="bi bi-search ehr-input-icon" />
                        <input className="ehr-input" placeholder={searchMode==="id" ? "e.g. PT-001" : "e.g. Jane Doe"}
                          value={searchVal} onChange={e => setSearchVal(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="ehr-btn ehr-btn-ghost ehr-btn-full" disabled={searchLoading}>
                      {searchLoading ? <><div className="ehr-spinner ehr-spinner-dark" /> Searching…</> : <><i className="bi bi-search" /> Look Up Patient</>}
                    </button>
                  </form>

                  {patientFound && (
                    <div className="ehr-patient-banner found" style={{ marginTop:16, marginBottom:0 }}>
                      <i className="bi bi-person-check-fill" />
                      <div>
                        <div className="ehr-patient-banner-title">Existing patient found</div>
                        <div className="ehr-patient-banner-sub">{patientFound.patient_name} · {patientFound.patient_id} · {patientFound.age ? `Age ${patientFound.age}` : ""} · {patientFound.gender}</div>
                      </div>
                    </div>
                  )}
                  {patientFound === false && (
                    <div className="ehr-patient-banner new-pt" style={{ marginTop:16, marginBottom:0 }}>
                      <i className="bi bi-person-plus-fill" />
                      <div>
                        <div className="ehr-patient-banner-title">New patient</div>
                        <div className="ehr-patient-banner-sub">No existing records found. You'll enter demographics below.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="ehr-card">
                <div className="ehr-card-header">
                  <i className="bi bi-ui-checks" style={{ color:"var(--blue)" }} />
                  <span className="ehr-card-title">Record Action</span>
                </div>
                <div className="ehr-card-body">
                  <div style={{ marginBottom:12, fontSize:13, color:"var(--text-muted)" }}>What type of record entry is this?</div>
                  <div className="ehr-action-group" style={{ marginBottom:24 }}>
                    <button className={actionBtnClass("CREATE")} onClick={() => handleActionSelect("CREATE")}>
                      <i className="bi bi-plus-circle" style={{ marginRight:6 }} /> Create
                    </button>
                    <button className={actionBtnClass("MODIFY")} onClick={() => handleActionSelect("MODIFY")} disabled={!patientFound}>
                      <i className="bi bi-pencil" style={{ marginRight:6 }} /> Modify
                    </button>
                    <button className={actionBtnClass("DELETE")} onClick={() => handleActionSelect("DELETE")} disabled={!patientFound}>
                      <i className="bi bi-trash" style={{ marginRight:6 }} /> Delete
                    </button>
                  </div>

                  {action === "CREATE" && (
                    <div className="ehr-form-group" style={{ marginBottom:0 }}>
                      <label className="ehr-label">Patient ID <span className="req">*</span></label>
                      <input className="ehr-input" placeholder="e.g. PT-001" value={form.patient_id}
                        onChange={e => setF("patient_id", e.target.value)} />
                    </div>
                  )}

                  <button className="ehr-btn ehr-btn-primary ehr-btn-full" style={{ marginTop:16 }} onClick={goToStep2}>
                    Continue to Clinical Details <i className="bi bi-arrow-right" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="ehr-grid-2" style={{ gap:24, alignItems:"start" }}>
                {/* Demographics */}
                <div className="ehr-card">
                  <div className="ehr-card-header">
                    <i className="bi bi-person-vcard" style={{ color:"var(--blue)" }} />
                    <span className="ehr-card-title">Patient Demographics</span>
                  </div>
                  <div className="ehr-card-body">
                    <div className="ehr-form-group">
                      <label className="ehr-label">Patient ID <span className="req">*</span></label>
                      <input className="ehr-input" value={form.patient_id} onChange={e => setF("patient_id",e.target.value)} placeholder="PT-001" />
                    </div>
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
                      <input className="ehr-input" value={form.vitals} onChange={e => setF("vitals",e.target.value)} placeholder="BP 120/80, HR 72, Temp 98.6°F" />
                    </div>
                  </div>
                </div>

                {/* Clinical */}
                <div className="ehr-card">
                  <div className="ehr-card-header">
                    <i className="bi bi-clipboard2-pulse" style={{ color:"var(--teal)" }} />
                    <span className="ehr-card-title">Clinical Details</span>
                  </div>
                  <div className="ehr-card-body">
                    <div className="ehr-form-group">
                      <label className="ehr-label">Diagnosis <span className="req">*</span></label>
                      <input className="ehr-input" value={form.diagnosis} onChange={e => setF("diagnosis",e.target.value)} placeholder="e.g. Type 2 Diabetes Mellitus" />
                    </div>
                    <div className="ehr-form-group">
                      <label className="ehr-label">Medication</label>
                      <input className="ehr-input" value={form.medication} onChange={e => setF("medication",e.target.value)} placeholder="e.g. Metformin 500mg twice daily" />
                    </div>
                    <div className="ehr-form-group" style={{ marginBottom:0 }}>
                      <label className="ehr-label">Doctor's Notes</label>
                      <textarea className="ehr-textarea" value={form.notes} onChange={e => setF("notes",e.target.value)} placeholder="Clinical observations, follow-up instructions…" style={{ minHeight:120 }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", gap:12, marginTop:20 }}>
                <button type="button" className="ehr-btn ehr-btn-ghost" onClick={() => setStep(1)}>
                  <i className="bi bi-arrow-left" /> Back
                </button>
                <button type="submit" className="ehr-btn ehr-btn-primary" disabled={loading}>
                  {loading
                    ? <><div className="ehr-spinner" /> Encrypting &amp; Saving…</>
                    : <><i className="bi bi-shield-lock-fill" /> Save Encrypted Record</>
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
