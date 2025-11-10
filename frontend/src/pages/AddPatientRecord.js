import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../services/api";
import "../styles/addaudit.css"; 
import Layout from "../components/Layout";

function AddPatientRecord() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [formData, setFormData] = useState({
    patient_id: "",
    patient_name: "",
    age: "",
    diagnosis: "",
    medication: "",
    data: ""
  });

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        user_id: userId,
        action: "create",
        ...formData,
        age: parseInt(formData.age)
      };

      const response = await axios.post("/api/audit/add-log", payload, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("Add patient record response:", response.data);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/dashboard");
      }, 3000);
    } catch (err) {
      console.error("Error adding record:", err);
      setError("❌ Failed to add patient record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
    <div className="audit-wrapper">
      <div className="audit-form-card">
        <h2><i className="bi bi-person-plus-fill"></i> Add Patient Record</h2>

        <form onSubmit={handleSubmit}>
          {[
            { label: "Patient ID", name: "patient_id" },
            { label: "Patient Name", name: "patient_name" },
            { label: "Age", name: "age", type: "number" },
            { label: "Diagnosis", name: "diagnosis" },
            { label: "Medication", name: "medication" }
          ].map(({ label, name, type = "text" }) => (
            <div className="mb-3 text-start" key={name}>
              <label className="form-label">{label}</label>
              <input
                type={type}
                className="form-control"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                required
              />
            </div>
          ))}

          <div className="mb-4 text-start">
            <label className="form-label">Notes / Reason</label>
            <textarea
              className="form-control"
              name="data"
              value={formData.data}
              onChange={handleChange}
              placeholder="Why are you creating this record?"
              rows={3}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Submitting..." : "Submit Record"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary w-100 mt-2"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>

          {error && <div className="text-danger mt-3 text-center">{error}</div>}
        </form>

        {showSuccess && (
          <div className="toast-success mt-3 text-success text-center">
            ✔️ Patient record added successfully!
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}

export default AddPatientRecord;
