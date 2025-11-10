import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import Dashboard from "./pages/Dashboard";
import AddAuditRecord from "./pages/AddAuditRecord";
import ViewLogs from "./pages/ViewLogs";
import Chatbot from './pages/AuditChatbot';
import AddPatientRecord from "./pages/AddPatientRecord";
import ModifyRecord from "./pages/ModifyRecord";
import DeleteRecord from "./pages/DeleteRecord";
import Layout from "./components/Layout";
import "./styles/theme.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRegisterPage />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add" element={<AddAuditRecord />} />
          <Route path="/logs" element={<ViewLogs />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/add-record" element={<AddPatientRecord />} />
          <Route path="/modify" element={<ModifyRecord />} />
          <Route path="/delete" element={<DeleteRecord />} />

      </Routes>
    </Router>
  );
}

export default App;
