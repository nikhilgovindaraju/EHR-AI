import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api"; 
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/loginregister.css"; 
import Layout from "../components/Layout";


function LoginRegisterPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    user_id: "",
    password: "",
    role: ""
  });
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearForm = () => {
    setFormData({ user_id: "", password: "", role: "" });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const res = await axios.post("/login", formData);
        if (res.data?.user_id && res.data?.role) {
          localStorage.setItem("user_id", res.data.user_id);
          localStorage.setItem("role", res.data.role);
          setShowSplash(true);
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000); 
        } else {
          setError("Invalid credentials");
        }
      } else {
        const res = await axios.post("/register", formData);
        if (res.data?.message?.includes("registered successfully")) {
          clearForm();
          setIsLogin(true);
        } else {
          setError("Registration failed");
        }
      }
    } catch (err) {
      setError("Authentication failed. Please check your details.");
    }
  };

  const handleToggleTab = (loginSelected) => {
    setIsLogin(loginSelected);
    clearForm();
  };

  if (showSplash) {
    return (
      <div className="container-box">
        <div className="splash-message">
          <div className="splash-card">
            ✅ Login successful! Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
    <div className="container-box">
      <div className="welcome-card">
        {/* Left Section */}
        <div className="left-side">
          <img src="/images/image1.png" alt="Welcome" className="side-image" />
          <h2 className="title-text">Welcome!</h2>
          <p className="desc-text">
            Empowering secure, tamper-proof access and monitoring of Electronic Health Records (EHR).<br />
            Ensure privacy, authorize access, and safeguard integrity with blockchain-style chaining and encryption.
          </p>
        </div>

        {/* Right Section */}
        <div className="right-side">
          <div className="tab-links">
            <button className={isLogin ? "tab active-tab" : "tab"} onClick={() => handleToggleTab(true)}>Login</button>
            <button className={!isLogin ? "tab active-tab" : "tab"} onClick={() => handleToggleTab(false)}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="form-container">
            <input
              type="text"
              name="user_id"
              placeholder="User ID"
              value={formData.user_id}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select Role</option>
              <option value="doctor">Doctor</option>
              <option value="auditor">Auditor</option>
              <option value="patient">Patient</option>
            </select>

            <button type="submit" className="btn-custom">
              {isLogin ? "Login" : "Register"}
            </button>

            <div style={{ minHeight: "1.5rem" }} className="d-flex justify-content-center align-items-center mt-1">
              {isLogin && (
                <p className="forgot-text mb-0">
                  <a href="#" className="text-danger">Forgot Password?</a>
                </p>
              )}
            </div>

            {error && (
              <div className="text-danger text-center mt-2">{error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
    </Layout>
  );
}

export default LoginRegisterPage;
