import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/dashboard.css";
import AuditChatbot from "../pages/AuditChatbot";
import Layout from "../components/Layout";

function Dashboard() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id") || "";
  const role = localStorage.getItem("role") || "";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <Layout>
    <div className="dashboard-wrapper">
      <div className="dashboard-card-elevated">
        {/* Left Column */}
        <div className="dashboard-left">
          <img
            src="/images/image2.png"
            alt="EHR Illustration"
            className="dashboard-img"
          />
          <div className="dashboard-tagline">
            Secure, Transparent, Accountable
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          <h2 className="dashboard-welcome">
            <i className="bi bi-shield-lock-fill"></i>
            Welcome, <span className="dashboard-user">{user_id}</span>
            <span className="dashboard-role">
              ({role.charAt(0).toUpperCase() + role.slice(1)})
            </span>
          </h2>

          <div className="dashboard-buttons">
            {/* View Logs */}
            <div
              className="dashboard-action-card"
              onClick={() => navigate("/logs")}
            >
              <div className="card-icon">
                <i className="bi bi-journal-text"></i>
              </div>
              <div className="card-label">View Logs</div>
              <div className="card-subtext">See complete audit history</div>
            </div>

            {/* Add Record with options inside */}
            {role === "doctor" && (
              <div
                className="dashboard-action-card"
                onClick={() => navigate("/add")}
              >
                <div className="card-icon">
                  <i className="bi bi-plus-circle"></i>
                </div>
                <div className="card-label">Add Record</div>
                <div className="card-subtext">Create, modify, or delete a record</div>
              </div>
            )}

            {/* Logout */}
            <div
              className="dashboard-action-card logout"
              onClick={handleLogout}
            >
              <div className="card-icon">
                <i className="bi bi-box-arrow-right"></i>
              </div>
              <div className="card-label">Logout</div>
              <div className="card-subtext">Sign out from the portal</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot */}
        <AuditChatbot />
    </div>
    </Layout>
  );
}

export default Dashboard;
