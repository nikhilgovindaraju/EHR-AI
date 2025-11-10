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
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");
  const storedPatientId = localStorage.getItem("patient_id");

  useEffect(() => {
    if (!userId || !role) {
      navigate("/");
    } else {
      fetchLogs();
    }
  }, []);

  const buildParams = (filter = "") => {
    const params = { role };

    if (role === "doctor") {
      params.user_id = userId;
      if (filter) params.patient_id = filter.trim();
    } else if (role === "patient") {
      const pid = (storedPatientId || "").trim();
      if (pid) params.patient_id = pid;
      params.patient_name = userId;
      if (!pid) params.patient_id = userId;
      if (filter) params.patient_id = filter.trim();
    } else if (role === "auditor") {
      if (filter) params.patient_id = filter.trim();
    }

    return params;
  };

  const fetchLogs = async (filter = "") => {
    setLoading(true);
    setError("");
    try {
      const params = buildParams(filter);
      const response = await axios.get("/api/audit/logs", { params });
      const rows = Array.isArray(response?.data?.logs)
        ? response.data.logs
        : [];
      setLogs(rows);
    } catch (err) {
      console.error("Logs fetch error:", err?.response?.data || err.message);
      setError(err?.response?.data?.detail || "Failed to load logs.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(patientFilter.trim());
  };

  const handleClear = () => {
    setPatientFilter("");
    fetchLogs("");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const badgeClass = (action) => {
    const a = (action || "").toLowerCase();
    if (a === "create") return "badge-create";
    if (a === "delete") return "badge-delete";
    if (a === "modify") return "badge-modify";
    return "badge-default";
  };

  return (
    <Layout>
      <div className="viewlogs-wrapper">
        <div className="logs-card">
          {/* ---------- HEADER ---------- */}
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

          {/* ---------- FILTER FORM ---------- */}
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
              onClick={handleClear}
            >
              <i className="bi bi-x-circle"></i> Clear
            </button>
          </form>

          {/* ---------- TABLE ---------- */}
          {loading ? (
            <p className="text-muted mt-4">Loading…</p>
          ) : logs.length > 0 ? (
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
                    <tr key={log.id ?? idx}>
                      <td>
                        {log.timestamp
                          ? new Date(log.timestamp).toLocaleString()
                          : "—"}
                      </td>
                      <td>{log.user_id || "—"}</td>
                      <td>{log.patient_id || "—"}</td>
                      <td>{log.patient_name || "—"}</td>
                      <td>{log.age ?? "—"}</td>
                      <td>{log.diagnosis || "—"}</td>
                      <td>{log.medication || "—"}</td>
                      <td>{(log.notes ?? "").toString().trim() || "—"}</td>
                      <td>
                        <span
                          className={`action-badge ${badgeClass(log.action)}`}
                        >
                          {log.action || "—"}
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

          {/* ---------- ERROR MESSAGE ---------- */}
          {error && <div className="text-danger text-center mt-3">{error}</div>}
        </div>
      </div>
    </Layout>
  );
}

export default ViewLogs;
