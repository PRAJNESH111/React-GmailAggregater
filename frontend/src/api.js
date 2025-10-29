import axios from "axios";

// Determine API base URL from Vite env, falling back to localhost.
// To use your deployed backend while running the frontend locally,
// create `frontend/.env.local` with:
//   VITE_API_BASE_URL=https://react-gmailaggregater.onrender.com
const { VITE_API_BASE_URL } = import.meta.env;
const API_BASE_URL =
  (typeof VITE_API_BASE_URL === "string" && VITE_API_BASE_URL.trim()) ||
  "http://localhost:5000";

if (import.meta.env.DEV) {
  // Log once in development to help diagnose connectivity issues.
  console.info(`[api] Using backend at ${API_BASE_URL}`);
}

const API = axios.create({
  baseURL: API_BASE_URL,
});

export { API_BASE_URL };
export default API;
