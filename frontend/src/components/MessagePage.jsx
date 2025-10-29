import React, { useEffect, useState } from "react";
import axios from "../api";

const MessagePage = ({ route, onClose }) => {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthProblem, setIsAuthProblem] = useState(false);

  useEffect(() => {
    // If the navigation included an email object in history.state, use it directly
    const stateEmail = window.history.state?.email;
    if (stateEmail) {
      setMessage(stateEmail);
      setLoading(false);
      setError(null);
      return;
    }
    const params = new URLSearchParams(
      (route && route.split("?")[1]) || window.location.search
    );
    const userId = params.get("userId");
    const id = params.get("id");
    if (!userId || !id) {
      setError("Missing userId or message id in URL");
      return;
    }

    const fetchMessage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `/gmail/message?userId=${encodeURIComponent(
            userId
          )}&id=${encodeURIComponent(id)}`
        );
        setMessage(res.data);
      } catch (err) {
        const details =
          err?.response?.data?.details ||
          err?.message ||
          "Failed to load message";
        setError(details);
        const status = err?.response?.status;
        const authProblem =
          status === 401 ||
          (typeof details === "string" &&
            (details.toLowerCase().includes("insufficient") ||
              details.toLowerCase().includes("authentication") ||
              details.toLowerCase().includes("invalid")));
        setIsAuthProblem(Boolean(authProblem));
      } finally {
        setLoading(false);
      }
    };

    fetchMessage();
  }, [route]);

  return (
    <div className="card p-3" style={{ height: "100%" }}>
      <div className="d-flex justify-content-between mb-3">
        <div>
          <button
            className="btn btn-sm btn-outline-secondary me-2"
            onClick={onClose}
          >
            Back
          </button>
        </div>
      </div>

      {loading && <div>Loading message…</div>}
      {error && <div className="text-danger">{error}</div>}

      {isAuthProblem && (
        <div className="mt-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              // Force re-auth flow
              window.location.href = `http://localhost:5000/auth/google?force=true`;
            }}
          >
            Re-authenticate
          </button>
        </div>
      )}

      {message && (
        <div>
          <h5>{message.subject}</h5>
          <div className="text-muted small mb-2">
            From: {message.from} — {message.date}
          </div>
          <div
            className="message-body"
            dangerouslySetInnerHTML={{
              __html: message.body || message.snippet,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MessagePage;
