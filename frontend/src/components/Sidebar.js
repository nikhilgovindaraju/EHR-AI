import React from "react";
import { useNavigate } from "react-router-dom";

const NAV = [
  { key: "dashboard", label: "Dashboard",      icon: "bi-grid-fill",          path: "/dashboard" },
  { key: "logs",      label: "Audit Logs",     icon: "bi-journal-text",       path: "/logs" },
  { key: "add",       label: "Add Record",     icon: "bi-plus-circle-fill",   path: "/add",     doctorOnly: true },
  { key: "modify",    label: "Modify Record",  icon: "bi-pencil-square",      path: "/modify",  doctorOnly: true },
  { key: "delete",    label: "Delete Record",  icon: "bi-trash3-fill",        path: "/delete",  doctorOnly: true },
  { key: "validate",  label: "Validate Chain", icon: "bi-shield-check",       path: "/validate" },
];

export default function Sidebar({ activeItem }) {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id") || "User";
  const role   = localStorage.getItem("role") || "user";

  function handleLogout() {
    localStorage.clear();
    navigate("/");
  }

  const initials = userId.slice(0, 2).toUpperCase();
  const visibleNav = NAV.filter(n => !n.doctorOnly || role === "doctor");

  return (
    <aside className="ehr-sidebar">
      <div className="ehr-sidebar-logo">
        <div className="ehr-logo-row">
          <div className="ehr-logo-icon">
            <i className="bi bi-shield-fill-check" />
          </div>
          <div>
            <div className="ehr-logo-name">SecureEHR</div>
            <div className="ehr-logo-sub">Clinical Records Platform</div>
          </div>
        </div>
      </div>

      <nav className="ehr-sidebar-nav">
        <div className="ehr-nav-section">Navigation</div>
        {visibleNav.map(item => (
          <button
            key={item.key}
            className={`ehr-nav-item${activeItem === item.key ? " active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <i className={`bi ${item.icon}`} />
            {item.label}
          </button>
        ))}

        <div className="ehr-nav-section" style={{ marginTop: 8 }}>Security</div>
        <div
          style={{
            margin: "4px 12px",
            padding: "10px 12px",
            background: "rgba(77,158,255,0.07)",
            border: "1px solid rgba(77,158,255,0.15)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <i className="bi bi-lock-fill" style={{ color: "#4D9EFF", fontSize: 13 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#4D9EFF" }}>AES-128 + RSA-2048</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <i className="bi bi-link-45deg" style={{ color: "#4D9EFF", fontSize: 13 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#4D9EFF" }}>SHA-256 Hash Chain</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="bi bi-people-fill" style={{ color: "#4D9EFF", fontSize: 13 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#4D9EFF" }}>Role-Based Access</span>
          </div>
        </div>
      </nav>

      <div className="ehr-sidebar-footer">
        <div className="ehr-user-row">
          <div className="ehr-avatar">{initials}</div>
          <div>
            <div className="ehr-user-name">{userId}</div>
            <div className="ehr-user-role">{role}</div>
          </div>
          <button className="ehr-logout-btn" onClick={handleLogout} title="Sign out">
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </div>
    </aside>
  );
}
