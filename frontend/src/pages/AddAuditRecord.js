import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import "../styles/addaudit.css";
import Layout from "../components/Layout";

function AddAuditRecord() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [step, setStep] = useState(1);
  const [action, setAction] = useState("");
  const [patientId, setPatientId] = useState("");
  const [formData, setFormData] = useState({
    patient_name: "",
    age: "",
    gender: "",
    diagnosis: "",
    medication: "",
    data: "",
    visit_date: new Date().toISOString().split("T")[0],
    vitals: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    if (!action || !patientId) {
      setError("Please enter patient ID and select an action.");
      return;
    }

    try {
      const params = { user_id: userId, role: "doctor" };
      const response = await axios.get("/api/audit/logs", { params });
      const match = response.data.logs.find((log) => log.patient_id === patientId);

      if (action === "create" && match) {
        setError("Patient already exists. Please use Modify or Delete.");
      } else if ((action === "modify" || action === "delete") && !match) {
        setError("Patient does not exist.");
      } else {
        setError("");
        if (action === "modify") {
          navigate("/modify", { state: { patientId } });
        } else if (action === "delete") {
          navigate("/delete", { state: { patientId } });
        } else {
          setStep(2);
        }
      }
    } catch (err) {
      setError("Error checking patient records.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      user_id: userId,
      patient_id: patientId,
      action,
      ...formData,
    };

    try {
      await axios.post("/api/audit/add-log", payload, {
        headers: { "Content-Type": "application/json" },
      });
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (err) {
      console.error("API error:", err);
      setError("❌ Failed to submit record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="audit-wrapper">
        <div className="audit-form-card">
          <h2><i className="bi bi-plus-circle"></i> Add Patient Record</h2>

          {step === 1 && (
            <>
              <label className="form-label">Select Action</label>
              <select
                className="form-select mb-3"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="">-- Select Action --</option>
                <option value="create">Create</option>
                <option value="modify">Modify</option>
                <option value="delete">Delete</option>
              </select>

              <label className="form-label">Enter Patient ID</label>
              <input
                className="form-control mb-3"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Patient ID"
              />

              <button className="btn btn-primary w-100" onClick={handleNext}>
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <label className="form-label"><i className="bi bi-person"></i> Patient Name</label>
                <input className="form-control" name="patient_name" value={formData.patient_name} onChange={handleChange} required />
              </div>
              <div>
                <label className="form-label"><i className="bi bi-123"></i> Age</label>
                <input className="form-control" name="age" type="number" value={formData.age} onChange={handleChange} required />
              </div>
          
              <div>
                <label className="form-label"><i className="bi bi-gender-ambiguous"></i> Gender</label>
                <select className="form-select" name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="form-label"><i className="bi bi-capsule"></i> Medication</label>
                <input className="form-control" name="medication" value={formData.medication} onChange={handleChange} />
              </div>
          
              <div>
                <label className="form-label"><i className="bi bi-clipboard-heart"></i> Diagnosis</label>
                <input className="form-control" name="diagnosis" value={formData.diagnosis} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label"><i className="bi bi-calendar-date"></i> Visit Date</label>
                <input className="form-control" name="visit_date" type="date" value={formData.visit_date} onChange={handleChange} />
              </div>
          
              <div>
                <label className="form-label"><i className="bi bi-heart-pulse"></i> Vital Signs</label>
                <input className="form-control" name="vitals" placeholder="BP: 120/80, HR: 75" value={formData.vitals} onChange={handleChange} />
              </div>
          
              <div>
                <label className="form-label"><i className="bi bi-journal-text"></i> Doctor's Notes</label>
                <textarea className="form-control" name="data" rows="4" value={formData.data} onChange={handleChange} placeholder="Add notes" />
              </div>
            </div>
          
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? "Submitting..." : "Submit Record"}
            </button>
          
            <button type="button" className="btn btn-outline-secondary mt-2" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
          </form>
          
          )}

          {error && <div className="text-danger mt-3 text-center">{error}</div>}
          {showSuccess && (
            <div className="toast-success mt-3 text-success text-center">
              ✔️ Record successfully submitted!
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AddAuditRecord;