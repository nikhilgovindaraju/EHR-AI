import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../services/api";
import "../styles/addaudit.css"; // Reuse the professional styles
import Layout from "../components/Layout";

function ModifyRecord() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingPatientId = location.state?.patientId;

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!userId || role !== "doctor") {
      navigate("/");
    } else {
      fetchLogs();
    }
  }, []);

  const fetchLogs = async () => {
    try {
      const params = { user_id: userId, role };
      const response = await axios.get("/api/audit/logs", { params });
      setLogs(response.data.logs);
    } catch {
      setError("Failed to load logs.");
    }
  };

  useEffect(() => {
    if (incomingPatientId && logs.length > 0) {
      const match = logs.find((log) => log.patient_id === incomingPatientId);
      if (match) handleEdit(match);
    }
  }, [logs, incomingPatientId]);

  const handleEdit = (log) => {
    setSelectedLog(log);
    setFormData({ ...log });
    setSuccess("");
    setError("");
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      patient_name: formData.patient_name || "",
      age: formData.age !== "" ? parseInt(formData.age) : null,
      gender: formData.gender || "",
      diagnosis: formData.diagnosis || "",
      medication: formData.medication || "",
      notes: formData.notes || "",
      visit_date: formData.visit_date || new Date().toISOString().split("T")[0],
      vitals: formData.vitals || ""
    };

    try {
      await axios.put(`/api/audit/modify-log/${selectedLog.id}`, payload);
      setSuccess("✅ Record updated!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("❌ Update failed:", err.response?.data || err.message);
      if (Array.isArray(err.response?.data?.detail)) {
        const messages = err.response.data.detail.map((d) => d.msg).join(" | ");
        setError(messages);
      } else {
        setError("❌ Update failed.");
      }
    }
  };

  return (
    <Layout>
      <div className="audit-wrapper">
        <div className="audit-form-card">
          <h2><i className="bi bi-pencil-square"></i> Modify Patient Record</h2>

          {selectedLog ? (
            <form onSubmit={handleSubmit}>
              <div className="row gx-4 gy-3">
                <div className="col-md-6">
                  <label className="form-label"><i className="bi bi-person"></i> Patient Name</label>
                  <input className="form-control" name="patient_name" value={formData.patient_name || ""} onChange={handleChange} />
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="bi bi-123"></i> Age</label>
                  <input type="number" className="form-control" name="age" value={formData.age || ""} onChange={handleChange} />
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="bi bi-gender-ambiguous"></i> Gender</label>
                  <select className="form-select" name="gender" value={formData.gender || ""} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="bi bi-clipboard-heart"></i> Diagnosis</label>
                  <input className="form-control" name="diagnosis" value={formData.diagnosis || ""} onChange={handleChange} />
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="bi bi-capsule"></i> Medication</label>
                  <input className="form-control" name="medication" value={formData.medication || ""} onChange={handleChange} />
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="bi bi-calendar-date"></i> Visit Date</label>
                  <input type="date" className="form-control" name="visit_date" value={formData.visit_date || ""} onChange={handleChange} />
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="bi bi-heart-pulse"></i> Vital Signs</label>
                  <input className="form-control" name="vitals" value={formData.vitals || ""} onChange={handleChange} />
                </div>

                <div className="col-md-6">
                  <label className="form-label"><i className="bi bi-journal-text"></i> Doctor's Notes</label>
                  <textarea className="form-control" rows="4" name="notes" value={formData.notes || ""} onChange={handleChange} />
                </div>
              </div>

              <button type="submit" className="btn btn-success w-100 mt-4">
                Update Record
              </button>
              <button type="button" className="btn btn-outline-secondary w-100 mt-2" onClick={() => setSelectedLog(null)}>
                Cancel
              </button>
            </form>
          ) : (
            <>
              <p className="subtext">Click “Edit” to modify a record:</p>
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Diagnosis</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.patient_id}</td>
                      <td>{log.patient_name}</td>
                      <td>{log.diagnosis}</td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => handleEdit(log)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {error && <div className="text-danger text-center mt-3">{error}</div>}
          {success && <div className="text-success text-center mt-3">{success}</div>}
        </div>
      </div>
    </Layout>
  );
}

export default ModifyRecord;
