import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import "../styles/viewlogs.css";
import Layout from "../components/Layout";

function ViewLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [patientFilter, setPatientFilter] = useState("");
  const [error, setError] = useState("");
  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!userId || !role) {
      navigate("/");
    } else {
      fetchLogs();
    }
  }, [navigate]);

  const fetchLogs = async (filter = "") => {
    try {
      const params = { user_id: userId, role };
      const response = await axios.get("/api/audit/logs", { params });
      const filtered = filter
        ? response.data.logs.filter(log => log.patient_id === filter)
        : response.data.logs;
      setLogs(filtered);
    } catch (err) {
      setError("Failed to load logs.");
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(patientFilter.trim());
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const badgeClass = (action) => {
    if (action === "create") return "badge-create";
    if (action === "delete") return "badge-delete";
    return "badge-default";
  };

  return (
    <Layout>
    <div className="viewlogs-wrapper">
      <div className="logs-card">
      <div className="logs-header">
  <button className="back-btn" onClick={() => navigate("/dashboard")}>
    <i className="bi bi-arrow-left"></i> Back
  </button>
  <h2>
    <i className="bi bi-clipboard-data"></i> Audit Logs
  </h2>
  <p className="subtext">
    Logged in as <strong>{userId}</strong> ({role})
  </p>
  <button className="logout-btn" onClick={handleLogout}>
    <i className="bi bi-box-arrow-right"></i> Logout
  </button>
</div>


        {role === "auditor" && (
          <form onSubmit={handleFilter} className="filter-form">
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Patient ID"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-search"></i> Filter
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setPatientFilter("");
                fetchLogs();
              }}
            >
              <i className="bi bi-x-circle"></i> Clear
            </button>
          </form>
        )}

        {logs.length > 0 ? (
          <div className="logs-table-wrapper">
            <p className="record-count">📄 {logs.length} records found</p>
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User ID</th>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Diagnosis</th>
                  <th>Medication</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.user_id}</td>
                    <td>{log.patient_id}</td>
                    <td>{log.patient_name || "—"}</td>
                    <td>{log.age || "—"}</td>
                    <td>{log.diagnosis || "—"}</td>
                    <td>{log.medication || "—"}</td>
                    <td>{log.data || "—"}</td>
                    <td>
                      <span className={`action-badge ${badgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted mt-4">No logs available.</p>
        )}

        {error && <div className="text-danger text-center mt-3">{error}</div>}
      </div>
    </div>
    </Layout>
  );
}

export default ViewLogs;
