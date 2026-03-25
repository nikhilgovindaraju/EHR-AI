import axios from "axios";

// Use env var if set, otherwise default to local backend
const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE,   // NO /api suffix here — all page calls already include /api/...
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;