import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import Dashboard from "./pages/Dashboard";
import AddAuditRecord from "./pages/AddAuditRecord";
import ViewLogs from "./pages/ViewLogs";
import ModifyRecord from "./pages/ModifyRecord";
import DeleteRecord from "./pages/DeleteRecord";
import PatientProfile from "./pages/PatientProfile";
import ValidateChain from "./pages/ValidateChain";
import "./styles/theme.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                     element={<LoginRegisterPage />} />
        <Route path="/dashboard"            element={<Dashboard />} />
        <Route path="/add"                  element={<AddAuditRecord />} />
        <Route path="/logs"                 element={<ViewLogs />} />
        <Route path="/modify"               element={<ModifyRecord />} />
        <Route path="/delete"               element={<DeleteRecord />} />
        <Route path="/patient/:patientId"   element={<PatientProfile />} />
        <Route path="/validate"             element={<ValidateChain />} />
      </Routes>
    </Router>
  );
}

export default App;
