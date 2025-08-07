import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../services/api";
import "../styles/viewlogs.css";
import Layout from "../components/Layout";

function DeleteRecord() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingPatientId = location.state?.patientId;

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
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
      if (match) setSelectedLog(match);
      else setError("No matching patient found.");
    }
  }, [logs, incomingPatientId]);

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/audit/delete-log/${selectedLog.id}`);
      setSuccess("✅ Record deleted!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch {
      setError("❌ Delete failed.");
    }
  };

  return (
    <Layout>
    <div className="viewlogs-wrapper">
      <div className="logs-card">
        <h2><i className="bi bi-trash"></i> Delete Patient Record</h2>

        {selectedLog ? (
          <>
            <p>Are you sure you want to permanently delete the record for:</p>
            <ul>
              <li><strong>Patient ID:</strong> {selectedLog.patient_id}</li>
              <li><strong>Name:</strong> {selectedLog.patient_name}</li>
              <li><strong>Diagnosis:</strong> {selectedLog.diagnosis}</li>
              <li><strong>Visit Date:</strong> {selectedLog.visit_date}</li>
            </ul>
            <button className="btn btn-danger w-100 mb-2" onClick={handleDelete}>
              Confirm Delete
            </button>
            <button className="btn btn-outline-secondary w-100" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
          </>
        ) : (
          <p className="text-muted">Loading patient record...</p>
        )}

        {error && <div className="text-danger mt-3 text-center">{error}</div>}
        {success && <div className="text-success mt-3 text-center">{success}</div>}
      </div>
    </div>
    </Layout>
  );
}

export default DeleteRecord;
