export const mockLogin = async ({ user_id, password, role }) => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
  
    if (!user_id || !password) throw new Error("Missing fields");
  
    // Fake response
    return { role };
  };
  
  export const mockLogs = async (user_id, role) => {
    await new Promise(resolve => setTimeout(resolve, 300));
  
    const allLogs = [
      { user_id: "doctor1", patient_id: "patient1", action: "create", timestamp: new Date().toISOString(), signature: "abc123" },
      { user_id: "doctor1", patient_id: "patient2", action: "change", timestamp: new Date().toISOString(), signature: "def456" },
      { user_id: "auditor1", patient_id: "patient1", action: "query", timestamp: new Date().toISOString(), signature: "ghi789" },
    ];
  
    if (role === "auditor") return allLogs;
    if (role === "patient") return allLogs.filter(log => log.patient_id === user_id);
    return [];
  };
  
  export const mockAddLog = async (logData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Log added (mock):", logData);
    return { message: "Success" };
  };
  