import { createRoot } from "react-dom/client";
import App from "./AppClean.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
